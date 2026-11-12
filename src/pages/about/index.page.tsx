import LinkBox from "@/components/atomic/LinkBox/LinkBox"
import Main from "@/components/atomic/Main/Main"
import Section from "@/components/atomic/Section/Section"
import PlusBand from "@/components/molecular/PlusBand/PlusBand"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import { COMMON_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { useCanonicalUrl } from "@/lib/i18n/useCanonicalUrl"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { GetStaticProps, NextPage } from "next"
import { useTranslation } from "next-i18next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import Head from "next/head"
import React from "react"
import AboutMe from "../_components/AboutMe"
import Experience from "../_components/Experience"

// The homepage's About Me and Experience sections as a page of their own.
// The words live in those components and in the homepage strings, so the two
// can't drift apart.

const AboutPage: NextPage = () => {
   const { t } = useTranslation([PAGES_TNS])
   const canonicalUrl = useCanonicalUrl("/about")

   return (
      <div>
         <Head>
            <title>{t("about.meta.title")}</title>
            <meta name="description" content={t("about.meta.description")} />
            <link rel="canonical" href={canonicalUrl} />
         </Head>
         <Header />
         <Main>
            <PlusBand>
               <div className="h-24" />
               <Section className="flex-col pt-8">
                  <h1 className="text-5xl font-semibold text-center text-caption-color lg:text-left">
                     Berke Karagöz
                  </h1>
                  <hr className="mt-4 mb-6 divider" />
                  <p className="text-lg max-w-prose">{t("index.hero.subtitle")}</p>
               </Section>
               <Section>
                  <AboutMe />
               </Section>
            </PlusBand>

            <div className="pb-8 bg-linear-gradient-100">
               <Section>
                  <Experience />
               </Section>
               <Section className="justify-center pb-16">
                  <LinkBox
                     href="/contact"
                     className="inline-block px-3 py-2 font-semibold card-input"
                  >
                     {t("index.reachMe.title")} &rarr;
                  </LinkBox>
               </Section>
            </div>
         </Main>
         <Footer />
      </div>
   )
}

export const getStaticProps: GetStaticProps = async ({ locale = DEFAULT_LOCALE }) => ({
   props: {
      ...(await serverSideTranslations(locale, [PAGES_TNS, COMMON_TNS])),
   },
})

export default AboutPage
