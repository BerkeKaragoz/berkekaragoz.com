import path from "path";
import fs from "fs";
import { sync } from "glob";
import matter from "gray-matter";

const POSTS_PATH = path.join(process.cwd(), "posts");

export const getSlugs = (): string[] => {
  const paths = sync(`${POSTS_PATH}/*.mdx`);

  return paths.map((path) => {
    const parts = path.split("/");
    const fileName = parts[parts.length - 1];
    const [slug, _ext] = fileName.split(".");
    return slug;
  });
};

export interface PostMeta {
  excerpt?: string;
  slug: string;
  title: string;
  tags: string[];
  date: string;
}

export interface Post {
  content: string;
  meta: PostMeta;
}

export const getPostFromSlug = (slug: string): Post => {
  const postPath = path.join(POSTS_PATH, `${slug}.mdx`);
  const source = fs.readFileSync(postPath);

  const { content, data } = matter(source);

  return {
    content,
    meta: {
      slug,
      excerpt: data.excerpt,
      title: data.title ?? slug,
      tags: data.tags ? data.tags.sort() : [],
      date: (data.date ?? new Date()).toString(),
    },
  };
};

export const getAllPosts = () => {
  const posts = getSlugs().map((slug) => getPostFromSlug(slug));

  const sorted = posts.sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));

  return sorted;
};
