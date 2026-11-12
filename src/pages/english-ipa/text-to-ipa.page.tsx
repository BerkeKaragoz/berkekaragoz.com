import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Tooltip from "@/components/atomic/Tooltip/Tooltip"
import AdSenseBanner from "@/components/molecular/AdSenseBanner/AdSenseBanner"
import PlusBand from "@/components/molecular/PlusBand/PlusBand"
import { ADSENSE_SLOTS } from "@/features/consent/config"
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
   SOUND_BY_ID,
   SoundCategory,
   sortSoundsForGuide,
   splitIpaIntoSounds,
} from "@/features/ipa/sounds"
import { useIpaEvents } from "@/features/ipa/analytics"
import { IPA_TNS } from "@/features/ipa/i18n"
import { getIpaStaticProps } from "@/features/ipa/pageProps"
import { checkRandomTextAvailable, fetchRandomText } from "@/features/ipa/randomText"
import { useCanonicalUrl } from "@/lib/i18n/useCanonicalUrl"
import { HOST_URL } from "@/lib/utils/consts"
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

// Each view's page, in tab order. The first is the tool's landing page:
// /english-ipa redirects to it (next.config.js).
const viewRoutes: Record<View, string> = {
   converter: "/english-ipa/text-to-ipa",
   sounds: "/english-ipa/sounds",
}
const views = Object.keys(viewRoutes) as View[]

const categoryOrder: CategoryFilter[] = [
   "all",
   "consonant",
   "monophthong",
   "diphthong",
]

// The written-out list under the tool: every sound, grouped like the filters
// and in the same order as the grid.
const writtenSoundGroups = (
   ["consonant", "monophthong", "diphthong"] as SoundCategory[]
).map((category) => ({
   category,
   sounds: sortSoundsForGuide(
      IPA_SOUNDS.filter((sound) => sound.category === category)
   ),
}))

const writtenSoundId = (id: string) => `ipa-sound-${id}`

