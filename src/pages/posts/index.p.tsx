import Main from "@/components/atomic/Main/Main";
import PageContainer from "@/components/atomic/PageContainer/PageContainer";
import Section from "@/components/atomic/Section/Section";
import Footer from "@/components/organism/Footer/Footer";
import Header from "@/components/organism/Header/Header";
import PostList from "@/components/organism/PostList/PostList";
import { getAllPosts, PostMeta } from "@/lib/api/blog";
import { COMMON_TNS, GLOSSARY_TNS, PAGES_TNS } from "@/lib/i18n/consts";
import { DEFAULT_LOCALE } from "@/lib/utils/consts";
import { GetStaticProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import React from "react";

//TODO pass locale to date parsing
//TODO empty state
export const PostsPage: NextPage<{ postMetas: PostMeta[] }> = (props) => {
  const { postMetas } = props;

  return (
    <PageContainer>
      <Head>
        <title>E. Berke Karagöz | Posts</title>
      </Head>
      <Header />
      <Main>
        <div className="h-16 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
        <Section as="article" className="py-16" block>
          <h1 className="mt-0 h1">Posts</h1>
          <PostList postMetas={postMetas} />
        </Section>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
      </Main>
      <Footer />
    </PageContainer>
  );
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const { locale = DEFAULT_LOCALE } = ctx;
  const postMetas = getAllPosts().map((post) => post.meta);

  return {
    props: {
      ...(await serverSideTranslations(locale, [
        PAGES_TNS,
        GLOSSARY_TNS,
        COMMON_TNS,
      ])),
      // Will be passed to the page component as props
      postMetas,
    },
  };
};

export default PostsPage;
