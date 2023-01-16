import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import { Header } from "@/components/organism/Header/Header"
import { getAllPosts, PostMeta } from "@/lib/api/blog"
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import Head from "next/head"
import React from "react"
import AboutMe from "./_components/AboutMe"
import Experience from "./_components/Experience"
import HeroIntro from "./_components/HeroIntro"
import HeroWidget from "./_components/HeroWidget"
import Projects from "./_components/Projects"
import ReachMe from "./_components/ReachMe"
import Socials from "./_components/Socials"

export const getStaticProps: GetStaticProps = async (ctx) => {
   const { locale = DEFAULT_LOCALE } = ctx

   const latestPostMetas = getAllPosts()
      .slice(0, 3)
      .map((post) => post.meta)

   return {
      props: {
         ...(await serverSideTranslations(locale, [
            PAGES_TNS,
            GLOSSARY_TNS,
            COMMON_TNS,
         ])),
         // Will be passed to the page component as props
         latestPostMetas,
      },
   }
}

const Homepage: NextPage<{ latestPostMetas: PostMeta[] }> = (props) => {
   const { latestPostMetas } = props

   return (
      <PageContainer>
         <Head>
            <title>E. Berke Karagöz | Web Developer</title>
            <meta
               name="description"
               content="Hi, I'm Berke Karagöz. A curious frontend engineer who had been gaining various insights about web development."
            />
         </Head>

         <Header />

         <Main>
            <div className="dark:bg-primary-900 bg-plus-pattern dark:bg-opacity-20">
               <Section
                  id="hero"
                  className="flex-col justify-center h-full gap-6 overflow-x-visible md:flex-row md:max-h-screen-sm xl:max-h-screen-lg lg:gap-8"
               >
                  {/* Left side of the Hero */}
                  <HeroIntro />

                  {/* Right */}
                  <HeroWidget latestPostMetas={latestPostMetas} />
               </Section>

               <Section id="socials">
                  <Socials />
               </Section>
            </div>

            <div className="bg-radial-gradient-100">
               <Section id="projects">
                  <Projects />
               </Section>
            </div>

            <div className="dark:bg-primary-900 bg-plus-pattern dark:bg-opacity-20">
               <Section id="about-me">
                  <AboutMe />
               </Section>
            </div>

            <div className="pb-8 bg-linear-gradient-100">
               <Section id="experience">
                  <Experience />
               </Section>

               <Section id="contact">
                  <ReachMe />
               </Section>
            </div>
         </Main>

         <Footer />
      </PageContainer>
   )
}

export default Homepage
