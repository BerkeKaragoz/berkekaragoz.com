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
import ReachMe from "../_components/ReachMe"
import Socials from "../_components/Socials"

// The homepage's "Get In Touch" block and its GitHub and LinkedIn links as a
// page of their own. There is no form: the address is a mailto.

const ContactPage: NextPage = () => {
   const { t } = useTranslation([PAGES_TNS])
   const canonicalUrl = useCanonicalUrl("/contact")

   return (
      <div>
         <Head>
            <title>{t("contact.meta.title")}</title>
            <meta name="description" content={t("contact.meta.description")} />
            <link rel="canonical" href={canonicalUrl} />
         </Head>
         <Header />
         <Main>
            <PlusBand>
               <div className="h-24" />
               <Section className="flex-col pt-8">
                  <h1 className="text-5xl font-semibold text-center text-caption-color lg:text-left">
                     {t("contact.title")}
                  </h1>
                  <hr className="mt-4 mb-6 divider" />
                  <p className="text-lg max-w-prose">{t("contact.intro")}</p>
               </Section>
               <Section>
                  <ReachMe />
               </Section>
               <Section>
                  <Socials />
               </Section>
            </PlusBand>
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

export default ContactPage
