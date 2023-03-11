import IconButton from "@/components/atomic/IconButton/IconButton"
import Slider from "@/components/atomic/Slider/Slider"
import AudioPlayer from "@/components/molecular/AudioPlayer/AudioPlayer"
import PostCard from "@/components/molecular/PostCard/PostCard"
import DrawableCanvas from "@/components/organism/DrawableCanvas/DrawableCanvas"
import { PostMeta } from "@/lib/api/blog"
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import BitcoinIcon from "@/lib/icons/Bitcoin"
import EthereumIcon from "@/lib/icons/Ethereum"
import { ColorScheme } from "@/lib/types/common"
import {
   CoinPriceData,
   CoinPriceDataStorage,
   IAddConfettiConfig,
} from "@/lib/types/external-api"
import { ComponentPropsWithTranslation } from "@/lib/types/i18n"
import { generateRandomInt } from "@/lib/utils"
import {
   BTC_PRICE_API,
   colorBlue,
   colorGreen,
   colorRed,
   ETH_PRICE_API,
   MINUTES_IN_MS,
} from "@/lib/utils/consts"
import { Switch, Tab } from "@headlessui/react"
import {
   EyeIcon,
   HeartIcon,
   LightBulbIcon,
   PencilIcon,
} from "@heroicons/react/solid"
import clsx from "clsx"
import JSConfetti from "js-confetti"
import { nanoid } from "nanoid"
import { useTranslation } from "next-i18next"
import { useTheme } from "next-themes"
import React from "react"
import { Trans, withTranslation } from "react-i18next"
import { caesarsCipher, caesarsDecipher } from "caesars-cipher"

const plainConfettiConfig: IAddConfettiConfig[] = [
   {},
   {
      confettiColors: ["#F1F4DF", "#10EAF0", "#38BDF8", "#0C4A6E"],
      confettiRadius: 12,
      confettiNumber: 100,
   },
   {
      confettiColors: ["#E60965", "#F94892", "#FFA1C9", "#FBE5E5"],
      confettiRadius: 14,
      confettiNumber: 100,
   },
   {
      confettiColors: ["#AB46D2", "#FF6FB5", "#55D8C1", "#FCF69C"],
      confettiRadius: 6,
      confettiNumber: 300,
   },
]

const emojiConfettiConfig: IAddConfettiConfig[] = [
   {
      emojis: ["🎊", "🎉", "💥", "✨"],
   },
]

type Props = ComponentPropsWithTranslation<{
   latestPostMetas?: PostMeta[]
   initBtc?: number
   initEth?: number
}>

