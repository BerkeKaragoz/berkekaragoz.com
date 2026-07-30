import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import {
   ConvertedToken,
   DictionaryChunk,
   dictionaryChunkFor,
   mergeDictionaryChunks,
   tokeniseWithDictionary,
   wordsInText,
} from "@/features/ipa/converter"
import {
   CATEGORY_LABELS,
   IPA_SOUNDS,
   IpaSound,
   SoundCategory,
   sortSoundsForGuide,
   splitIpaIntoSounds,
} from "@/features/ipa/sounds"
import {
   CheckIcon,
   ClipboardCopyIcon,
   PlayIcon,
   SearchIcon,
   SpeakerphoneIcon,
   StopIcon,
   VolumeUpIcon,
} from "@heroicons/react/solid"
import { NextPage } from "next"
import Head from "next/head"
import React, { useEffect, useMemo, useRef, useState } from "react"
import styles from "./ipa.module.css"

type View = "sounds" | "converter"
type CategoryFilter = SoundCategory | "all"

const EXAMPLE_TEXT = "A bright blue bird sang near the old oak tree."

const viewLabels: Record<View, string> = {
   sounds: "44 sounds",
   converter: "Text to IPA",
}

const categoryOrder: CategoryFilter[] = [
   "all",
   "consonant",
   "monophthong",
   "diphthong",
]

const categoryLabels: Record<CategoryFilter, string> = {
   all: "All",
   ...CATEGORY_LABELS,
}

const ipaMarkGuides = [
   {
      symbol: "ˈ  ˌ",
      name: "Stress",
      example: "/əˈbaʊt/",
      description:
         "Primary ˈ and secondary ˌ stress appear before the syllable that receives the emphasis.",
   },
   {
      symbol: "ː",
      name: "Length",
      example: "/iː/",
      description:
         "Hold the sound before this mark for longer. The mark is not pronounced separately.",
   },
   {
      symbol: ".",
      name: "Syllable break",
      example: "/ˈbet.ə/",
      description:
         "A dot shows where one syllable ends and the next begins. It does not add a pause.",
   },
   {
      symbol: "/ /  [ ]",
      name: "Transcription brackets",
      example: "/r/  [ɹ]",
      description:
         "Slashes show meaning-changing sounds; square brackets show finer details of an actual pronunciation.",
   },
   {
      symbol: "◌̩  ◌̃",
      name: "Diacritics",
      example: "[l̩]  [æ̃]",
      description:
         "Small marks attach to a sound. These examples mean syllabic and nasalised; broad transcriptions often omit them.",
   },
   {
      symbol: "↗  ↘",
      name: "Pitch and intonation",
      example: "/ˈrɪə.li/ ↗",
      description:
         "Arrows can show rising or falling pitch in teaching material. This word converter omits them because intonation depends on the full sentence.",
   },
]

const getPreferredVoice = (voices: SpeechSynthesisVoice[]) =>
   voices.find(
      (voice) =>
         voice.lang.toLowerCase() === "en-gb" &&
         /sonia|libby|george|ryan|female|male/i.test(voice.name)
   ) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb"))

