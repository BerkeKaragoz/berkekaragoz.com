import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Tooltip from "@/components/atomic/Tooltip/Tooltip"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import {
   ConvertedToken,
   DictionaryChunk,
   dictionaryChunksForPrediction,
   mergeDictionaryChunks,
   tokeniseWithDictionary,
   wordsInText,
} from "@/features/ipa/converter"
import {
   IPA_SOUNDS,
   IpaSound,
   SoundCategory,
   sortSoundsForGuide,
   splitIpaIntoSounds,
} from "@/features/ipa/sounds"
import { IPA_TNS } from "@/features/ipa/i18n"
import { getIpaStaticProps } from "@/features/ipa/pageProps"
import {
   CheckIcon,
   ClipboardCopyIcon,
   PlayIcon,
   RefreshIcon,
   SearchIcon,
   SpeakerphoneIcon,
   StopIcon,
   VolumeUpIcon,
} from "@heroicons/react/solid"
import { cn } from "@shortkit/cn"
import { NextPage } from "next"
import { useTranslation } from "next-i18next"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import React, { useEffect, useMemo, useRef, useState } from "react"
import styles from "./ipa.module.css"

type View = "sounds" | "converter"
type CategoryFilter = SoundCategory | "all"

const EXAMPLE_TEXT = "A bright blue bird sang near the old oak tree."
const CONVERTER_INPUT_KEY = "ipa-converter-input"
const RANDOM_TEXT_URL =
   "https://en.wikipedia.org/w/api.php?action=query&generator=random&grnnamespace=0&grnminsize=1000&grnlimit=1&prop=extracts&exintro=1&explaintext=1&exsentences=4&format=json&formatversion=2&origin=*"

const fetchRandomText = async (signal: AbortSignal) => {
   const response = await fetch(RANDOM_TEXT_URL, {
      cache: "no-store",
      signal,
   })
   if (!response.ok) throw new Error()

   const data = (await response.json()) as {
      query?: { pages?: { extract?: unknown }[] }
   }
   const extract = data.query?.pages?.[0]?.extract
   if (typeof extract !== "string" || !extract.trim()) throw new Error()

   return extract.trim()
}

const viewRoutes: Record<View, string> = {
   sounds: "/english-ipa",
   converter: "/english-ipa/text-to-ipa",
}

const categoryOrder: CategoryFilter[] = [
   "all",
   "consonant",
   "monophthong",
   "diphthong",
]

const ipaMarkGuides = [
   {
      id: "stress",
      symbol: "ˈ  ˌ",
      name: "Stress",
      example: "/əˈbaʊt/",
      description:
         "Primary ˈ and secondary ˌ stress appear before the syllable that receives the emphasis.",
   },
   {
      id: "length",
      symbol: "ː",
      name: "Length",
      example: "/iː/",
      description:
         "Hold the sound before this mark for longer. The mark is not pronounced separately.",
   },
   {
      id: "syllableBreak",
      symbol: ".",
      name: "Syllable break",
      example: "/ˈbet.ə/",
      description:
         "A dot shows where one syllable ends and the next begins. It does not add a pause.",
   },
   {
      id: "brackets",
      symbol: "/ /  [ ]",
      name: "Transcription brackets",
      example: "/r/  [ɹ]",
      description:
         "Slashes show meaning-changing sounds; square brackets show finer details of an actual pronunciation.",
   },
   {
      id: "diacritics",
      symbol: "◌̩  ◌̃",
      name: "Diacritics",
      example: "[l̩]  [æ̃]",
      description:
         "Small marks attach to a sound. These examples mean syllabic and nasalised; broad transcriptions often omit them.",
   },
   {
      id: "intonation",
      symbol: "↗  ↘",
      name: "Pitch and intonation",
      example: "/ˈrɪə.li/ ↗",
      description:
         "Arrows can show rising or falling pitch in teaching material. This word converter omits them because intonation depends on the full sentence.",
   },
]

export const getStaticProps = getIpaStaticProps

const getPreferredVoice = (voices: SpeechSynthesisVoice[]) =>
   voices.find(
      (voice) =>
         voice.lang.toLowerCase() === "en-gb" &&
         /sonia|libby|george|ryan|female|male/i.test(voice.name)
   ) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb"))

