import { PostMeta } from "@/lib/api/blog"
import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import "highlight.js/styles/atom-one-dark.css"
import { GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote"
import { serialize } from "next-mdx-remote/serialize"
import Head from "next/head"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import { AppMDXComponents } from "@/lib/utils/MDX"
import LinkText from "@/components/atomic/LinkText/LinkText"
import { estimateReadingMinutes } from "@/lib/utils"
import { DEFAULT_LOCALE } from "@/lib/utils/consts"
import { useTranslation } from "react-i18next"
import React from "react"
import matter from "gray-matter"
import { getPostMeta } from "@/lib/api/blog-client"
import { BeakerIcon } from "@heroicons/react/outline"
import PostCard from "@/components/molecular/PostCard/PostCard"

interface MDXPost {
   source: MDXRemoteSerializeResult<Record<string, unknown>>
   meta: PostMeta
}

const _serialize = (stringContent: string) =>
   serialize(stringContent, {
      mdxOptions: {
         rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
            rehypeHighlight,
            rehypeAccessibleEmojis,
         ],
      },
   })

const defaultStringContent = `---
title: Post title
tags:
   - testing
   - javascript
   - C
date: 04 Feb 23 19:55 UTC+3
excerpt: How do testing frameworks work?
---

You better not write the blog post here. Write somewhere else and paste here...`

export const PreviewPage: NextPage<{ defaultPost: MDXPost }> = (props) => {
   const { defaultPost } = props

   const [post, setPost] = React.useState<MDXPost>(defaultPost)
   const textareaRef = React.useRef<HTMLTextAreaElement>(null)

   const { i18n } = useTranslation([PAGES_TNS], { keyPrefix: "p.[slug]" })
   const locale = i18n.language ?? DEFAULT_LOCALE

   const { t: ct } = useTranslation([COMMON_TNS])

   const postDate = React.useMemo(
      () => new Date(post ? post.meta.date : Date.now()),
      [post]
   )

   const preparePreview = React.useCallback((stringContent: string) => {
      const matterFile = matter(stringContent)
      const meta = getPostMeta(
         matterFile.content,
         matterFile.data,
         "preview-post-slug"
      )

      _serialize(matterFile.content).then((source) => {
         console.log(source.compiledSource)

         setPost({
            source,
            meta,
         })
      })
   }, [])

   return (
      <PageContainer>
         <Head>
            <title>Post Preview | E. Berke Karagöz</title>
         </Head>
         <Header />
         <Main>
            <div className="h-16 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
            <Section prose block className="mb-8">
               <div className="block sm:flex justify-between">
                  <h1 className="h1 mb-2">Post Preview</h1>
                  <a
                     href="https://dillinger.io"
                     target="_blank"
                     className="place-self-end"
                     rel="noreferrer"
                  >
                     Go to Dillinger
                  </a>
               </div>
               <textarea
                  placeholder="Paste MDX here..."
                  defaultValue={defaultStringContent}
                  className="w-full block h-96 my-4 p-2 card"
                  onPaste={(e) => {
                     preparePreview(e.clipboardData.getData("Text"))
                  }}
                  ref={textareaRef}
               />
               <div className="text-right">
                  <button
                     className="card-input xs:w-48 p-2"
                     onClick={() => {
                        if (!textareaRef.current) return
                        const stringContent = textareaRef.current.value

                        preparePreview(stringContent)
                     }}
                  >
                     Preview
                     <BeakerIcon
                        height={22}
                        width={22}
                        className="inline-block ml-0.5"
                     />
                  </button>
               </div>
            </Section>
            <div className="h-12 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
            <div className="mx-auto rounded-none md:py-4 md:px-4 card-backdrop md:w-min">
               <Section
                  as="article"
                  block
                  prose
                  className="py-8 md:py-4 sm:text-lg w-full"
               >
                  <div style={{ width: "100vw", height: 0 }} />
                  <h1 className="mt-0 mb-1 md:mt-2 h1 text-gradient-primary">
                     {post.meta.title}
                  </h1>
                  <p className="mb-6 text-right opacity-60 text-subtitle-color">
                     {`${postDate.toLocaleDateString(locale)} `}
                     {`• ${estimateReadingMinutes(post.meta.wordCount)} ${ct(
                        "min read"
                     )}`}
                  </p>
                  <MDXRemote {...post.source} components={AppMDXComponents} />
                  <p className="mt-8 text-right opacity-60">
                     {`"${post.meta.title}", ${postDate.toLocaleString(locale)}`}
                  </p>
                  <p className="text-right opacity-80">
                     {post.meta.tags.map((tag, i) => (
                        <span key={tag}>
                           <LinkText href={`/posts/${tag}`}>{`#${tag}`}</LinkText>
                           {i !== post.meta.tags.length - 1 && `, `}
                        </span>
                     ))}
                  </p>
               </Section>
            </div>

            <div className="h-12 bg-plus-pattern dark:bg-background-900" />

            <div className="mx-auto rounded-none p-2 sm:p-4 sm:w-min">
               <PostCard
                  key={`${post.meta.slug}`}
                  postMeta={post.meta}
                  className="min-w-max w-full"
               />
            </div>

            <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
         </Main>
         <Footer />
      </PageContainer>
   )
}

export const getStaticProps: GetStaticProps = async (ctx) => {
   const { locale = DEFAULT_LOCALE } = ctx
   const matterFile = matter(defaultStringContent)
   const source = await _serialize(matterFile.content)
   const meta = getPostMeta(matterFile.content, matterFile.data, "preview-post-slug")

   return {
      props: {
         ...(await serverSideTranslations(locale, [
            PAGES_TNS,
            GLOSSARY_TNS,
            COMMON_TNS,
         ])),
         defaultPost: { source, meta },
      },
   }
}

export default PreviewPage
