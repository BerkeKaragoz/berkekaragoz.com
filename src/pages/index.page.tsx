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
        <title>E. Berke Karagöz</title>
        <meta name="description" content="E. Berke Karagöz's website." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Main>
        <section className="flex flex-row items-stretch min-h-full overflow-hidden max-h-screen-sm">
          <div className="flex flex-col justify-center">
            <h1 className="text-6xl font-semibold">
              {"Hi, I'm"}
              <br />
              <strong className="font-bold select-all lg:whitespace-nowrap text-primary-600 dark:text-primary-400">
                E. Berke Karagöz
              </strong>
              {"."}
            </h1>
          </div>
          <div>
            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sunt
              eligendi blanditiis asperiores nemo excepturi, et quasi nisi, vero
              expedita quas repellendus doloribus voluptatem nesciunt unde modi?
              Vitae repellendus asperiores modi!
            </p>
            <AudioPlayer src="./assets/sample-music.mp3" />
          </div>
        </section>
      </Main>
    </PageContainer>
  );
};

export default Homepage;