const useBritishSpeech = () => {
   const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
   const [speechApiAvailable, setSpeechApiAvailable] = useState(false)
   const [message, setMessage] = useState("")
   const [isSpeaking, setIsSpeaking] = useState(false)
   const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null)

   useEffect(() => {
      if (!("speechSynthesis" in window)) return
      setSpeechApiAvailable(true)

      const refreshVoices = () => {
         setVoices(
            window.speechSynthesis
               .getVoices()
               .filter((voice) => voice.lang.toLowerCase().startsWith("en-gb"))
         )
      }

      refreshVoices()
      window.speechSynthesis.addEventListener("voiceschanged", refreshVoices)

      return () =>
         window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices)
   }, [])

   useEffect(
      () => () => {
         if ("speechSynthesis" in window) window.speechSynthesis.cancel()
      },
      []
   )

   const stop = () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel()
      activeUtterance.current = null
      setIsSpeaking(false)
   }

   const speak = (text: string, rate = 0.82) => {
      if (!("speechSynthesis" in window)) return false

      const voice = getPreferredVoice(voices)
      if (!voice) return false

      stop()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.voice = voice
      utterance.lang = "en-GB"
      utterance.rate = rate
      utterance.pitch = 1
      const finish = () => {
         if (activeUtterance.current !== utterance) return
         activeUtterance.current = null
         setIsSpeaking(false)
      }
      utterance.onend = finish
      utterance.onerror = finish
      activeUtterance.current = utterance
      window.speechSynthesis.speak(utterance)
      setIsSpeaking(true)
      setMessage("")
      return true
   }

   const canSpeak = speechApiAvailable && Boolean(getPreferredVoice(voices))

   return { canSpeak, isSpeaking, message, setMessage, speak, stop }
}

const SoundButton = ({
   children,
   label,
   onClick,
   secondary = false,
}: {
   children: React.ReactNode
   label: string
   onClick: () => void
   secondary?: boolean
}) => (
   <button
      type="button"
      className={`${styles.actionButton} ${
         secondary ? styles.secondaryButton : styles.primaryButton
      }`}
      onClick={onClick}
      aria-label={label}
   >
      <VolumeUpIcon aria-hidden="true" />
      {children}
   </button>
)

const SoundCard = ({
   active,
   onPlay,
   onSelect,
   sound,
}: {
   active: boolean
   onPlay: () => void
   onSelect: () => void
   sound: IpaSound
}) => {
   const { t } = useTranslation(IPA_TNS)

   return (
      <article
         className={`${styles.soundCard} ${active ? styles.soundCardActive : ""}`}
      >
         <button
            type="button"
            className={styles.soundCardSelect}
            onClick={onSelect}
            aria-pressed={active}
            aria-label={t("soundsUi.openGuide", { symbol: sound.symbol })}
         >
            <span className={styles.soundSymbol}>/{sound.symbol}/</span>
            <span className={styles.soundExample}>
               <span className={styles.soundExampleWord}>{sound.example}</span>
               <span className={styles.soundExampleIpa}>
                  <span aria-hidden="true">· </span>/{sound.exampleIpa}/
               </span>
            </span>
         </button>
         <button
            type="button"
            className={styles.soundCardPlay}
            onClick={onPlay}
            aria-label={t("soundsUi.playSound", { symbol: sound.symbol })}
            title={t("soundsUi.playSymbol", { symbol: sound.symbol })}
         >
            <VolumeUpIcon aria-hidden="true" />
         </button>
      </article>
   )
}