const HeroWidget: React.FC<Props> = (props) => {
   const { t, latestPostMetas, initBtc, initEth } = props
   const { t: ct } = useTranslation([COMMON_TNS])
   const { t: gt } = useTranslation([GLOSSARY_TNS])
   const { theme, setTheme: _setTheme } = useTheme()

   const [isDarkTheme, setIsDarkTheme] = React.useState<boolean | undefined>(
      undefined
   )
   const [strokeColor, setStrokeColor] =
      React.useState<CanvasFillStrokeStyles["strokeStyle"]>(colorBlue)
   const [isBlurSwitchOn, setIsBlurSwitchOn] = React.useState(false)
   const [clearCount, setClearCount] = React.useState(0)
   const [randomNumber, setRandomNumber] = React.useState(generateRandomInt(100))
   const [btcPrice, setBtcPrice] = React.useState<number>(NaN)
   const [ethPrice, setEthPrice] = React.useState<number>(NaN)

   const jsConfettiRef = React.useRef<JSConfetti>()
   const sliderParagraphRef = React.useRef<HTMLParagraphElement>(null)
   const cipherRef = React.useRef<HTMLInputElement>(null)
   const cipherShiftRef = React.useRef<HTMLInputElement>(null)
   const decipherRef = React.useRef<HTMLInputElement>(null)

   const setTheme = (theme: ColorScheme) => {
      if (isDarkTheme !== undefined) _setTheme(theme)
   }

   const handleConfettiClick = React.useCallback(
      (isEmoji?: boolean) => {
         if (!jsConfettiRef.current) return

         const config = isEmoji ? emojiConfettiConfig : plainConfettiConfig

         jsConfettiRef.current.addConfetti(config[generateRandomInt(config.length)])
      },
      [jsConfettiRef]
   )

   React.useEffect(() => {
      let isBtcCached = false
      let isEthCached = false

      jsConfettiRef.current = new JSConfetti()

      if (typeof window !== "undefined") {
         const cacheBtcData: CoinPriceDataStorage = JSON.parse(
            localStorage.getItem("BTCUSDT") ?? "{}"
         )
         const cacheEthData: CoinPriceDataStorage = JSON.parse(
            localStorage.getItem("ETHUSDT") ?? "{}"
         )
         cacheBtcData.timestamp = new Date(cacheBtcData.timestamp)
         cacheEthData.timestamp = new Date(cacheEthData.timestamp)

         const currentDate = new Date()

         const cacheTime = 15 * MINUTES_IN_MS

         if (cacheBtcData.timestamp.getTime() + cacheTime > currentDate.getTime()) {
            isBtcCached = true
            setBtcPrice(parseFloat(cacheBtcData.price))
         }
         if (cacheEthData.timestamp.getTime() + cacheTime > currentDate.getTime()) {
            isEthCached = true
            setEthPrice(parseFloat(cacheEthData.price))
         }
      }

      if (!isBtcCached)
         fetch(BTC_PRICE_API)
            .then((req) => req.json())
            .then((data: CoinPriceData) => {
               setBtcPrice(parseFloat(data.price))
               localStorage.setItem(
                  "BTCUSDT",
                  JSON.stringify({
                     timestamp: new Date().toISOString(),
                     price: data.price,
                     mins: data.mins,
                  })
               )
            })
            .catch((err) => {
               console.error(err)
            })

      if (!isEthCached)
         fetch(ETH_PRICE_API)
            .then((req) => req.json())
            .then((data: CoinPriceData) => {
               setEthPrice(parseFloat(data.price))
               localStorage.setItem(
                  "ETHUSDT",
                  JSON.stringify({
                     timestamp: new Date().toISOString(),
                     price: data.price,
                     mins: data.mins,
                  })
               )
            })
            .catch((err) => {
               console.error(err)
            })
   }, [])

   React.useEffect(() => {
      setIsDarkTheme(theme === "dark") // ssr
   }, [theme])

   return (
      <div className="hidden xs:block md:w-1/2">
         <div className="hero-widget">
            {/* Hero Widget Left Start  */}
            <div className="inline-flex flex-col max-w-md gap-8 shrink-0 pe-8">
               {/* Light Bulb */}
               <div className="flex gap-8 justify-evenly">
                  <IconButton
                     className="flex-grow h-10"
                     disabled={!isDarkTheme}
                     onClick={() => setTheme("light")}
                     aria-label={ct("light theme")}
                  >
                     <LightBulbIcon />
                  </IconButton>
                  <IconButton
                     className="flex-grow h-10"
                     onClick={() => setTheme("dark")}
                     disabled={isDarkTheme}
                     aria-label={ct("dark theme")}
                  >
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M 9.663 17 h 4.673 M 8.464 15.536 a 5 5 0 1 1 7.072 0 l -0.548 0.547 A 3.374 3.374 0 0 0 14 18.469 V 19 a 2 2 0 1 1 -4 0 v -0.531 c 0 -0.895 -0.356 -1.754 -0.988 -2.386 l -0.548 -0.547 z"
                        />
                     </svg>
                  </IconButton>
               </div>
               {/* Audio Player */}
               <AudioPlayer
                  src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Rondo_Alla_Turka.ogg"
                  imageSrc="https://upload.wikimedia.org/wikipedia/commons/4/47/Croce-Mozart-Detail.jpg"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gIoSUNDX1BST0ZJTEUAAQEAAAIYAAAAAAQwAABtbnRyUkdCIFhZWiAAAAAAAAAAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAAHRyWFlaAAABZAAAABRnWFlaAAABeAAAABRiWFlaAAABjAAAABRyVFJDAAABoAAAAChnVFJDAAABoAAAAChiVFJDAAABoAAAACh3dHB0AAAByAAAABRjcHJ0AAAB3AAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAFgAAAAcAHMAUgBHAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFhZWiAAAAAAAABvogAAOPUAAAOQWFlaIAAAAAAAAGKZAAC3hQAAGNpYWVogAAAAAAAAJKAAAA+EAAC2z3BhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABYWVogAAAAAAAA9tYAAQAAAADTLW1sdWMAAAAAAAAAAQAAAAxlblVTAAAAIAAAABwARwBvAG8AZwBsAGUAIABJAG4AYwAuACAAMgAwADEANv/bAEMABgQFBgUEBgYFBgcHBggKEAoKCQkKFA4PDBAXFBgYFxQWFhodJR8aGyMcFhYgLCAjJicpKikZHy0wLSgwJSgpKP/bAEMBBwcHCggKEwoKEygaFhooKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKP/AABEIAAgABgMBIgACEQEDEQH/xAAVAAEBAAAAAAAAAAAAAAAAAAAABv/EAB4QAAICAQUBAAAAAAAAAAAAAAECAAMRBAUGIUFR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwX/xAAaEQACAgMAAAAAAAAAAAAAAAABAgADBBEh/9oADAMBAAIRAxEAPwCL51vWmbh2yaYXObKyAy1sCqkBs+Zz398iIh1IFXko5TEWaE//2Q=="
                  title="Rondo Alla Turka"
                  subtitle="Wolfgang Amadeus Mozart's Piano Sonata No. 11"
                  defaultVolume={0.35}
                  defaultLoop
               />
               {/* Crpyto Section */}
               <div className="flex justify-between gap-8">
                  <div className="flex items-center w-full p-2 overflow-hidden card">
                     <div className="flex items-center flex-shrink-0">
                        <BitcoinIcon width="20px" height="20px" />
                        <code className="text-xs text-black text-opacity-60 dark:text-opacity-60 dark:text-white ms-1.5">
                           {"BTC/USDT"}
                        </code>
                     </div>
                     <code
                        className="font-medium ms-2"
                        style={{ borderBottom: "1px solid #fff0" }} // visual vertical alignment
                     >
                        {isNaN(btcPrice) ? (
                           <span className="opacity-60">
                              {initBtc === undefined
                                 ? "\u2026"
                                 : `${initBtc.toFixed(0)}~`}
                           </span>
                        ) : (
                           `${btcPrice.toFixed(0)}~`
                        )}
                     </code>
                  </div>
                  <div className="flex items-center w-full p-2 overflow-hidden card">
                     <div className="flex items-center flex-shrink-0">
                        <EthereumIcon
                           className="bg-purple-900 bg-opacity-25 rounded-full"
                           width="20px"
                           height="20px"
                        />
                        <code className="text-xs text-black text-opacity-60 dark:text-opacity-60 dark:text-white ms-1.5">
                           {"ETH/USDT"}
                        </code>
                     </div>
                     <code
                        className="font-medium ms-2"
                        style={{ borderBottom: "1px solid #fff0" }} // visual vertical alignment
                     >
                        {isNaN(ethPrice) ? (
                           <span className="opacity-60">
                              {initEth === undefined
                                 ? "\u2026"
                                 : `${initEth.toFixed(0)}~`}
                           </span>
                        ) : (
                           `${ethPrice.toFixed(0)}~`
                        )}
                     </code>
                  </div>
               </div>
               {/* Canvas Section */}
               <div className="hidden gap-6 overflow-hidden rounded-lg md:flex">
                  <div className="relative card">
                     <DrawableCanvas
                        className={clsx([{ "blur-sm": isBlurSwitchOn }])}
                        strokeStyle={strokeColor}
                        clear={clearCount}
                        initDrawSmile
                     />
                     <div className="absolute w-5 h-5 pointer-events-none right-2 top-2 opacity-60">
                        <PencilIcon />
                     </div>
                  </div>
                  <div className="flex flex-col w-full gap-2">
                     <button
                        className={clsx([
                           "h-full p-1 card-input",
                           {
                              "border-primary-600 dark:border-primary-500":
                                 strokeColor === colorRed,
                           },
                        ])}
                        onClick={() => setStrokeColor(colorRed)}
                        aria-label={ct("red")}
                     >
                        <div
                           className="w-full h-full rounded-full"
                           style={{ backgroundColor: colorRed }}
                        />
                     </button>
                     <button
                        className={clsx([
                           "h-full p-1 card-input",
                           {
                              "border-primary-600 dark:border-primary-500":
                                 strokeColor === colorGreen,
                           },
                        ])}
                        onClick={() => setStrokeColor(colorGreen)}
                        aria-label={ct("green")}
                     >
                        <div
                           className="w-full h-full rounded-full"
                           style={{ backgroundColor: colorGreen }}
                        />
                     </button>
                     <button
                        className={clsx([
                           "h-full p-1 card-input",
                           {
                              "border-primary-600 dark:border-primary-500":
                                 strokeColor === colorBlue,
                           },
                        ])}
                        onClick={() => setStrokeColor(colorBlue)}
                        aria-label={ct("blue")}
                     >
                        <div
                           className="w-full h-full rounded-full"
                           style={{ backgroundColor: colorBlue }}
                        />
                     </button>
                     <button
                        className="flex items-center justify-center h-full card-input"
                        onClick={() => setClearCount((s) => s + 1)}
                     >
                        <code className="text-xs font-semibold align-middle">
                           CLEAR
                        </code>
                     </button>
                  </div>
               </div>
               {/* Blur Section */}
               <div className="items-center justify-between hidden gap-2 md:flex">
                  <Switch.Group as="div" className="flex items-center gap-2">
                     <Switch.Label className="text-primary-600 dark:text-primary-200">
                        <Trans t={t} i18nKey="index.hero.widget.switchLabel">
                           Enable Canvas Blur
                        </Trans>
                     </Switch.Label>
                     <Switch
                        checked={isBlurSwitchOn}
                        onChange={setIsBlurSwitchOn}
                        className={clsx([
                           "relative card inline-flex items-center h-6 rounded-full w-11",
                           {
                              "bg-primary-400 dark:bg-primary-600": isBlurSwitchOn,
                           },
                           {
                              "bg-background-400 dark:bg-background-800":
                                 !isBlurSwitchOn,
                           },
                        ])}
                     >
                        <span
                           className={clsx([
                              "duration-100 inline-block w-4 h-4 bg-white dark:bg-primary-50 rounded-full",
                              {
                                 "translate-x-1 dark:bg-primary-200":
                                    !isBlurSwitchOn,
                              },
                              {
                                 "translate-x-6 ": isBlurSwitchOn,
                              },
                           ])}
                        />
                     </Switch>
                  </Switch.Group>
                  <hr className="flex-grow border-primary-300 dark:border-primary-900" />
                  <div className="w-10 h-10 p-2 overflow-hidden card dark:border-opacity-60">
                     <EyeIcon
                        className={clsx([
                           "h-full mx-auto text-primary-600 dark:text-primary-200",
                           { "blur-sm": isBlurSwitchOn },
                        ])}
                     />
                  </div>
               </div>
               {/* Caesars Cipher Section */}
               <div className="flex items-center justify-between gap-2">
                  <input
                     type="text"
                     aria-label="Caesar's cipher"
                     className="p-2 w-28 card-input font-monospace"
                     ref={cipherRef}
                     defaultValue="Cipher"
                     onChange={(e) => {
                        if (!decipherRef.current) return
                        if (!cipherShiftRef.current) return
                        const { value } = e.target

                        decipherRef.current.value = caesarsCipher(
                           value,
                           cipherShiftRef.current.valueAsNumber
                        )
                     }}
                  />
                  <hr className="flex-grow border-primary-300 dark:border-primary-900" />
                  <input
                     type="number"
                     aria-label="Caesar's cipher shift amount"
                     defaultValue={1}
                     ref={cipherShiftRef}
                     className="w-16 p-2 text-center card-input font-monospace"
                     onChange={(e) => {
                        if (!cipherRef.current) return
                        if (!decipherRef.current) return
                        const { valueAsNumber } = e.target

                        decipherRef.current.value = caesarsCipher(
                           cipherRef.current.value,
                           valueAsNumber
                        )
                     }}
                  />
                  <hr className="flex-grow border-primary-300 dark:border-primary-900" />
                  <input
                     type="text"
                     aria-label="Caesar's decipher"
                     ref={decipherRef}
                     className="p-2 w-28 card-input font-monospace"
                     defaultValue="Djqifs"
                     onChange={(e) => {
                        if (!cipherRef.current) return
                        if (!cipherShiftRef.current) return
                        const { value } = e.target

                        cipherRef.current.value = caesarsDecipher(
                           value,
                           cipherShiftRef.current.valueAsNumber
                        )
                     }}
                  />
               </div>
               {/* Website Made with Section */}
               <div className="w-full px-3 py-2 card">
                  <p className="text-primary-600 dark:text-primary-200">
                     <Trans t={t} i18nKey="index.hero.widget.websiteTechTitle">
                        This website was made with:
                     </Trans>
                  </p>
                  <ul className="list-disc text-primary-900 dark:text-primary-100 ms-8">
                     <li>TypeScript</li>
                     <li>React</li>
                     <li>Next.js</li>
                     <li>Tailwind CSS</li>
                     <li>
                        <a href="https://next-ts-tailwindcss-i18n.berkekaragoz.com/">
                           next-ts-tailwindcss-i18n.berkekaragoz.com
                        </a>
                     </li>
                     <li>
                        <HeartIcon className="h-6 text-red-600" />
                     </li>
                     <li className="uppercase-first">
                        <a href="https://github.com/BerkeKaragoz/berkekaragoz.com/blob/main/package.json">
                           {gt("and more")}
                           {"\u2026"}
                        </a>
                     </li>
                  </ul>
               </div>
               <div className="flex gap-8 md:hidden justify-evenly">
                  <button
                     className="w-full p-2 capitalize card-input"
                     onClick={() => handleConfettiClick(false)}
                  >
                     <Trans t={ct} i18nKey="click me">
                        Click Me
                     </Trans>
                     !
                  </button>
                  <button
                     className="w-full p-2 card-input"
                     onClick={() => handleConfettiClick(true)}
                     aria-label="Emoji Confetti"
                  >
                     🎉
                  </button>
               </div>
            </div>
            {/* Hero Widget Left End  */}
            {/* Hero Widget Right Start  */}
            <div className="inline-flex flex-col gap-8 align-top shrink-0 w-80">
               <Slider
                  aria-label="Paragraph Opacity Slider"
                  min={0}
                  max={100}
                  onChange={(e) => {
                     if (!sliderParagraphRef.current) return

                     const { valueAsNumber } = e.target

                     sliderParagraphRef.current.style.opacity = `${valueAsNumber}%`
                  }}
               />

               <div className="flex p-2 card">
                  <p ref={sliderParagraphRef} style={{ opacity: "50%" }}>
                     <Trans t={t} i18nKey="index.hero.widget.interact">
                        Interact with all of these or change the language from the
                        top bar!
                     </Trans>
                  </p>
               </div>
               <div className="hidden gap-8 md:flex justify-evenly">
                  <button
                     className="w-full p-2 capitalize card-input"
                     onClick={() => handleConfettiClick(false)}
                  >
                     <Trans t={ct} i18nKey="click me">
                        Click Me
                     </Trans>
                     !
                  </button>
                  <button
                     className="w-full p-2 card-input"
                     onClick={() => handleConfettiClick(true)}
                     aria-label="Emoji Confetti"
                  >
                     🎉
                  </button>
               </div>
               {latestPostMetas && (
                  <div className="flex flex-col gap-4 bg-primary-200 bg-opacity-25 dark:bg-background-800 rounded-lg dark:bg-opacity-30 p-2">
                     <Tab.Group>
                        <Tab.List className="flex justify-between gap-4 rounded-lg bg-opacity-5 dark:bg-opacity-30">
                           {latestPostMetas.map((v, i) => (
                              <Tab
                                 key={`${nanoid(5)}-${i}`}
                                 className={"card-input p-2 flex-grow"}
                              >
                                 {({ selected }) => (
                                    <span
                                       className={clsx([
                                          "inline-block border-b-4 p-1 rounded-sm font-semibold w-full capitalize",
                                          {
                                             "border-primary-400": selected,
                                          },
                                          {
                                             "border-background-300 dark:border-primary-200 text-primary-800 dark:text-primary-200 text-opacity-60 dark:text-opacity-60":
                                                !selected,
                                          },
                                       ])}
                                    >
                                       {i === 0
                                          ? `${gt("latest")}`
                                          : `${gt("post")} ${i + 1}`}
                                    </span>
                                 )}
                              </Tab>
                           ))}
                        </Tab.List>
                        <Tab.Panels>
                           {latestPostMetas.map((m, i) => (
                              <Tab.Panel key={`${m.slug}-${i}`}>
                                 <PostCard postMeta={m} disableSlug />
                              </Tab.Panel>
                           ))}
                        </Tab.Panels>
                     </Tab.Group>
                  </div>
               )}
               <div className="flex items-center justify-between gap-2">
                  <code className="p-2 font-semibold card">
                     {randomNumber.toString().padStart(2, "0")}
                  </code>
                  <hr className="flex-grow border-primary-300 dark:border-primary-900" />
                  <button
                     className="p-2 card-input"
                     onClick={() => setRandomNumber(generateRandomInt(99))}
                  >
                     &larr;{" "}
                     <Trans t={t} i18nKey="index.hero.widget.generateRandomNumber">
                        Generate Random Number
                     </Trans>
                  </button>
               </div>
               <AudioPlayer />
            </div>
            {/* Hero Widget Right End  */}
            {/* Hero Widget Filler Start  */}
            <div
               className="hidden md:inline-flex flex-col gap-8 align-top shrink-0 w-80 ps-8 opacity-70"
               style={{
                  WebkitMaskImage:
                     "-webkit-gradient(linear, 0% 0%, 100% 0%, from(rgb(0, 0, 0)), to(rgba(0, 0, 0, 0)))",
               }}
            >
               <div className="card h-16" />
               <div className="flex gap-8 h-12">
                  <div className="card w-full" />
                  <div className="card w-full" />
               </div>
               <div className="card h-28" />
               <div className="card h-12" />
               <div className="flex gap-8 h-12">
                  <div className="card w-full" />
                  <div className="card w-full" />
                  <div className="card w-full" />
               </div>
               <div className="card h-60" />
               <div className="card h-12" />
            </div>
            {/* Hero Widget Filler End  */}
         </div>
      </div>
   )
}

export default withTranslation(PAGES_TNS)(HeroWidget)
