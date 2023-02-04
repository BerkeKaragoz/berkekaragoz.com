import path from "path"
import { readFileSync } from "fs"
import { sync } from "glob"
import matter from "gray-matter"
import { getWordCount } from "../utils"
import { getPostMeta } from "./blog-client"

/**
 * I might put this as an actual API later on
 */

const POSTS_PATH = path.join(process.cwd(), "posts")

export const getSlugs = (): string[] => {
   const paths = sync(`${POSTS_PATH}/*.mdx`)

   return paths.map((path) => {
      const parts = path.split("/")
      const fileName = parts[parts.length - 1]
      // const [slug, _ext] = fileName.split(".")
      const [slug] = fileName.split(".")
      return slug
   })
}

export interface PostMeta {
   excerpt?: string
   slug: string
   title: string
   tags: string[]
   date: string
   wordCount: number
}

export interface Post {
   content: string
   meta: PostMeta
}

export const getPostFromSlug = (slug: string): Post => {
   const postPath = path.join(POSTS_PATH, `${slug}.mdx`)
   const source = readFileSync(postPath)

   const matterFile = matter(source)

   return {
      content: matterFile.content,
      meta: getPostMeta(matterFile.content, matterFile.data, slug),
   }
}

export const getAllPosts = () => {
   const posts = getSlugs().map((slug) => getPostFromSlug(slug))

   const sorted = posts.sort((a, b) =>
      new Date(a.meta.date) < new Date(b.meta.date) ? 1 : -1
   )

   return sorted
}