const SoundDetail = ({
   onPlaySound,
   onPlayWord,
   onSelectSound,
   sound,
}: {
   onPlaySound: () => void
   onPlayWord: () => void
   onSelectSound: (id: string) => void
   sound: IpaSound
}) => {
   const { t } = useTranslation(IPA_TNS)
   const translatedName = t(`sounds.${sound.id}.name`, {
      defaultValue: sound.name,
   })

   return (
      <aside
         className={`card ${styles.detailPanel}`}
         aria-label={t("soundsUi.guideLabel", { symbol: sound.symbol })}
      >
         <div className={styles.detailHeader}>
            <div>
               <p className={styles.eyebrow}>{t(`categories.${sound.category}`)}</p>
               <h2 className={styles.detailSymbol}>/{sound.symbol}/</h2>
               <p className={styles.detailName}>{translatedName}</p>
            </div>
            <div className={styles.detailExample}>
               <span>{sound.example}</span>
               <span>/{sound.exampleIpa}/</span>
            </div>
         </div>

         <div className={styles.audioActions}>
            <SoundButton
               label={t("soundsUi.playSound", { symbol: sound.symbol })}
               onClick={onPlaySound}
            >
               {t("actions.sound")}
            </SoundButton>
            <SoundButton
               label={t("soundsUi.playWord", { word: sound.example })}
               onClick={onPlayWord}
               secondary
            >
               {t("actions.inWord", { word: sound.example })}
            </SoundButton>
         </div>

         <div className={styles.howTo}>
            <p className={styles.sectionLabel}>{t("soundsUi.howTo")}</p>
            <ol>
               {sound.instructions.map((instruction, index) => (
                  <li key={`${sound.id}-${index}`}>
                     <span>{index + 1}</span>
                     {t(`sounds.${sound.id}.instructions.${index}`, {
                        defaultValue: instruction,
                     })}
                  </li>
               ))}
            </ol>
         </div>

         <div className={styles.detailMeta}>
            <div>
               <p className={styles.sectionLabel}>{t("soundsUi.commonSpellings")}</p>
               <div className={styles.chipRow}>
                  {sound.spellings.map((spelling) => (
                     <span className={`card ${styles.plainChip}`} key={spelling}>
                        {spelling}
                     </span>
                  ))}
               </div>
            </div>
            {sound.confusedWith.length > 0 && (
               <div>
                  <p className={styles.sectionLabel}>{t("soundsUi.compareWith")}</p>
                  <div className={styles.chipRow}>
                     {sound.confusedWith.map((id) => {
                        const comparison = IPA_SOUNDS.find((item) => item.id === id)
                        if (!comparison) return null

                        return (
                           <button
                              type="button"
                              className={styles.compareChip}
                              key={id}
                              onClick={() => onSelectSound(id)}
                           >
                              /{comparison.symbol}/
                           </button>
                        )
                     })}
                  </div>
               </div>
            )}
         </div>

         {sound.variationNote && (
            <p className={styles.variationNote}>
               {t(`sounds.${sound.id}.variationNote`, {
                  defaultValue: sound.variationNote,
               })}
            </p>
         )}
      </aside>
   )
}

