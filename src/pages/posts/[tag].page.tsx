import LinkText from "@/components/atomic/LinkText/LinkText"
import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import PostList from "@/components/organism/PostList/PostList"
import { getAllPosts, PostMeta } from "@/lib/api/blog"
import { PAGES_TNS, GLOSSARY_TNS, COMMON_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { GetStaticPaths, GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import Head from "next/head"
import React from "react"
import { Trans, useTranslation } from "next-i18next"

export const TagPage: NextPage<{
   postMetas: PostMeta[]
   tag: string
   postTags: PostMeta["tags"]
}> = (props) => {
   const { postMetas, postTags, tag } = props
   const { t } = useTranslation([PAGES_TNS], { keyPrefix: "posts" })

   const [isShowTags, setIsShowTags] = React.useState(false)

   const handleShowTags = () => {
      setIsShowTags((s) => !s)
   }

   return (
      <PageContainer>
         <Head>
            <title>#{tag} Posts | E. Berke Karagöz</title>
         </Head>
         <Header />
         <Main>
            <div className="h-16 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
            <Section block className="py-16">
               <h1 className="mt-0 h1">
                  <Trans t={t} i18nKey="[tag].heading">
                     Posts
                  </Trans>
               </h1>
               <h2 className="mt-0 uppercase-first h3">
                  <Trans t={t} i18nKey="[tag].with tag">
                     With tag
                  </Trans>
                  {`: #${tag}`}
               </h2>
               <p>
                  <Trans
                     t={t}
                     i18nKey="[tag].description"
                     values={{
                        postCount: postMetas.length.toLocaleString(),
                        tagCount: postTags.length.toLocaleString(),
                     }}
                  >
                     There are <b>{postMetas.length.toLocaleString()}</b>
                     {" published posts and "}
                     <b>{postTags.length.toLocaleString()}</b> unique tags in this
                     search.
                  </Trans>
               </p>
               <p>
                  <button className="link capitalize" onClick={handleShowTags}>
                     {isShowTags ? (
                        <Trans t={t} i18nKey="hide tags">
                           Hide Tags
                        </Trans>
                     ) : (
                        <Trans t={t} i18nKey="show tags">
                           Show Tags
                        </Trans>
                     )}
                  </button>
               </p>
               {isShowTags && (
                  <p className="mt-2">
                     {postTags.map((tag, i) => (
                        <span key={`${tag}-${i}`}>
                           <LinkText href={`/posts/${tag}`}>{`#${tag}`}</LinkText>
                           {i !== postTags.length - 1 && `, `}
                        </span>
                     ))}
                  </p>
               )}
               <PostList postMetas={postMetas} />
            </Section>
            <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
         </Main>
         <Footer />
      </PageContainer>
   )
}

export const getStaticProps: GetStaticProps = async (ctx) => {
   const { params, locale = DEFAULT_LOCALE } = ctx
   const { tag } = params as { tag: string }

   const postMetas = getAllPosts()
      .filter((post) => post.meta.tags.includes(tag))
      .map((post) => post.meta)

   const postTagsSet = new Set(postMetas.map((m) => m.tags).flat())

   const postTags = Array.from(postTagsSet).sort((a, b) => a.localeCompare(b))

   return {
      props: {
         ...(await serverSideTranslations(locale, [
            PAGES_TNS,
            GLOSSARY_TNS,
            COMMON_TNS,
         ])),
         postMetas,
         postTags,
         tag,
      },
   }
}

export const getStaticPaths: GetStaticPaths = async ({
   locales = [DEFAULT_LOCALE],
}) => {
   const posts = getAllPosts()
   const tags = new Set(posts.map((post) => post.meta.tags).flat())
   const paths = Array.from(tags)
      .map((tag) =>
         locales.map((locale) => ({
            params: { tag },
            locale,
         }))
      )
      .flat()

   return {
      paths,
      fallback: false,
   }
}

export default TagPage
