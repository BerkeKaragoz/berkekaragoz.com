import { Header } from "@/components/organism/Header/Header";
import Main from "@/components/atomic/Main/Main";
import PageContainer from "@/components/atomic/PageContainer/PageContainer";
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts";
import { GetStaticProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import AudioPlayer from "@/components/molecular/AudioPlayer/AudioPlayer";
import Section from "@/components/atomic/Section/Section";
import IconButton from "@/components/atomic/IconButton/IconButton";
import { useTheme } from "next-themes";
import React from "react";
import { LightBulbIcon, PencilIcon } from "@heroicons/react/solid";
import { ColorScheme } from "@/lib/types/common";
import { BINANCE_API_HOST } from "@/lib/utils/consts";
import Image from "next/image";
import DrawableCanvas from "@/components/organism/DrawableCanvas/DrawableCanvas";
import clsx from "clsx";
import Switch from "@/components/atomic/Switch/Switch";

const BTC_PRICE_API = `${BINANCE_API_HOST}/avgPrice?symbol=BTCBUSD`;
const ETH_PRICE_API = `${BINANCE_API_HOST}/avgPrice?symbol=ETHBUSD`;

const colorRed = "rgba(220, 38, 38)";
const colorGreen = "rgba(5, 150, 105)";
const colorBlue = "rgba(37, 99, 235)";

type CoinPriceData = { mins: number; price: string };

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { locale } = ctx;

  return {
    props: {
      ...(await serverSideTranslations(locale || "en", [
        PAGES_TNS,
        GLOSSARY_TNS,
        COMMON_TNS,
      ])),
      // Will be passed to the page component as props
    },
  };
};

const Homepage: NextPage = () => {
  const { t } = useTranslation([PAGES_TNS], { keyPrefix: "index" });
  const { t: ct } = useTranslation([COMMON_TNS]);
  const { theme, setTheme: _setTheme } = useTheme();

  const [isDarkTheme, setIsDarkTheme] = React.useState<boolean | undefined>(
    undefined,
  );
  const [strokeColor, setStrokeColor] =
    React.useState<CanvasFillStrokeStyles["strokeStyle"]>(colorRed);
  const [clearCount, setClearCount] = React.useState(0);
  const [btcPrice, setBtcPrice] = React.useState<number>(NaN);
  const [ethPrice, setEthPrice] = React.useState<number>(NaN);

  const setTheme = (theme: ColorScheme) => {
    if (isDarkTheme !== undefined) _setTheme(theme);
  };

  React.useEffect(() => {
    fetch(BTC_PRICE_API)
      .then((req) => req.json())
      .then((data: CoinPriceData) => {
        setBtcPrice(parseFloat(data.price));
      })
      .catch((err) => {
        console.log(err);
      });

    fetch(ETH_PRICE_API)
      .then((req) => req.json())
      .then((data: CoinPriceData) => {
        setEthPrice(parseFloat(data.price));
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  React.useEffect(() => {
    setIsDarkTheme(theme === "dark"); //ssr
  }, [theme]);

  return (
    <PageContainer>
      <Head>
        <title>Berke Karagöz</title>
        <meta name="description" content="Berke Karagöz's website." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Main>
        <div className="dark:bg-primary-900 dark:bg-opacity-20">
          <Section className="flex h-full gap-8 overflow-x-visible max-h-screen-sm">
            <div className="flex flex-col items-start justify-center flex-grow-0 w-1/2 ">
              <h1 className="text-6xl font-semibold">
                {"Hi, I'm"}
                <br />
                <strong className="font-bold select-all lg:whitespace-nowrap text-primary-600 dark:text-primary-400">
                  Berke Karagöz
                </strong>
                {"."}
              </h1>
              <p className="max-w-sm mt-2 font-semibold ms-1 text-background-700 dark:text-background-300">
                A curious frontend engineer who had been gaining various
                insights about web development.
              </p>
              <button className="inline-block px-3 py-2 mt-4 font-semibold card-input ">
                See my projects &rarr;
              </button>
            </div>
            <div className="w-1/2">
              <div
                className="h-full p-8 overflow-hidden overflow-y-auto bg-opacity-50 rounded-b-xl bg-primary-100 dark:bg-background-900"
                style={{ minWidth: "2200px" }}
              >
                <div className="inline-flex flex-col max-w-md gap-8 pe-8">
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
                  <AudioPlayer
                    src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Rondo_Alla_Turka.ogg"
                    imageSrc="https://upload.wikimedia.org/wikipedia/commons/4/47/Croce-Mozart-Detail.jpg"
                    title="Rondo Alla Turka"
                    subtitle="Wolfgang Amadeus Mozart's Piano Sonata No. 11"
                    defaultVolume={0.35}
                    defaultLoop
                  />
                  <div className="flex justify-between gap-8">
                    <div className="flex items-center w-full p-2 overflow-hidden card">
                      <div className="flex items-center flex-shrink-0">
                        <Image
                          src="/assets/btc.svg"
                          alt="Bitcoin"
                          width="20px"
                          height="20px"
                        />
                      </div>
                      <code className="text-sm text-black text-opacity-60 dark:text-opacity-60 dark:text-white ms-1">
                        {"BTC/BUSD"}
                      </code>
                      <code className="font-medium ms-2">
                        {isNaN(btcPrice) ? "\u2026" : `${btcPrice.toFixed(0)}~`}
                      </code>
                    </div>
                    <div className="flex items-center w-full p-2 overflow-hidden card">
                      <div className="flex items-center flex-shrink-0">
                        <Image
                          className="bg-purple-900 bg-opacity-25 rounded-full"
                          src="/assets/eth.svg"
                          alt="Ethereum"
                          width="20px"
                          height="20px"
                        />
                      </div>
                      <code className="text-sm text-black text-opacity-60 dark:text-opacity-60 dark:text-white ms-1">
                        {"ETH/BUSD"}
                      </code>
                      <code className="font-medium ms-2">
                        {isNaN(ethPrice) ? "\u2026" : `${ethPrice.toFixed(0)}~`}
                      </code>
                    </div>
                  </div>
                  <div className="flex gap-8 overflow-hidden rounded-lg">
                    <div className="relative card">
                      <DrawableCanvas
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
                  <div>
                    <Switch />
                  </div>
                </div>
                <div className="inline-flex flex-col max-w-md gap-8 align-top">
                  <input type="range" />
                  <AudioPlayer />
                  <AudioPlayer />
                  <AudioPlayer />
                  <AudioPlayer
                    src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Rondo_Alla_Turka.ogg"
                    imageSrc="https://upload.wikimedia.org/wikipedia/commons/4/47/Croce-Mozart-Detail.jpg"
                    title="Rondo Alla Turka"
                    subtitle="Wolfgang Amadeus Mozart's Piano Sonata No. 11"
                    defaultVolume={0.35}
                    defaultLoop
                  />
                  <AudioPlayer />
                  <AudioPlayer />
                </div>
              </div>
            </div>
          </Section>
          <Section>
            <p className="py-32">
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Exercitationem repellat accusantium sint quam corrupti eum atque
              et, beatae dicta sit, iste, tenetur tempora. Voluptatem quos ut
              possimus vel optio maiores.
            </p>
          </Section>
        </div>
      </Main>
    </PageContainer>
  );
};

export default Homepage;
