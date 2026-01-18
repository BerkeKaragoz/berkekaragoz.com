import LinkText from "@/components/atomic/LinkText/LinkText"
import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import PostList from "@/components/organism/PostList/PostList"
import { getAllPosts, PostMeta } from "@/lib/api/blog"
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { BeakerIcon } from "@heroicons/react/outline"
import { GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import Head from "next/head"
import React from "react"
import { Trans, useTranslation } from "next-i18next"

// TODO pass locale to date parsing
// TODO empty state
export const PostsPage: NextPage<{
   postMetas: PostMeta[]
   postTags: PostMeta["tags"]
}> = (props) => {
   const { postMetas, postTags } = props

   const { t } = useTranslation([PAGES_TNS], { keyPrefix: "posts" })

   const [isShowTags, setIsShowTags] = React.useState(false)

   const handleShowTags = () => {
      setIsShowTags((s) => !s)
   }

   return (
      <PageContainer>
         <Head>
            <title>E. Berke Karagöz | Posts</title>
         </Head>
         <Header />
         <Main>
            <div className="h-16 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
            <Section as="article" className="py-16" block>
               <div className="flex justify-between mb-6">
                  <h1 className="my-0 h1">
                     <Trans t={t} i18nKey="index.heading">
                        Posts
                     </Trans>
                  </h1>
                  <LinkText
                     href="/posts/preview"
                     className="self-end text-sm sm:text-base"
                  >
                     Preview
                     <BeakerIcon className="inline-block h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                  </LinkText>
               </div>
               <p>
                  <Trans
                     t={t}
                     i18nKey="index.description"
                     values={{
                        postCount: postMetas.length.toLocaleString(),
                        tagCount: postTags.length.toLocaleString(),
                     }}
                  >
                     There are <b>{postMetas.length.toLocaleString()}</b>
                     {" published posts and "}
                     <b>{postTags.length.toLocaleString()}</b> unique tags.
                  </Trans>
               </p>
               <p>
                  <button className="capitalize link" onClick={handleShowTags}>
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
   const { locale = DEFAULT_LOCALE } = ctx
   const postMetas = getAllPosts().map((post) => post.meta)
   const postTagsSet = new Set(postMetas.map((m) => m.tags).flat())

   const postTags = Array.from(postTagsSet).sort((a, b) => a.localeCompare(b))

   return {
      props: {
         ...(await serverSideTranslations(locale, [
            PAGES_TNS,
            GLOSSARY_TNS,
            COMMON_TNS,
         ])),
         // Will be passed to the page component as props
         postMetas,
         postTags,
      },
   }
}

export default PostsPage
