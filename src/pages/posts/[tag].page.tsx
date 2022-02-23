import Main from "@/components/atomic/Main/Main";
import PageContainer from "@/components/atomic/PageContainer/PageContainer";
import Section from "@/components/atomic/Section/Section";
import Footer from "@/components/organism/Footer/Footer";
import Header from "@/components/organism/Header/Header";
import PostList from "@/components/organism/PostList/PostList";
import { getAllPosts, PostMeta } from "@/lib/api/blog";
import { PAGES_TNS, GLOSSARY_TNS, COMMON_TNS } from "@/lib/i18n/consts";
import { DEFAULT_LOCALE } from "@/lib/utils/consts";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { Trans, useTranslation } from "react-i18next";

export const TagPage: NextPage<{ postMetas: PostMeta[]; tag: string }> = (
  props,
) => {
  const { postMetas, tag } = props;
  const { t } = useTranslation([PAGES_TNS], { keyPrefix: "posts.[tag]" });

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
            <Trans t={t} i18nKey="heading">
              Posts
            </Trans>
          </h1>
          <h2 className="mt-0 uppercase-first h2">
            <Trans t={t} i18nKey="with tag">
              With tag
            </Trans>
            {`: #${tag}`}
          </h2>
          <PostList postMetas={postMetas} />
        </Section>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
      </Main>
      <Footer />
    </PageContainer>
  );
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { params, locale = DEFAULT_LOCALE } = ctx;
  const { tag } = params as { tag: string };

  const postMetas = getAllPosts()
    .filter((post) => post.meta.tags.includes(tag))
    .map((post) => post.meta);

  return {
    props: {
      ...(await serverSideTranslations(locale, [
        PAGES_TNS,
        GLOSSARY_TNS,
        COMMON_TNS,
      ])),
      postMetas,
      tag,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({
  locales = [DEFAULT_LOCALE],
}) => {
  const posts = getAllPosts();
  const tags = new Set(posts.map((post) => post.meta.tags).flat());
  const paths = Array.from(tags)
    .map((tag) =>
      locales.map((locale) => ({
        params: { tag },
        locale,
      })),
    )
    .flat();

  return {
    paths,
    fallback: false,
  };
};

export default TagPage;