const useBritishSpeech = () => {
   const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
   const [message, setMessage] = useState("")
   const [isSpeaking, setIsSpeaking] = useState(false)
   const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null)

   useEffect(() => {
      if (!("speechSynthesis" in window)) return

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
      if (!("speechSynthesis" in window)) {
         setMessage("Speech is not supported by this browser.")
         return false
      }

      const voice = getPreferredVoice(voices)
      if (!voice) {
         setMessage(
            "No English voice is installed on this device. The recorded sound samples still work."
         )
         return false
      }

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

   return { isSpeaking, message, setMessage, speak, stop }
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
}) => (
   <article
      className={`${styles.soundCard} ${active ? styles.soundCardActive : ""}`}
   >
      <button
         type="button"
         className={styles.soundCardSelect}
         onClick={onSelect}
         aria-pressed={active}
         aria-label={`Open the ${sound.symbol} sound guide`}
      >
         <span className={styles.soundSymbol}>/{sound.symbol}/</span>
         <span className={styles.soundExample}>
            {sound.example}
            <span aria-hidden="true"> · </span>
            <span>/{sound.exampleIpa}/</span>
         </span>
      </button>
      <button
         type="button"
         className={styles.soundCardPlay}
         onClick={onPlay}
         aria-label={`Play the ${sound.symbol} sound`}
         title={`Play /${sound.symbol}/`}
      >
         <VolumeUpIcon aria-hidden="true" />
      </button>
   </article>
)

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
}) => (
   <aside
      className={`card ${styles.detailPanel}`}
      aria-label={`${sound.symbol} sound guide`}
   >
      <div className={styles.detailHeader}>
         <div>
            <p className={styles.eyebrow}>{CATEGORY_LABELS[sound.category]}</p>
            <h2 className={styles.detailSymbol}>/{sound.symbol}/</h2>
            <p className={styles.detailName}>{sound.name}</p>
         </div>
         <div className={styles.detailExample}>
            <span>{sound.example}</span>
            <span>/{sound.exampleIpa}/</span>
         </div>
      </div>

      <div className={styles.audioActions}>
         <SoundButton label={`Play the ${sound.symbol} sound`} onClick={onPlaySound}>
            Sound
         </SoundButton>
         <SoundButton label={`Play ${sound.example}`} onClick={onPlayWord} secondary>
            In “{sound.example}”
         </SoundButton>
      </div>

      <div className={styles.howTo}>
         <p className={styles.sectionLabel}>How to make it</p>
         <ol>
            {sound.instructions.map((instruction, index) => (
               <li key={instruction}>
                  <span>{index + 1}</span>
                  {instruction}
               </li>
            ))}
         </ol>
      </div>

      <div className={styles.detailMeta}>
         <div>
            <p className={styles.sectionLabel}>Common spellings</p>
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
               <p className={styles.sectionLabel}>Compare with</p>
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
         <p className={styles.variationNote}>{sound.variationNote}</p>
      )}
   </aside>
)