const SoundsView = ({
   onPlay,
   onSelect,
   selected,
}: {
   onPlay: (sound: IpaSound, kind: "sound" | "word") => void
   onSelect: (sound: IpaSound) => void
   selected: IpaSound
}) => {
   const { t } = useTranslation(IPA_TNS)
   const [category, setCategory] = useState<CategoryFilter>("all")
   const [query, setQuery] = useState("")

   const results = useMemo(() => {
      const normalisedQuery = query.trim().toLocaleLowerCase("en-GB")

      return sortSoundsForGuide(
         IPA_SOUNDS.filter((sound) => {
            const matchesCategory = category === "all" || sound.category === category
            const matchesQuery =
               !normalisedQuery ||
               sound.symbol.includes(normalisedQuery) ||
               sound.example.toLowerCase().includes(normalisedQuery) ||
               sound.name.toLowerCase().includes(normalisedQuery) ||
               t(`sounds.${sound.id}.name`, {
                  defaultValue: sound.name,
               })
                  .toLocaleLowerCase()
                  .includes(normalisedQuery) ||
               sound.spellings.some((spelling) =>
                  spelling.toLowerCase().includes(normalisedQuery)
               )

            return matchesCategory && matchesQuery
         })
      )
   }, [category, query, t])

   return (
      <section className={styles.soundsLayout} aria-labelledby="sounds-title">
         <div className={styles.soundsColumns}>
            <div className={styles.library}>
               <div className={styles.libraryHeader}>
                  <div>
                     <p className={styles.eyebrow}>{t("soundsUi.reference")}</p>
                     <h2 id="sounds-title">{t("soundsUi.title")}</h2>
                  </div>
                  <label className={styles.searchBox}>
                     <SearchIcon aria-hidden="true" />
                     <span className="sr-only">{t("soundsUi.searchLabel")}</span>
                     <input
                        type="search"
                        value={query}
                        placeholder={t("soundsUi.searchPlaceholder")}
                        onChange={(event) => setQuery(event.target.value)}
                     />
                  </label>
               </div>

               <div
                  className={styles.filters}
                  aria-label={t("soundsUi.filterLabel")}
               >
                  {categoryOrder.map((option) => (
                     <button
                        key={option}
                        type="button"
                        className={styles.filterButton}
                        aria-pressed={category === option}
                        onClick={() => setCategory(option)}
                     >
                        {t(`categories.${option}`)}
                        <span>
                           {option === "all"
                              ? IPA_SOUNDS.length
                              : IPA_SOUNDS.filter(
                                   (sound) => sound.category === option
                                ).length}
                        </span>
                     </button>
                  ))}
               </div>

               {results.length > 0 ? (
                  <div className={styles.soundGrid}>
                     {results.map((sound) => (
                        <SoundCard
                           key={sound.id}
                           sound={sound}
                           active={selected.id === sound.id}
                           onPlay={() => {
                              onSelect(sound)
                              onPlay(sound, "sound")
                           }}
                           onSelect={() => onSelect(sound)}
                        />
                     ))}
                  </div>
               ) : (
                  <p className={`card-backdrop ${styles.emptyState}`}>
                     {t("soundsUi.empty", { query })}
                  </p>
               )}
            </div>

            <div className={styles.detailRail}>
               <SoundDetail
                  sound={selected}
                  onPlaySound={() => onPlay(selected, "sound")}
                  onPlayWord={() => onPlay(selected, "word")}
                  onSelectSound={(id) => {
                     const sound = IPA_SOUNDS.find((item) => item.id === id)
                     if (sound) onSelect(sound)
                  }}
               />
            </div>
         </div>

         <details className={`card ${styles.marksGuide}`}>
            <summary>
               <div>
                  <p className={styles.eyebrow}>{t("marks.eyebrow")}</p>
                  <h3>{t("marks.title")}</h3>
               </div>
               <span>{t("marks.summary")}</span>
            </summary>
            <div className={styles.marksContent}>
               <p>{t("marks.intro")}</p>
               <div className={styles.markGrid}>
                  {ipaMarkGuides.map((mark) => (
                     <article className={styles.markItem} key={mark.id}>
                        <div className={styles.markHeader}>
                           <span className={styles.markSymbol}>{mark.symbol}</span>
                           <span className={styles.markExample}>{mark.example}</span>
                        </div>
                        <h4>
                           {t(`marks.items.${mark.id}.name`, {
                              defaultValue: mark.name,
                           })}
                        </h4>
                        <p>
                           {t(`marks.items.${mark.id}.description`, {
                              defaultValue: mark.description,
                           })}
                        </p>
                     </article>
                  ))}
               </div>
            </div>
         </details>
      </section>
   )
}