const converterGuideParagraphs = [
   "scope",
   "dictionary",
   "estimates",
   "input",
   "speech",
   "privacy",
] as const

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
   const [speechCheckComplete, setSpeechCheckComplete] = useState(false)
   const [message, setMessage] = useState("")
   const [isSpeaking, setIsSpeaking] = useState(false)
   const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null)

   useEffect(() => {
      if (!("speechSynthesis" in window)) {
         setSpeechCheckComplete(true)
         return
      }
      setSpeechApiAvailable(true)

      const refreshVoices = () => {
         const nextVoices = window.speechSynthesis
            .getVoices()
            .filter((voice) => voice.lang.toLowerCase().startsWith("en-gb"))
         setVoices(nextVoices)
         if (getPreferredVoice(nextVoices)) setSpeechCheckComplete(true)
      }

      const checkTimeout = window.setTimeout(
         () => setSpeechCheckComplete(true),
         1200
      )
      refreshVoices()
      window.speechSynthesis.addEventListener("voiceschanged", refreshVoices)

      return () => {
         window.clearTimeout(checkTimeout)
         window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices)
      }
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
   const speechUnavailable = speechCheckComplete && !canSpeak

   return {
      canSpeak,
      isSpeaking,
      message,
      setMessage,
      speak,
      speechUnavailable,
      stop,
   }
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

// A sound's translatable text: the locale file first, then the English in
// sounds.ts. The detail panel and the written-out list both read it here, so
// they always show the same words.
const useSoundText = () => {
   const { t } = useTranslation(IPA_TNS)

   return (sound: IpaSound) => ({
      name: t(`sounds.${sound.id}.name`, {
         defaultValue: sound.name,
      }),
      instructions: sound.instructions.map((instruction, index) =>
         t(`sounds.${sound.id}.instructions.${index}`, {
            defaultValue: instruction,
         })
      ),
      variationNote: sound.variationNote
         ? t(`sounds.${sound.id}.variationNote`, {
              defaultValue: sound.variationNote,
           })
         : undefined,
   })
}

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
   const text = useSoundText()(sound)

   return (
      <aside
         className={`card ${styles.detailPanel}`}
         aria-label={t("soundsUi.guideLabel", { symbol: sound.symbol })}
      >
         <div className={styles.detailHeader}>
            <div>
               <p className={styles.eyebrow}>{t(`categories.${sound.category}`)}</p>
               <h2 className={styles.detailSymbol}>/{sound.symbol}/</h2>
               <p className={styles.detailName}>{text.name}</p>
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
               {text.instructions.map((instruction, index) => (
                  <li key={`${sound.id}-${index}`}>
                     <span>{index + 1}</span>
                     {instruction}
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

         {text.variationNote && (
            <p className={styles.variationNote}>{text.variationNote}</p>
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
               <div className={styles.detailStack}>
                  <SoundDetail
                     sound={selected}
                     onPlaySound={() => onPlay(selected, "sound")}
                     onPlayWord={() => onPlay(selected, "word")}
                     onSelectSound={(id) => {
                        const sound = IPA_SOUNDS.find((item) => item.id === id)
                        if (sound) onSelect(sound)
                     }}
                  />
                  {/* Desktop only, where the panel is a sticky side column
                      (300px wide from 1001px). Outside the card, so it never
                      makes the card scroll, and clear of its buttons. */}
                  <AdSenseBanner
                     slot={ADSENSE_SLOTS.ipaRail}
                     size={[300, 250]}
                     media="(min-width: 1001px)"
                     className="mt-4"
                  />
               </div>
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
   onConvert,
   onPlay,
   onPlaySound,
   onSelectSound,
   onStop,
   speechUnavailable,
}: {
   canSpeak: boolean
   isSpeaking: boolean
   /** A conversion the visitor asked for succeeded. */
   onConvert: () => void
   onPlay: (text: string, rate?: number) => void
   onPlaySound: (sound: IpaSound) => void
   onSelectSound: (sound: IpaSound) => void
   onStop: () => void
   speechUnavailable: boolean
}) => {
   const { t } = useTranslation(IPA_TNS)
   const dictionaryCache = useRef<Record<string, DictionaryChunk>>({})
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
      const timeout = window.setTimeout(() => controller.abort(), 6000)
      let active = true

      void checkRandomTextAvailable(controller.signal)
         .then(() => {
            if (!active) return
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

   /** Converts the input. Resolves to whether it did, for `onConvert`. */
   const convert = async () => {
      const sourceText = input

      if (!sourceText.trim()) {
         setTokens([])
         setSelectedIndex(null)
         return false
      }

      if (loading || sourceText === convertedInput) return false

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
         return true
      } catch {
         setError(t("converter.dictionaryError"))
         return false
      } finally {
         setLoading(false)
      }
   }

   const convertForVisitor = async () => {
      if (await convert()) onConvert()
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
      const timeout = window.setTimeout(() => controller.abort(), 6000)

      try {
         const text = await fetchRandomText(controller.signal)
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

   const renderSpeechControl = (control: React.ReactElement) =>
      speechUnavailable ? (
         <Tooltip
            text={t("converter.textToSpeechUnavailable")}
            className={styles.playUnavailableTooltip}
         >
            <span className={styles.disabledPlayWrapper}>{control}</span>
         </Tooltip>
      ) : (
         control
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
                     void convertForVisitor()
               }}
            />
            <div className={styles.convertActions}>
               <button
                  type="button"
                  className={`${styles.actionButton} ${styles.primaryButton}`}
                  disabled={!canConvert}
                  onClick={() => void convertForVisitor()}
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
                     {renderSpeechControl(fullTextPlayButton)}
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

               {speechUnavailable && (
                  <p
                     className={`card-backdrop ${styles.touchSpeechNotice}`}
                     role="status"
                  >
                     {t("converter.textToSpeechUnavailable")}
                  </p>
               )}

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
                        {renderSpeechControl(
                           <button
                              type="button"
                              className={styles.miniPlay}
                              disabled={!canSpeak}
                              onClick={() => onPlay(selectedToken.source)}
                              aria-label={t("soundsUi.playWord", {
                                 word: selectedToken.source,
                              })}
                           >
                              <PlayIcon aria-hidden="true" />
                           </button>
                        )}
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

// Everything the detail panel can show, for all sounds at once. A native
// <details>, so the text is in the page's HTML while it is closed.
const AllSoundsText = () => {
   const { t } = useTranslation(IPA_TNS)
   const soundText = useSoundText()

   return (
      <details className={`card ${styles.marksGuide}`}>
         <summary>
            <div>
               <p className={styles.eyebrow}>{t("soundsUi.reference")}</p>
               <h2>{t("allSounds.title")}</h2>
            </div>
         </summary>
         <div className={styles.marksContent}>
            <p>{t("allSounds.intro")}</p>
            {writtenSoundGroups.map(({ category, sounds }) => (
               <section className={styles.writtenGroup} key={category}>
                  <h3>{t(`categories.${category}`)}</h3>
                  <div className={styles.writtenGrid}>
                     {sounds.map((sound) => {
                        const text = soundText(sound)
                        const comparisons = sound.confusedWith.flatMap((id) => {
                           const comparison = SOUND_BY_ID.get(id)
                           return comparison ? [comparison] : []
                        })

                        return (
                           <article
                              className={styles.writtenSound}
                              id={writtenSoundId(sound.id)}
                              key={sound.id}
                           >
                              <h4>
                                 <span className={styles.writtenSymbol}>
                                    /{sound.symbol}/
                                 </span>{" "}
                                 <span className={styles.writtenName}>
                                    {text.name}
                                 </span>
                              </h4>
                              <dl>
                                 <div>
                                    <dt className={styles.sectionLabel}>
                                       {t("allSounds.example")}
                                    </dt>
                                    <dd>
                                       {sound.example}{" "}
                                       <span className={styles.writtenIpa}>
                                          /{sound.exampleIpa}/
                                       </span>
                                    </dd>
                                 </div>
                                 <div>
                                    <dt className={styles.sectionLabel}>
                                       {t("soundsUi.howTo")}
                                    </dt>
                                    <dd>
                                       <ol>
                                          {text.instructions.map(
                                             (instruction, index) => (
                                                <li key={index}>{instruction}</li>
                                             )
                                          )}
                                       </ol>
                                    </dd>
                                 </div>
                                 <div>
                                    <dt className={styles.sectionLabel}>
                                       {t("soundsUi.commonSpellings")}
                                    </dt>
                                    <dd>{sound.spellings.join(", ")}</dd>
                                 </div>
                                 {comparisons.length > 0 && (
                                    <div>
                                       <dt className={styles.sectionLabel}>
                                          {t("soundsUi.compareWith")}
                                       </dt>
                                       <dd>
                                          <ul className={styles.writtenLinks}>
                                             {comparisons.map((comparison) => (
                                                <li key={comparison.id}>
                                                   <a
                                                      href={`#${writtenSoundId(
                                                         comparison.id
                                                      )}`}
                                                   >
                                                      /{comparison.symbol}/
                                                   </a>
                                                </li>
                                             ))}
                                          </ul>
                                       </dd>
                                    </div>
                                 )}
                              </dl>
                              {text.variationNote && (
                                 <p className={styles.variationNote}>
                                    {text.variationNote}
                                 </p>
                              )}
                           </article>
                        )
                     })}
                  </div>
               </section>
            ))}
         </div>
      </details>
   )
}

// Plain account of what the converter does. Every sentence in the
// converterGuide strings describes code in this file or in features/ipa;
// update them together.
const ConverterGuide = () => {
   const { t } = useTranslation(IPA_TNS)

   return (
      <div className={styles.converterLayout}>
         <details className={`card ${styles.marksGuide}`}>
            <summary>
               <div>
                  <p className={styles.eyebrow}>{t("tabs.converter")}</p>
                  <h2>{t("converterGuide.title")}</h2>
               </div>
            </summary>
            <div className={`${styles.marksContent} ${styles.guideText}`}>
               {converterGuideParagraphs.map((paragraph) => (
                  <p key={paragraph}>{t(`converterGuide.${paragraph}`)}</p>
               ))}
            </div>
         </details>
      </div>
   )
}

const IpaPage: NextPage = () => {
   const { t } = useTranslation(IPA_TNS)
   const router = useRouter()
   const view =
      views.find((option) => viewRoutes[option] === router.pathname) ?? views[0]
   // The two views are two pages, and a ?sound= selection is not a third.
   const canonicalUrl = useCanonicalUrl(viewRoutes[view])
   const [converterMounted, setConverterMounted] = useState(view === "converter")
   const [selectedSound, setSelectedSound] = useState(
      IPA_SOUNDS.find((sound) => sound.id === "schwa") ?? IPA_SOUNDS[0]
   )
   const activeAudio = useRef<HTMLAudioElement | null>(null)
   const {
      canSpeak,
      isSpeaking,
      message,
      setMessage,
      speak,
      speechUnavailable,
      stop,
   } = useBritishSpeech()
   const { trackConvert, trackListen } = useIpaEvents(isSpeaking)

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
      audio.onplay = () => {
         setMessage("")
         trackListen()
      }
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
            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={t("meta.ogTitle")} />
            <meta property="og:description" content={t("meta.ogDescription")} />
            <meta property="og:image" content={`${HOST_URL}/og.png`} />
            <meta property="og:image:width" content="1792" />
            <meta property="og:image:height" content="896" />
            <meta property="og:image:alt" content={t("meta.ogImageAlt")} />
            <meta name="twitter:card" content="summary_large_image" />
            <link href="/favicon.ico" rel="icon" />
         </Head>

         <Header />
         <Main>
            <PlusBand>
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
            </PlusBand>

            <div className="pb-12 bg-linear-gradient-100">
               <Section block className={`py-8 ${styles.tool}`} id="ipa-tool">
                  <nav
                     className="flex justify-between w-full max-w-prose mx-auto gap-4 mb-10 rounded-lg bg-opacity-5 dark:bg-opacity-30"
                     aria-label={t("toolLabel")}
                  >
                     {views.map((option) => (
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
                           onConvert={trackConvert}
                           onPlay={speak}
                           onPlaySound={(sound) => playAudio(sound, "sound")}
                           onSelectSound={openSound}
                           onStop={stop}
                           speechUnavailable={speechUnavailable}
                        />
                     </div>
                  )}
               </Section>
               <Section block>
                  <AdSenseBanner slot={ADSENSE_SLOTS.tool} className="mt-4" />
               </Section>
               {/* One accordion per route, chosen from the pathname like the
                   view itself, so each page's static HTML holds its own and a
                   tab click swaps them. */}
               <Section block className={`mt-8 ${styles.tool}`}>
                  {view === "sounds" ? <AllSoundsText /> : <ConverterGuide />}
               </Section>
            </div>
         </Main>
         <Footer />
      </PageContainer>
   )
}

export default IpaPage
