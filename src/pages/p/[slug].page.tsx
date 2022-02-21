import { getPostFromSlug, getSlugs, PostMeta } from "@/lib/api/blog";
import Main from "@/components/atomic/Main/Main";
import PageContainer from "@/components/atomic/PageContainer/PageContainer";
import Section from "@/components/atomic/Section/Section";
import Footer from "@/components/organism/Footer/Footer";
import Header from "@/components/organism/Header/Header";
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts";
import "highlight.js/styles/atom-one-dark.css";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Head from "next/head";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis";
import { AppMDXComponents } from "@/lib/utils/mdx";
import LinkText from "@/components/atomic/LinkText/LinkText";

interface MDXPost {
  source: MDXRemoteSerializeResult<Record<string, unknown>>;
  meta: PostMeta;
}

export const PostPage: NextPage<{ post: MDXPost }> = (props) => {
  const { post } = props;
  const { source, meta } = post;
  const postDate = new Date(meta.date);

  return (
    <PageContainer>
      <Head>
        <title>{meta.title} | E. Berke Karagöz</title>
      </Head>
      <Header />
      <Main>
        <div className="h-16 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
        <Section as="article" block prose className="py-8 sm:py-16 sm:text-lg">
          <h1 className="my-0 h1">{meta.title}</h1>
          <p className="mb-6 text-right opacity-60">
            {`on ${postDate.toLocaleDateString()}`}
          </p>
          <MDXRemote {...source} components={AppMDXComponents} />
          <p className="mt-8 text-right opacity-60">
            {`"${meta.title}" on ${postDate.toLocaleString()}`}
          </p>
          <p className="text-right opacity-80">
            {meta.tags.map((tag, i) => (
              <>
                <LinkText key={tag} href={`/posts/${tag}`}>
                  {`#${tag}`}
                </LinkText>
                {i !== meta.tags.length - 1 && `, `}
              </>
            ))}
          </p>
        </Section>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
      </Main>
      <Footer />
    </PageContainer>
  );
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { locale = "en", params } = ctx;
  const { slug } = params as { slug: string };
  const { content: stringContent, meta } = getPostFromSlug(slug);
  const mdxSource = await serialize(stringContent, {
    mdxOptions: {
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
        rehypeHighlight,
        rehypeAccessibleEmojis,
      ],
    },
  });

  return {
    props: {
      ...(await serverSideTranslations(locale || "en", [
        PAGES_TNS,
        GLOSSARY_TNS,
        COMMON_TNS,
      ])),
      // Will be passed to the page component as props
      post: { source: mdxSource, meta },
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const slugs = getSlugs();

  const paths = slugs
    .map((slug) =>
      (locales || ["en"]).map((locale) => ({
        params: { slug },
        locale,
      })),
    )
    .flat();

  return {
    paths,
    fallback: false, // do not try generate if it doesn't exist
  };
};

export default PostPage;
