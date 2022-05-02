import IconButton from "@/components/atomic/IconButton/IconButton"
import LinkBox from "@/components/atomic/LinkBox/LinkBox"
import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Slider from "@/components/atomic/Slider/Slider"
import AudioPlayer from "@/components/molecular/AudioPlayer/AudioPlayer"
import DrawableCanvas from "@/components/organism/DrawableCanvas/DrawableCanvas"
import Footer from "@/components/organism/Footer/Footer"
import { Header } from "@/components/organism/Header/Header"
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import BitcoinIcon from "@/lib/icons/Bitcoin"
import EthereumIcon from "@/lib/icons/Ethereum"
import { ColorScheme } from "@/lib/types/common"
import { generateRandomInt } from "@/lib/utils"
import { BINANCE_API_HOST, DEFAULT_LOCALE } from "@/lib/utils/consts"
import { Popover, Switch, Tab } from "@headlessui/react"
import {
   DotsVerticalIcon,
   EyeIcon,
   HeartIcon,
   LightBulbIcon,
   PencilIcon,
   ServerIcon,
} from "@heroicons/react/solid"
import clsx from "clsx"
import { nanoid } from "nanoid"
import { GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { useTheme } from "next-themes"
import Head from "next/head"
import React from "react"
import { Trans, useTranslation } from "react-i18next"
import AboutMe from "./components/AboutMe"
import Experience from "./components/Experience"
import Projects from "./components/Projects"
import ReachMe from "./components/ReachMe"
import Socials from "./components/Socials"

const BTC_PRICE_API = `${BINANCE_API_HOST}/avgPrice?symbol=BTCUSDT`
const ETH_PRICE_API = `${BINANCE_API_HOST}/avgPrice?symbol=ETHUSDT`

const colorRed = "rgba(220, 38, 38)"
const colorGreen = "rgba(5, 150, 105)"
const colorBlue = "rgba(37, 99, 235)"

type CoinPriceData = { mins: number; price: string }

const tabText = [
   "Cupiditate provident temporibus enim optio ex fuga fugit eaque, praesentium, minima nobis cum laborum est rem tenetur debitis vero vitae perferendis ad delectus! Blanditiis, quidem nemo nisi eaque dolores ea.",
   "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat culpa libero consectetur, ex cupiditate voluptate? At, temporibus provident eveniet nihil non deleniti ratione animi qui ab dolorem, excepturi delectus.",
   "Natus sapiente praesentium commodi et id a reiciendis distinctio ex quisquam eaque sequi cum eius rerum quae, repellendus corporis placeat, magnam alias. Delectus ducimus itaque natus assumenda quod blanditiis eum.",
]

export const getStaticProps: GetStaticProps = async (ctx) => {
   const { locale = DEFAULT_LOCALE } = ctx

   return {
      props: {
         ...(await serverSideTranslations(locale, [
            PAGES_TNS,
            GLOSSARY_TNS,
            COMMON_TNS,
         ])),
         // Will be passed to the page component as props
      },
   }
}

const Homepage: NextPage = () => {
   const { t } = useTranslation([PAGES_TNS], { keyPrefix: "index" })
   const { t: ct } = useTranslation([COMMON_TNS])
   const { t: gt } = useTranslation([GLOSSARY_TNS])
   const { theme, setTheme: _setTheme } = useTheme()

   const [isDarkTheme, setIsDarkTheme] = React.useState<boolean | undefined>(
      undefined
   )
   const [strokeColor, setStrokeColor] =
      React.useState<CanvasFillStrokeStyles["strokeStyle"]>(colorRed)
   const [isBlurSwitchOn, setIsBlurSwitchOn] = React.useState(false)
   const [clearCount, setClearCount] = React.useState(0)
   const [randomNumber, setRandomNumber] = React.useState(generateRandomInt(99))
   const [btcPrice, setBtcPrice] = React.useState<number>(NaN)
   const [ethPrice, setEthPrice] = React.useState<number>(NaN)

   const setTheme = (theme: ColorScheme) => {
      if (isDarkTheme !== undefined) _setTheme(theme)
   }

   React.useEffect(() => {
      fetch(BTC_PRICE_API)
         .then((req) => req.json())
         .then((data: CoinPriceData) => {
            setBtcPrice(parseFloat(data.price))
         })
         .catch((err) => {
            console.error(err)
         })

      fetch(ETH_PRICE_API)
         .then((req) => req.json())
         .then((data: CoinPriceData) => {
            setEthPrice(parseFloat(data.price))
         })
         .catch((err) => {
            console.error(err)
         })
   }, [])

   React.useEffect(() => {
      setIsDarkTheme(theme === "dark") // ssr
   }, [theme])

   return (
      <PageContainer>
         <Head>
            <title>E. Berke Karagöz | Web Developer</title>
            <meta
               name="description"
               content="Hi, I'm Berke Karagöz. A curious frontend engineer who had been gaining various insights about web development."
            />
            <link rel="icon" href="/favicon.ico" />
         </Head>
         <Header />
         <Main>
            <div className="dark:bg-primary-900 bg-plus-pattern dark:bg-opacity-20">
               <Section
                  id="hero"
                  className="justify-center gap-6 overflow-x-visible h-screen-7/10 lg:gap-8 md:h-full lg:justify-between md:max-h-screen-sm xl:max-h-screen-lg"
               >
                  {/* HERO Intro Start */}
                  <div className="flex flex-col items-start justify-center flex-grow-0 md:w-1/2">
                     <h1 className="text-5xl font-semibold lg:text-6xl">
                        <Trans
                           t={t}
                           i18nKey="hero.title"
                           values={{ name: "Berke Karagöz" }}
                        >
                           {"Hi, I'm"}
                           <br />
                           <strong className="font-bold select-all lg:whitespace-nowrap text-primary-600 dark:text-primary-400">
                              Berke Karagöz
                           </strong>
                           {"."}
                        </Trans>
                     </h1>
                     <p className="max-w-sm mt-2 font-semibold ms-1 text-background-700 dark:text-background-300">
                        <Trans t={t} i18nKey="hero.subtitle">
                           A curious frontend engineer who had been gaining various
                           insights about web development.
                        </Trans>
                     </p>
                     <div className="flex items-stretch gap-2 mt-2 ml-auto md:ml-0">
                        <Popover className="relative">
                           <Popover.Button
                              as={IconButton}
                              className="w-10 h-full p-2"
                              aria-label={t("translate")}
                           >
                              <DotsVerticalIcon />
                           </Popover.Button>

                           <Popover.Panel className="absolute z-40 p-2 mt-2 card max-w-prose">
                              <LinkBox
                                 href="https://box.berkekaragoz.com"
                                 className="flex items-center gap-2 p-2 card-input border-primary-400 dark:border-primary-600 border-opacity-20 dark:border-opacity-20"
                              >
                                 <h2 className="font-semibold">
                                    Box.berkekaragoz.com
                                 </h2>
                                 <ServerIcon className="w-4 h-4" />
                              </LinkBox>
                              <p className="mt-1 text-sm ms-1 opacity-80">
                                 <Trans t={t} i18nKey="hero.boxServerDesc">
                                    My general purpose NGINX, Ubuntu 20.04 server. I
                                    use it as a toolbox.
                                 </Trans>
                              </p>
                           </Popover.Panel>
                        </Popover>
                        <LinkBox
                           href="/posts"
                           className="inline-block px-3 py-2 font-semibold card-input"
                        >
                           <Trans t={t} i18nKey="hero.actionButton">
                              Go to my blog
                           </Trans>{" "}
                           &rarr;
                        </LinkBox>
                     </div>
                  </div>
                  {/* HERO Intro End */}
                  {/* HERO Widget Start (Right side of the page) */}
                  <div className="hidden w-1/2 md:block">
                     {/* Hero Widget Left Start  */}
                     <div
                        className="h-full p-8 overflow-hidden overflow-y-auto bg-opacity-50 rounded-b-xl bg-primary-100 dark:bg-background-900"
                        style={{ minWidth: "2200px" }}
                     >
                        <div className="inline-flex flex-col max-w-md gap-8 pe-8">
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
                                 </div>
                                 <code className="text-sm text-black text-opacity-60 dark:text-opacity-60 dark:text-white ms-1">
                                    {"BTC/USDT"}
                                 </code>
                                 <code className="font-medium ms-2">
                                    {isNaN(btcPrice)
                                       ? "\u2026"
                                       : `${btcPrice.toFixed(0)}~`}
                                 </code>
                              </div>
                              <div className="flex items-center w-full p-2 overflow-hidden card">
                                 <div className="flex items-center flex-shrink-0">
                                    <EthereumIcon
                                       className="bg-purple-900 bg-opacity-25 rounded-full"
                                       width="20px"
                                       height="20px"
                                    />
                                 </div>
                                 <code className="text-sm text-black text-opacity-60 dark:text-opacity-60 dark:text-white ms-1">
                                    {"ETH/USDT"}
                                 </code>
                                 <code className="font-medium ms-2">
                                    {isNaN(ethPrice)
                                       ? "\u2026"
                                       : `${ethPrice.toFixed(0)}~`}
                                 </code>
                              </div>
                           </div>
                           {/* Canvas Section */}
                           <div className="flex gap-8 overflow-hidden rounded-lg">
                              <div className="relative card">
                                 <DrawableCanvas
                                    className={clsx([
                                       { "filter blur-sm": isBlurSwitchOn },
                                    ])}
                                    strokeStyle={strokeColor}
                                    clear={clearCount}
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
                                    <div className="w-full h-full bg-red-600 rounded-full" />
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
                                    <div className="w-full h-full bg-green-600 rounded-full" />
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
                                    <div className="w-full h-full bg-blue-600 rounded-full" />
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
                           <div className="flex items-center justify-between gap-2">
                              <Switch.Group
                                 as="div"
                                 className="flex items-center gap-2"
                              >
                                 <Switch.Label className="text-primary-600 dark:text-primary-200">
                                    <Trans t={t} i18nKey="hero.widget.switchLabel">
                                       Enable Canvas Blur
                                    </Trans>
                                 </Switch.Label>
                                 <Switch
                                    checked={isBlurSwitchOn}
                                    onChange={setIsBlurSwitchOn}
                                    className={clsx([
                                       "relative card inline-flex items-center h-6 rounded-full w-11",
                                       {
                                          "bg-primary-400 dark:bg-primary-600":
                                             isBlurSwitchOn,
                                       },
                                       {
                                          "bg-background-400 dark:bg-background-700":
                                             !isBlurSwitchOn,
                                       },
                                    ])}
                                 >
                                    <span
                                       className={clsx([
                                          "duration-100 inline-block w-4 h-4 transform bg-white dark:bg-primary-50 rounded-full",
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
                                       { "filter blur-sm": isBlurSwitchOn },
                                    ])}
                                 />
                              </div>
                           </div>
                           {/* Website Made with Section */}
                           <div className="w-full px-3 py-2 card">
                              <p className="text-primary-600 dark:text-primary-200">
                                 <Trans t={t} i18nKey="hero.widget.websiteTechTitle">
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
                        </div>
                        {/* Hero Widget Left End  */}
                        {/* Hero Widget Right Start  */}
                        <div className="inline-flex flex-col max-w-md gap-8 align-top w-80">
                           <Slider />
                           <div className="flex p-2 card">
                              <p className="opacity-50">
                                 <Trans t={t} i18nKey="hero.widget.interact">
                                    Interact with all of these or change the language
                                    from the top bar!
                                 </Trans>
                              </p>
                           </div>
                           <Tab.Group>
                              <Tab.List className="flex justify-between gap-8 p-2 bg-black rounded-lg bg-opacity-5 dark:bg-opacity-30">
                                 {[...Array(3)].map((v, i) => (
                                    <Tab
                                       key={`${nanoid(5)}-${i}`}
                                       className={"card-input p-2 flex-grow"}
                                    >
                                       {({ selected }) => (
                                          <span
                                             className={clsx([
                                                "inline-block border-b-4 p-1 rounded-sm font-semibold w-full uppercase-first",
                                                {
                                                   "border-primary-400": selected,
                                                },
                                                {
                                                   "border-background-300 dark:border-primary-200 text-primary-800 dark:text-primary-200 text-opacity-60 dark:text-opacity-60":
                                                      !selected,
                                                },
                                             ])}
                                          >
                                             {`${gt("tab")} ${i + 1}`}
                                          </span>
                                       )}
                                    </Tab>
                                 ))}
                              </Tab.List>
                              <Tab.Panels className="p-3 card text-primary-800 dark:text-primary-200 dark:text-opacity-75">
                                 {[...Array(3)].map((v, i) => (
                                    <Tab.Panel as="p" key={`${nanoid(5)}-${i}`}>
                                       {i + 1} - {tabText[i]}
                                    </Tab.Panel>
                                 ))}
                              </Tab.Panels>
                           </Tab.Group>
                           <div className="flex items-center justify-between gap-2">
                              <code className="p-2 font-semibold card">
                                 {randomNumber.toString().padStart(2, "0")}
                              </code>
                              <hr className="flex-grow border-primary-300 dark:border-primary-900" />
                              <button
                                 className="p-2 card-input"
                                 onClick={() =>
                                    setRandomNumber(generateRandomInt(99))
                                 }
                              >
                                 &larr;{" "}
                                 <Trans
                                    t={t}
                                    i18nKey="hero.widget.generateRandomNumber"
                                 >
                                    Generate Random Number
                                 </Trans>
                              </button>
                           </div>
                           <AudioPlayer />
                        </div>
                        {/* Hero Widget Right End  */}
                     </div>
                  </div>
                  {/* HERO Widget End */}
               </Section>
               <Section id="socials">
                  <Socials />
               </Section>
            </div>
            <Section id="projects">
               <Projects />
            </Section>

            <div className="dark:bg-primary-900 bg-plus-pattern dark:bg-opacity-20">
               <Section id="about-me">
                  <AboutMe />
               </Section>
            </div>
            <Section id="experience">
               <Experience />
            </Section>
            <Section id="contact">
               <ReachMe />
            </Section>
         </Main>
         <Footer />
      </PageContainer>
   )
}

export default Homepage