const SoundsView = ({
   onPlay,
   onSelect,
   selected,
}: {
   onPlay: (sound: IpaSound, kind: "sound" | "word") => void
   onSelect: (sound: IpaSound) => void
   selected: IpaSound
}) => {
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
               sound.spellings.some((spelling) =>
                  spelling.toLowerCase().includes(normalisedQuery)
               )

            return matchesCategory && matchesQuery
         })
      )
   }, [category, query])

   return (
      <section className={styles.soundsLayout} aria-labelledby="sounds-title">
         <div className={styles.soundsColumns}>
            <div className={styles.library}>
               <div className={styles.libraryHeader}>
                  <div>
                     <p className={styles.eyebrow}>English reference</p>
                     <h2 id="sounds-title">The 44 sounds</h2>
                  </div>
                  <label className={styles.searchBox}>
                     <SearchIcon aria-hidden="true" />
                     <span className="sr-only">Search sounds</span>
                     <input
                        type="search"
                        value={query}
                        placeholder="Search sound or word"
                        onChange={(event) => setQuery(event.target.value)}
                     />
                  </label>
               </div>

               <div className={styles.filters} aria-label="Filter sounds">
                  {categoryOrder.map((option) => (
                     <button
                        key={option}
                        type="button"
                        className={styles.filterButton}
                        aria-pressed={category === option}
                        onClick={() => setCategory(option)}
                     >
                        {categoryLabels[option]}
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
                     No sound matches “{query}”. Try a spelling such as “th”.
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
                  <p className={styles.eyebrow}>Reading IPA</p>
                  <h3>Marks that change or describe a sound</h3>
               </div>
               <span>Stress, length, syllables and pitch</span>
            </summary>
            <div className={styles.marksContent}>
               <p>
                  These marks add information to IPA symbols. Only the marks needed
                  for a word appear in the converter.
               </p>
               <div className={styles.markGrid}>
                  {ipaMarkGuides.map((mark) => (
                     <article className={styles.markItem} key={mark.name}>
                        <div className={styles.markHeader}>
                           <span className={styles.markSymbol}>{mark.symbol}</span>
                           <span className={styles.markExample}>{mark.example}</span>
                        </div>
                        <h4>{mark.name}</h4>
                        <p>{mark.description}</p>
                     </article>
                  ))}
               </div>
            </div>
         </details>
      </section>
   )
}

const ConverterView = ({
   isSpeaking,
   onPlay,
   onPlaySound,
   onSelectSound,
   onStop,
}: {
   isSpeaking: boolean
   onPlay: (text: string, rate?: number) => void
   onPlaySound: (sound: IpaSound) => void
   onSelectSound: (sound: IpaSound) => void
   onStop: () => void
}) => {
   const dictionaryCache = useRef<Record<string, DictionaryChunk>>({})
   const [input, setInput] = useState(EXAMPLE_TEXT)
   const [tokens, setTokens] = useState<ConvertedToken[]>([])
   const [choices, setChoices] = useState<Record<number, number>>({})
   const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState("")
   const [copied, setCopied] = useState(false)

   const convert = async () => {
      if (!input.trim()) {
         setTokens([])
         setSelectedIndex(null)
         return
      }

      setLoading(true)
      setError("")

      try {
         const letters = Array.from(
            new Set(wordsInText(input).map(dictionaryChunkFor))
         )
         const chunks = await Promise.all(
            letters.map(async (letter) => {
               if (dictionaryCache.current[letter])
                  return dictionaryCache.current[letter]

               const response = await fetch(
                  `/data/ipa/en-GB/${encodeURIComponent(letter)}.json`
               )
               if (!response.ok) throw new Error("Dictionary could not be loaded.")

               const chunk = (await response.json()) as DictionaryChunk
               dictionaryCache.current[letter] = chunk
               return chunk
            })
         )

         const nextTokens = tokeniseWithDictionary(
            input,
            mergeDictionaryChunks(chunks)
         )
         setTokens(nextTokens)
         setChoices({})
         setSelectedIndex(
            nextTokens.findIndex(
               (token) => token.type === "word" && token.pronunciations.length
            )
         )
      } catch {
         setError("The English dictionary could not be loaded. Please try again.")
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

   const copyIpa = async () => {
      if (!ipaText) return
      await navigator.clipboard.writeText(ipaText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
   }

   return (
      <section className={styles.converterLayout} aria-label="Text to IPA converter">
         <div className={`card ${styles.converterCard}`}>
            <div className={styles.inputHeader}>
               <label htmlFor="ipa-input">English text</label>
               <span>{input.length}/500</span>
            </div>
            <textarea
               id="ipa-input"
               value={input}
               maxLength={500}
               rows={4}
               spellCheck
               onChange={(event) => setInput(event.target.value)}
               onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter")
                     void convert()
               }}
            />
            <div className={styles.convertActions}>
               <button
                  type="button"
                  className={`${styles.actionButton} ${styles.primaryButton}`}
                  disabled={loading || !input.trim()}
                  onClick={() => void convert()}
               >
                  {loading ? "Converting…" : "Convert to IPA"}
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
                     <p className={styles.sectionLabel}>English pronunciation</p>
                     {unknownCount > 0 && (
                        <span>
                           {unknownCount} {unknownCount === 1 ? "word" : "words"} not
                           found
                        </span>
                     )}
                  </div>
                  <div className={styles.resultActions}>
                     <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => (isSpeaking ? onStop() : onPlay(input, 0.78))}
                        aria-label={
                           isSpeaking
                              ? "Stop English pronunciation"
                              : "Play the full text"
                        }
                     >
                        {isSpeaking ? (
                           <StopIcon aria-hidden="true" />
                        ) : (
                           <SpeakerphoneIcon aria-hidden="true" />
                        )}
                        {isSpeaking ? "Stop" : "Play"}
                     </button>
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
                        {copied ? "Copied" : "Copy"}
                     </button>
                  </div>
               </div>

               <div className={styles.ipaResult} aria-label="Converted IPA">
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
                           } ${selectedIndex === index ? styles.selectedWord : ""}`}
                           title={
                              pronunciation
                                 ? `Show sounds in ${token.source}`
                                 : `${token.source} was not found`
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
                           aria-label={`Play ${selectedToken.source}`}
                        >
                           <PlayIcon aria-hidden="true" />
                        </button>
                     </div>

                     {selectedToken.pronunciations.length > 1 && (
                        <label className={styles.alternativeSelect}>
                           Pronunciation
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
                           <p className={styles.sectionLabel}>Sound by sound</p>
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
                                       aria-label={`Open the ${sound.symbol} sound guide`}
                                       title={`Open /${sound.symbol}/ guide`}
                                    >
                                       /{sound.symbol}/
                                    </button>
                                    <button
                                       type="button"
                                       className={styles.breakdownPlay}
                                       onClick={() => onPlaySound(sound)}
                                       aria-label={`Play the ${sound.symbol} sound`}
                                       title={`Play /${sound.symbol}/`}
                                    >
                                       <VolumeUpIcon aria-hidden="true" />
                                    </button>
                                 </div>
                              ))}
                           </div>
                        </div>
                     ) : selectedToken.pronunciations.length === 0 ? (
                        <p className={styles.unknownHelp}>
                           Keep this spelling as written, or try the base form of the
                           word.
                        </p>
                     ) : null}
                  </div>
               )}
            </div>
         )}

         <p className={styles.dictionaryCredit}>
            Dictionary: Britfone 100.0.1 · Standard English pronunciation
         </p>
      </section>
   )
}

const IpaPage: NextPage = () => {
   const [view, setView] = useState<View>("sounds")
   const [converterMounted, setConverterMounted] = useState(false)
   const [selectedSound, setSelectedSound] = useState(
      IPA_SOUNDS.find((sound) => sound.id === "schwa") ?? IPA_SOUNDS[0]
   )
   const activeAudio = useRef<HTMLAudioElement | null>(null)
   const { isSpeaking, message, setMessage, speak, stop } = useBritishSpeech()

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
            setMessage(`The /${sound.symbol}/ sound could not be played.`)
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
      setView("sounds")
      window.requestAnimationFrame(() =>
         document.getElementById("ipa-tool")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
         })
      )
   }

   return (
      <PageContainer>
         <Head>
            <title>English IPA — Learn sounds and convert text</title>
            <meta
               name="description"
               content="Learn all 44 English IPA sounds, hear each sound in isolation and in a word, and convert English text to IPA in your browser."
            />
            <meta property="og:type" content="website" />
            <meta
               property="og:title"
               content="English IPA — Hear it. Read it. Use it."
            />
            <meta
               property="og:description"
               content="A focused English IPA sound guide and private, browser-based text converter."
            />
            <meta property="og:image" content="/og.png" />
            <meta property="og:image:width" content="1792" />
            <meta property="og:image:height" content="896" />
            <meta
               property="og:image:alt"
               content="English IPA sound cards around the pronunciation /reɪn/."
            />
            <meta name="twitter:card" content="summary_large_image" />
            <link href="/favicon.ico" rel="icon" />
         </Head>

         <Header />
         <Main>
            <div className="dark:bg-primary-900 bg-plus-pattern dark:bg-opacity-20">
               <Section className="flex-col py-12 sm:py-20">
                  <p className="text-sm font-semibold tracking-widest uppercase text-caption-color">
                     British English · 44 sounds · Browser-based
                  </p>
                  <h1 className="max-w-4xl mt-4 text-4xl font-semibold leading-tight sm:text-6xl text-caption-color">
                     English pronunciation, written sound by sound.
                  </h1>
                  <p className="max-w-prose mt-5 text-lg leading-relaxed text-subtitle-color">
                     Hear each English sound alone and in a word, or convert your own
                     text to IPA.
                  </p>
               </Section>
            </div>

            <div className="pb-12 bg-linear-gradient-100">
               <Section block className={`py-8 ${styles.tool}`} id="ipa-tool">
                  <nav
                     className="inline-flex gap-1 p-1 mb-8 card-backdrop"
                     aria-label="IPA tool"
                  >
                     {(["sounds", "converter"] as View[]).map((option) => (
                        <button
                           type="button"
                           key={option}
                           aria-current={view === option ? "page" : undefined}
                           className={`${styles.tab} ${
                              view === option ? styles.tabActive : ""
                           }`}
                           onClick={() => {
                              setView(option)
                              if (option === "converter") setConverterMounted(true)
                           }}
                        >
                           {viewLabels[option]}
                        </button>
                     ))}
                  </nav>

                  {message && (
                     <div className={styles.audioNotice} role="status">
                        <span>{message}</span>
                        <button type="button" onClick={() => setMessage("")}>
                           Dismiss
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
