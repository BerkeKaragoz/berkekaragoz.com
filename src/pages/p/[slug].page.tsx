import LinkText from "@/components/atomic/LinkText/LinkText"
import Main from "@/components/atomic/Main/Main"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import { getPostFromSlug, getSlugs, PostMeta } from "@/lib/api/blog"
import { serializeWithAppOptions } from "@/lib/api/blog-client"
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts"
import { estimateReadingMinutes } from "@/lib/utils"
import { DEFAULT_LOCALE, HOST_URL } from "@/lib/utils/consts"
import { RenderMDX } from "@/lib/utils/MDX"
import "highlight.js/styles/atom-one-dark.css"
import { GetStaticPaths, GetStaticProps, NextPage } from "next"
import { serverSideTranslations } from "next-i18next/serverSideTranslations"
import { MDXRemoteSerializeResult } from "next-mdx-remote"
import Head from "next/head"
import { useTranslation } from "react-i18next"

interface MDXPost {
   source: MDXRemoteSerializeResult<Record<string, unknown>>
   meta: PostMeta
}

export const PostPage: NextPage<{ post: MDXPost }> = (props) => {
   const { post } = props

   const { i18n } = useTranslation([PAGES_TNS], { keyPrefix: "p.[slug]" })
   const locale = i18n.language ?? DEFAULT_LOCALE

   const { t: ct } = useTranslation([COMMON_TNS])
   const { source, meta } = post

   const postDate = new Date(meta.date)
   const description =
      meta.excerpt ??
      `Read the post "${meta.title}" written on ${postDate.toLocaleDateString(
         locale
      )}.`
   const canonicalUrl = `/p/${meta.slug}`

   return (
      <PageContainer>
         <Head>
            <title>{meta.title} | E. Berke Karagöz</title>
            <meta name="description" content={description} />
            <meta content={meta.tags.toString()} name="keywords" />
            <meta content="Berke Karagoz" name="Author" />
            <meta content="mail@berkekaragoz.com" name="Email" />
            <link rel="canonical" href={canonicalUrl} />
            <meta content="general" name="rating" />
            <meta content="all" name="audience" />
            <meta content="global" name="distribution" />
            <meta name="target" content="all" />
            <meta name="coverage" content="Worldwide" />
            <meta name="category" content="Technology" />

            {/* <!-- Robots--> */}
            <meta name="robots" content="all" />
            <meta content="index, follow" name="robots" />
            <meta content="index, follow" name="GOOGLEBOT" />
            <meta content="index, follow" name="yahooBOT" />
            <meta content="index, follow" name="yandexBOT" />

            {/* <!-- Open Graph meta tags for social media sharing --> */}
            <meta property="og:title" content={meta.title} />
            <meta property="og:site_name" content="Berke Karagoz" />
            <meta property="og:description" content={description} />
            {meta.coverSrc && (
               <meta property="og:image" content={`${HOST_URL}${meta.coverSrc}`} />
            )}
            <meta property="og:url" content={`${HOST_URL}/${canonicalUrl}`} />
            <meta property="og:type" content="article" />
            <meta name="og:email" content="mail@berkekaragoz.com" />

            {/* <!-- Twitter Card meta tags for Twitter sharing --> */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@EBerkeKaragoz" />
            <meta name="twitter:creator" content="@EBerkeKaragoz" />
            <meta name="twitter:title" content={meta.title} />
            <meta name="twitter:description" content={description} />
            {meta.coverSrc && (
               <meta name="twitter:image" content={`${HOST_URL}${meta.coverSrc}`} />
            )}

            {/* <!-- Article meta tags --> */}
            <meta
               property="article:published_time"
               content={postDate.toISOString()}
            />
            <meta property="article:author" content={`${HOST_URL}/posts`} />
            <meta property="article:section" content="Technology" />
            <meta property="article:tag" content="blogging" />
         </Head>
         <Header />
         <Main>
            <div className="h-16 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
            <div className="mx-auto rounded-none md:py-4 md:px-4 card-backdrop md:w-min">
               <Section as="article" block prose className="py-8 md:py-4 sm:text-lg">
                  <div style={{ width: "100vw", height: 0 }} />
                  <h1 className="mt-0 mb-1 md:mt-2 h1 text-gradient-primary">
                     {meta.title}
                  </h1>
                  <p className="mb-6 text-right opacity-60 text-subtitle-color">
                     {`${postDate.toLocaleDateString(locale)} `}
                     {`• ${estimateReadingMinutes(meta.wordCount)} ${ct(
                        "min read"
                     )}`}
                  </p>
                  <RenderMDX {...source} />
                  <p className="mt-8 text-right opacity-60">
                     {`"${meta.title}", ${postDate.toLocaleString(locale)}`}
                  </p>
                  <p className="text-right opacity-80">
                     {meta.tags.map((tag, i) => (
                        <span key={tag}>
                           <LinkText href={`/posts/${tag}`}>{`#${tag}`}</LinkText>
                           {i !== meta.tags.length - 1 && `, `}
                        </span>
                     ))}
                  </p>
               </Section>
            </div>
            <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
         </Main>
         <Footer />
      </PageContainer>
   )
}

export const getStaticProps: GetStaticProps = async (ctx) => {
   const { locale = DEFAULT_LOCALE, params } = ctx
   const { slug } = params as { slug: string }
   const { content: stringContent, meta } = getPostFromSlug(slug)
   const mdxSource = await serializeWithAppOptions(stringContent)

   return {
      props: {
         ...(await serverSideTranslations(locale, [
            PAGES_TNS,
            GLOSSARY_TNS,
            COMMON_TNS,
         ])),
         // Will be passed to the page component as props
         post: { source: mdxSource, meta },
      },
   }
}

export const getStaticPaths: GetStaticPaths = async ({
   locales = [DEFAULT_LOCALE],
}) => {
   const slugs = getSlugs()

   const paths = slugs
      .map((slug) =>
         locales.map((locale) => ({
            params: { slug },
            locale,
         }))
      )
      .flat()

   return {
      paths,
      fallback: false, // do not try generate if it doesn't exist
   }
}

export default PostPage
