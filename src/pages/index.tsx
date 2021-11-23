import { Header } from "@/components/organism/Header/Header";
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts";
import { GetStaticProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useTranslation } from "react-i18next";

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
    <>
      <Head>
        <title>E. Berke Karagöz</title>
        <meta name="description" content="E. Berke Karagöz's website." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <main></main>
    </>
  );
};

export default Homepage;