const ConverterView = ({
   canSpeak,
   isSpeaking,
   onPlay,
   onPlaySound,
   onSelectSound,
   onStop,
}: {
   canSpeak: boolean
   isSpeaking: boolean
   onPlay: (text: string, rate?: number) => void
   onPlaySound: (sound: IpaSound) => void
   onSelectSound: (sound: IpaSound) => void
   onStop: () => void
}) => {
   const { t } = useTranslation(IPA_TNS)
   const dictionaryCache = useRef<Record<string, DictionaryChunk>>({})
   const prefetchedRandomText = useRef<string | null>(null)
   const [input, setInput] = useState(EXAMPLE_TEXT)
   const [inputHydrated, setInputHydrated] = useState(false)
   const [convertedInput, setConvertedInput] = useState<string | null>(null)
   const [tokens, setTokens] = useState<ConvertedToken[]>([])
   const [choices, setChoices] = useState<Record<number, number>>({})
   const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState("")
   const [copied, setCopied] = useState(false)
   const [randomTextAvailable, setRandomTextAvailable] = useState(false)
   const [randomTextLoading, setRandomTextLoading] = useState(false)

   useEffect(() => {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 4000)
      let active = true

      void fetchRandomText(controller.signal)
         .then((text) => {
            if (!active) return
            prefetchedRandomText.current = text
            setRandomTextAvailable(true)
         })
         .catch(() => {
            if (active) setRandomTextAvailable(false)
         })
         .finally(() => window.clearTimeout(timeout))

      return () => {
         active = false
         window.clearTimeout(timeout)
         controller.abort()
      }
   }, [])

   useEffect(() => {
      const storedInput = window.sessionStorage.getItem(CONVERTER_INPUT_KEY)
      if (storedInput !== null) setInput(storedInput)
      setInputHydrated(true)
   }, [])

   useEffect(() => {
      if (!inputHydrated) return

      window.sessionStorage.setItem(CONVERTER_INPUT_KEY, input)
   }, [input, inputHydrated])

   const convert = async () => {
      const sourceText = input

      if (!sourceText.trim()) {
         setTokens([])
         setSelectedIndex(null)
         return
      }

      if (loading || sourceText === convertedInput) return

      setLoading(true)
      setError("")

      try {
         const letters = Array.from(
            new Set(wordsInText(sourceText).flatMap(dictionaryChunksForPrediction))
         )
         const chunks = await Promise.all(
            letters.map(async (letter) => {
               if (dictionaryCache.current[letter])
                  return dictionaryCache.current[letter]

               const response = await fetch(
                  `/data/ipa/en-GB/${encodeURIComponent(letter)}.json`
               )
               if (!response.ok) throw new Error()

               const chunk = (await response.json()) as DictionaryChunk
               dictionaryCache.current[letter] = chunk
               return chunk
            })
         )

         const nextTokens = tokeniseWithDictionary(
            sourceText,
            mergeDictionaryChunks(chunks)
         )
         setTokens(nextTokens)
         setConvertedInput(sourceText)
         setChoices({})
         setSelectedIndex(
            nextTokens.findIndex(
               (token) => token.type === "word" && token.pronunciations.length
            )
         )
      } catch {
         setError(t("converter.dictionaryError"))
      } finally {
         setLoading(false)
      }
   }

   useEffect(() => {
      void convert()
      // The example is converted once on entry; later conversion is deliberate.
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [])

   const ipaText = tokens
      .map((token, index) => {
         if (token.type === "separator") return token.source
         return token.pronunciations[choices[index] ?? 0] ?? token.source
      })
      .join("")

   const selectedToken =
      selectedIndex === null ? null : (tokens[selectedIndex] ?? null)
   const selectedPronunciation =
      selectedToken?.type === "word"
         ? selectedToken.pronunciations[choices[selectedIndex ?? 0] ?? 0]
         : undefined
   const selectedSounds = selectedPronunciation
      ? splitIpaIntoSounds(selectedPronunciation)
      : []
   const unknownCount = tokens.filter(
      (token) => token.type === "word" && token.pronunciations.length === 0
   ).length
   const predictedCount = tokens.filter(
      (token) => token.type === "word" && token.predicted
   ).length
   const canConvert = Boolean(input.trim()) && !loading && input !== convertedInput

   const copyIpa = async () => {
      if (!ipaText) return
      await navigator.clipboard.writeText(ipaText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
   }

   const fillWithRandomText = async () => {
      setRandomTextLoading(true)
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 4000)

      try {
         const text =
            prefetchedRandomText.current ??
            (await fetchRandomText(controller.signal))
         prefetchedRandomText.current = null
         setInput(text.slice(0, 10000))
      } catch {
         setRandomTextAvailable(false)
      } finally {
         window.clearTimeout(timeout)
         setRandomTextLoading(false)
      }
   }

   const fullTextPlayButton = (
      <button
         type="button"
         className={styles.iconButton}
         disabled={!canSpeak}
         onClick={() => (isSpeaking ? onStop() : onPlay(input, 0.78))}
         aria-label={
            isSpeaking
               ? t("converter.stopPronunciation")
               : t("converter.playFullText")
         }
      >
         {isSpeaking ? (
            <StopIcon aria-hidden="true" />
         ) : (
            <SpeakerphoneIcon aria-hidden="true" />
         )}
         {isSpeaking ? t("actions.stop") : t("actions.play")}
      </button>
   )

   return (
      <section
         className={styles.converterLayout}
         aria-label={t("converter.ariaLabel")}
      >
         <div className={`card ${styles.converterCard}`}>
            <div className={styles.inputHeader}>
               <label htmlFor="ipa-input">{t("converter.englishText")}</label>
               <div className={styles.inputHeaderActions}>
                  {randomTextAvailable && (
                     <button
                        type="button"
                        className={styles.randomTextButton}
                        disabled={randomTextLoading}
                        onClick={() => void fillWithRandomText()}
                     >
                        <RefreshIcon aria-hidden="true" />
                        {t(
                           randomTextLoading
                              ? "converter.loadingRandomText"
                              : "converter.randomText"
                        )}
                     </button>
                  )}
                  {input.length >= 9000 && <span>{input.length}/10000</span>}
               </div>
            </div>
            <textarea
               id="ipa-input"
               value={input}
               maxLength={10000}
               rows={4}
               spellCheck
               onChange={(event) => setInput(event.target.value)}
               onKeyDown={(event) => {
                  if (
                     canConvert &&
                     (event.metaKey || event.ctrlKey) &&
                     event.key === "Enter"
                  )
                     void convert()
               }}
            />
            <div className={styles.convertActions}>
               <button
                  type="button"
                  className={`${styles.actionButton} ${styles.primaryButton}`}
                  disabled={!canConvert}
                  onClick={() => void convert()}
               >
                  {loading ? t("converter.converting") : t("converter.convert")}
               </button>
               <span>Ctrl + Enter</span>
            </div>
         </div>

         {error && (
            <p className={styles.errorMessage} role="alert">
               {error}
            </p>
         )}

         {tokens.length > 0 && (
            <div className={`card ${styles.resultCard}`}>
               <div className={styles.resultHeader}>
                  <div>
                     <p className={styles.sectionLabel}>
                        {t("converter.englishPronunciation")}
                     </p>
                     {unknownCount > 0 && (
                        <span>
                           {t("converter.wordsNotFound", { count: unknownCount })}
                        </span>
                     )}
                     {predictedCount > 0 && (
                        <span>
                           {t("converter.predictions", { count: predictedCount })}
                        </span>
                     )}
                  </div>
                  <div className={styles.resultActions}>
                     {canSpeak ? (
                        fullTextPlayButton
                     ) : (
                        <Tooltip
                           text={t("converter.textToSpeechUnavailable")}
                           className={styles.playUnavailableTooltip}
                        >
                           <span className={styles.disabledPlayWrapper}>
                              {fullTextPlayButton}
                           </span>
                        </Tooltip>
                     )}
                     <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => void copyIpa()}
                     >
                        {copied ? (
                           <CheckIcon aria-hidden="true" />
                        ) : (
                           <ClipboardCopyIcon aria-hidden="true" />
                        )}
                        {copied ? t("actions.copied") : t("actions.copy")}
                     </button>
                  </div>
               </div>

               <div
                  className={styles.ipaResult}
                  aria-label={t("converter.convertedIpa")}
               >
                  <span aria-hidden="true">/</span>
                  {tokens.map((token, index) => {
                     if (token.type === "separator")
                        return (
                           <React.Fragment key={index}>
                              {token.source}
                           </React.Fragment>
                        )

                     const pronunciation = token.pronunciations[choices[index] ?? 0]

                     return (
                        <button
                           type="button"
                           key={`${token.source}-${index}`}
                           className={`${styles.ipaWord} ${
                              pronunciation ? "" : styles.unknownWord
                           } ${
                              token.predicted ? styles.predictedWord : ""
                           } ${selectedIndex === index ? styles.selectedWord : ""}`}
                           title={
                              pronunciation
                                 ? token.predicted
                                    ? t("converter.predictedPronunciation", {
                                         word: token.source,
                                      })
                                    : t("converter.showSoundsIn", {
                                         word: token.source,
                                      })
                                 : t("converter.wordNotFound", {
                                      word: token.source,
                                   })
                           }
                           onClick={() => setSelectedIndex(index)}
                        >
                           {pronunciation ?? token.source}
                        </button>
                     )
                  })}
                  <span aria-hidden="true">/</span>
               </div>

               {selectedToken?.type === "word" && (
                  <div className={`card ${styles.wordInspector}`}>
                     <div className={styles.wordInspectorHeader}>
                        <div>
                           <span>{selectedToken.source}</span>
                           {selectedPronunciation && (
                              <strong>/{selectedPronunciation}/</strong>
                           )}
                        </div>
                        <button
                           type="button"
                           className={styles.miniPlay}
                           onClick={() => onPlay(selectedToken.source)}
                           aria-label={t("soundsUi.playWord", {
                              word: selectedToken.source,
                           })}
                        >
                           <PlayIcon aria-hidden="true" />
                        </button>
                     </div>

                     {selectedToken.predicted && (
                        <p className={styles.predictionHelp}>
                           {t("converter.predictionHelp")}
                        </p>
                     )}

                     {selectedToken.pronunciations.length > 1 && (
                        <label className={styles.alternativeSelect}>
                           {t("converter.pronunciation")}
                           <select
                              value={choices[selectedIndex ?? 0] ?? 0}
                              onChange={(event) =>
                                 setChoices((current) => ({
                                    ...current,
                                    [selectedIndex ?? 0]: Number(event.target.value),
                                 }))
                              }
                           >
                              {selectedToken.pronunciations.map(
                                 (pronunciation, index) => (
                                    <option key={pronunciation} value={index}>
                                       /{pronunciation}/
                                    </option>
                                 )
                              )}
                           </select>
                        </label>
                     )}

                     {selectedSounds.length > 0 ? (
                        <div className={styles.soundBreakdown}>
                           <p className={styles.sectionLabel}>
                              {t("converter.soundBySound")}
                           </p>
                           <div>
                              {selectedSounds.map((sound, index) => (
                                 <div
                                    className={styles.breakdownControl}
                                    key={`${sound.id}-${index}`}
                                 >
                                    <button
                                       type="button"
                                       className={styles.breakdownButton}
                                       onClick={() => onSelectSound(sound)}
                                       aria-label={t("soundsUi.openGuide", {
                                          symbol: sound.symbol,
                                       })}
                                       title={t("soundsUi.openSymbolGuide", {
                                          symbol: sound.symbol,
                                       })}
                                    >
                                       /{sound.symbol}/
                                    </button>
                                    <button
                                       type="button"
                                       className={styles.breakdownPlay}
                                       onClick={() => onPlaySound(sound)}
                                       aria-label={t("soundsUi.playSound", {
                                          symbol: sound.symbol,
                                       })}
                                       title={t("soundsUi.playSymbol", {
                                          symbol: sound.symbol,
                                       })}
                                    >
                                       <VolumeUpIcon aria-hidden="true" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ) : selectedToken.pronunciations.length === 0 ? (
                        <p className={styles.unknownHelp}>
                           {t("converter.unknownHelp")}
                        </p>
                     ) : null}
                  </div>
               )}
            </div>
         )}

         <p className={styles.dictionaryCredit}>{t("converter.dictionaryCredit")}</p>
      </section>
   )
}

const IpaPage: NextPage = () => {
   const { t } = useTranslation(IPA_TNS)
   const router = useRouter()
   const view: View = router.pathname.endsWith("/text-to-ipa")
      ? "converter"
      : "sounds"
   const [converterMounted, setConverterMounted] = useState(view === "converter")
   const [selectedSound, setSelectedSound] = useState(
      IPA_SOUNDS.find((sound) => sound.id === "schwa") ?? IPA_SOUNDS[0]
   )
   const activeAudio = useRef<HTMLAudioElement | null>(null)
   const { canSpeak, isSpeaking, message, setMessage, speak, stop } =
      useBritishSpeech()

   useEffect(() => {
      if (view === "converter") setConverterMounted(true)
   }, [view])

   useEffect(() => {
      const requestedSound =
         typeof router.query.sound === "string" ? router.query.sound : ""
      const sound = IPA_SOUNDS.find((item) => item.id === requestedSound)

      if (sound) setSelectedSound(sound)
   }, [router.query.sound])

   useEffect(
      () => () => {
         activeAudio.current?.pause()
      },
      []
   )

   const playAudio = (sound: IpaSound, kind: "sound" | "word") => {
      const source = kind === "sound" ? sound.soundAudio : sound.wordAudio

      activeAudio.current?.pause()
      activeAudio.current = null

      const audio = new Audio(source)
      let handledError = false

      const handleError = () => {
         if (handledError) return
         handledError = true
         activeAudio.current = null

         if (kind === "word") {
            speak(sound.example, 0.7)
         } else {
            setMessage(t("speech.soundError", { symbol: sound.symbol }))
         }
      }

      activeAudio.current = audio
      audio.preload = "auto"
      audio.onplay = () => setMessage("")
      audio.onended = () => {
         if (activeAudio.current === audio) activeAudio.current = null
      }
      audio.onerror = handleError
      void audio.play().catch(handleError)
   }

   const openSound = (sound: IpaSound) => {
      setSelectedSound(sound)
      void router
         .push({
            pathname: viewRoutes.sounds,
            query: { sound: sound.id },
         })
         .then(() =>
            window.requestAnimationFrame(() =>
               document.getElementById("ipa-tool")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
               })
            )
         )
   }

   return (
      <PageContainer>
         <Head>
            <title>
               {t(view === "converter" ? "meta.converterTitle" : "meta.title")}
            </title>
            <meta
               name="description"
               content={t(
                  view === "converter"
                     ? "meta.converterDescription"
                     : "meta.description"
               )}
            />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={t("meta.ogTitle")} />
            <meta property="og:description" content={t("meta.ogDescription")} />
            <meta property="og:image" content="/og.png" />
            <meta property="og:image:width" content="1792" />
            <meta property="og:image:height" content="896" />
            <meta property="og:image:alt" content={t("meta.ogImageAlt")} />
            <meta name="twitter:card" content="summary_large_image" />
            <link href="/favicon.ico" rel="icon" />
         </Head>

         <Header />
         <Main>
            <div className="dark:bg-primary-900 bg-plus-pattern dark:bg-opacity-20">
               <Section className="flex-col py-12 sm:py-20">
                  <p className="text-sm font-semibold tracking-widest uppercase text-caption-color">
                     {t("hero.eyebrow")}
                  </p>
                  <h1 className="max-w-4xl mt-4 text-4xl font-semibold leading-tight sm:text-6xl text-caption-color">
                     {t("hero.title")}
                  </h1>
                  <p className="max-w-prose mt-5 text-lg leading-relaxed text-subtitle-color">
                     {t("hero.description")}
                  </p>
               </Section>
            </div>

            <div className="pb-12 bg-linear-gradient-100">
               <Section block className={`py-8 ${styles.tool}`} id="ipa-tool">
                  <nav
                     className="flex justify-between w-full max-w-prose mx-auto gap-4 mb-10 rounded-lg bg-opacity-5 dark:bg-opacity-30"
                     aria-label={t("toolLabel")}
                  >
                     {(["sounds", "converter"] as View[]).map((option) => (
                        <Link
                           key={option}
                           href={viewRoutes[option]}
                           scroll={false}
                           aria-current={view === option ? "page" : undefined}
                           className="flex-grow p-2 text-center no-underline card-input hover:no-underline"
                           onClick={() => {
                              if (option === "converter") setConverterMounted(true)
                           }}
                        >
                           <span
                              className={cn(
                                 "inline-block border-b-4 p-1 rounded-sm font-semibold capitalize",
                                 {
                                    "border-primary-400": view === option,
                                 },
                                 {
                                    "border-background-300 dark:border-primary-200 text-primary-800 dark:text-primary-200 text-opacity-60 dark:text-opacity-60":
                                       view !== option,
                                 }
                              )}
                           >
                              {t(`tabs.${option}`)}
                           </span>
                        </Link>
                     ))}
                  </nav>

                  {message && (
                     <div className={styles.audioNotice} role="status">
                        <span>{message}</span>
                        <button type="button" onClick={() => setMessage("")}>
                           {t("actions.dismiss")}
                        </button>
                     </div>
                  )}

                  <div hidden={view !== "sounds"}>
                     <SoundsView
                        selected={selectedSound}
                        onPlay={playAudio}
                        onSelect={setSelectedSound}
                     />
                  </div>
                  {converterMounted && (
                     <div hidden={view !== "converter"}>
                        <ConverterView
                           canSpeak={canSpeak}
                           isSpeaking={isSpeaking}
                           onPlay={speak}
                           onPlaySound={(sound) => playAudio(sound, "sound")}
                           onSelectSound={openSound}
                           onStop={stop}
                        />
                     </div>
                  )}
               </Section>
            </div>
         </Main>
         <Footer />
      </PageContainer>
   )
}

export default IpaPage
