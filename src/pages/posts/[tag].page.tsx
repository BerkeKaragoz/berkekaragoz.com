import Main from "@/components/atomic/Main/Main";
import PageContainer from "@/components/atomic/PageContainer/PageContainer";
import Section from "@/components/atomic/Section/Section";
import Footer from "@/components/organism/Footer/Footer";
import Header from "@/components/organism/Header/Header";
import PostList from "@/components/organism/PostList/PostList";
import { getAllPosts, PostMeta } from "@/lib/api/blog";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

export const TagPage: NextPage<{ postMetas: PostMeta[]; tag: string }> = (
  props,
) => {
  const { postMetas, tag } = props;

  return (
    <PageContainer>
      <Head>
        <title>#{tag} Posts | E. Berke Karagöz</title>
      </Head>
      <Header />
      <Main>
        <div className="h-16 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
        <Section block className="py-16">
          <h1 className="mt-0 h1">Posts</h1>
          <h2 className="mt-0 h2">With tag: {tag}</h2>
          <PostList postMetas={postMetas} />
        </Section>
        <div className="h-24 bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20" />
      </Main>
      <Footer />
    </PageContainer>
  );
};

export const getStaticProps: GetStaticProps = async (props) => {
  const { params } = props;
  const { tag } = params as { tag: string };

  const postMetas = getAllPosts()
    .filter((post) => post.meta.tags.includes(tag))
    .map((post) => post.meta);

  return {
    props: {
      postMetas,
      tag,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts();
  const tags = new Set(posts.map((post) => post.meta.tags).flat());
  const paths = Array.from(tags).map((tag) => ({ params: { tag } }));

  return {
    paths,
    fallback: false,
  };
};

export default TagPage;
