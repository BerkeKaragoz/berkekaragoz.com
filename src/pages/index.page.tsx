import { Header } from "@/components/organism/Header/Header";
import Main from "@/components/atomic/Main/Main";
import PageContainer from "@/components/atomic/PageContainer/PageContainer";
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts";
import { GetStaticProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import AudioPlayer from "@/components/molecular/AudioPlayer/AudioPlayer";

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
  const { t: gt } = useTranslation([GLOSSARY_TNS]);

  return (
    <PageContainer>
      <Head>
        <title>Berke Karagöz</title>
        <meta name="description" content="Berke Karagöz's website." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Main>
        <section className="grid h-full grid-flow-col gap-8 overflow-hidden bg-yellow-900 max-h-screen-sm">
          <div className="flex flex-col justify-center bg-red-800">
            <h1 className="text-6xl font-semibold">
              {"Hi, I'm"}
              <br />
              <strong className="font-bold select-all lg:whitespace-nowrap text-primary-600 dark:text-primary-400">
                Berke Karagöz
              </strong>
              {"."}
            </h1>
          </div>
          <div className="bg-gray-800">
            <AudioPlayer
              src="https://upload.wikimedia.org/wikipedia/commons/b/bd/Rondo_Alla_Turka.ogg"
              imageSrc="https://upload.wikimedia.org/wikipedia/commons/4/47/Croce-Mozart-Detail.jpg"
              title="Rondo Alla Turka"
              subtitle="Wolfgang Amadeus Mozart's Piano Sonata No. 11"
              defaultVolume={0.35}
              defaultLoop
            />
          </div>
        </section>
      </Main>
    </PageContainer>
  );
};

export default Homepage;
