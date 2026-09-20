import path from "path"
import { existsSync, readFileSync } from "fs"
import { sync } from "glob"
import matter from "gray-matter"
import { getPostBlurDataURL, getPostCoverSrc, getPostMeta } from "./blog-client"
import { INDEX_PAGE_SLUG, PostMeta, PostPageMeta } from "./blog-common"

export * from "./blog-common"

/**
 * I might put this as an actual API later on
 */

const POSTS_PATH = path.join(process.cwd(), "posts")
// glob treats a backslash as an escape. Patterns stay posix.
const POSTS_GLOB_ROOT = POSTS_PATH.split(path.sep).join("/")

export interface Post {
   content: string
   meta: PostMeta
}

export interface PostPage extends Post {
   /** `null` for single file posts */
   page: PostPageMeta | null
}

let slugs: string[] | null = null
let posts: Post[] | null = null

const matterCache = new Map<string, matter.GrayMatterFile<string> | null>()

const getPageFilePaths = (slug: string, pageSlug: string) =>
   pageSlug === INDEX_PAGE_SLUG
      ? [
           path.join(POSTS_PATH, `${slug}.mdx`),
           path.join(POSTS_PATH, slug, "index.mdx"),
        ]
      : [path.join(POSTS_PATH, slug, `${pageSlug}.mdx`)]

const readPostMatter = (slug: string, pageSlug: string) => {
   const cacheKey = `${slug}/${pageSlug}`
   const cached = matterCache.get(cacheKey)
   if (cached !== undefined) return cached

   const filePath = getPageFilePaths(slug, pageSlug).find((el) => existsSync(el))
   const file = filePath ? matter(readFileSync(filePath, "utf-8")) : null

   matterCache.set(cacheKey, file)

   return file
}

export const getSlugs = (): string[] => {
   if (slugs !== null) return slugs

   const filePosts = sync(`${POSTS_GLOB_ROOT}/*.mdx`).map((el) =>
      path.basename(el, ".mdx")
   )
   const dirPosts = sync(`${POSTS_GLOB_ROOT}/*/index.mdx`).map((el) =>
      path.basename(path.dirname(el))
   )

   slugs = [...filePosts, ...dirPosts]

   return slugs
}

/**
 * A nav entry is a page slug, or a `{ group: [...pageSlugs] }` map.
 *
 * nav:
 *    - installation
 *    - Going further:
 *         - queries
 */
const parseNav = (nav: unknown): Pick<PostPageMeta, "slug" | "group">[] => {
   if (!Array.isArray(nav)) return []

   return nav.flatMap((entry): Pick<PostPageMeta, "slug" | "group">[] => {
      if (typeof entry === "string") return [{ slug: entry, group: null }]
      if (!entry || typeof entry !== "object") return []

      return Object.entries(entry as Record<string, unknown>).flatMap(
         ([group, pageSlugs]) =>
            Array.isArray(pageSlugs)
               ? pageSlugs
                    .filter((el): el is string => typeof el === "string")
                    .map((el) => ({ slug: el, group }))
               : []
      )
   })
}

const getPostPages = (
   slug: string,
   indexFile: matter.GrayMatterFile<string>
): PostPageMeta[] => {
   const entries = parseNav(indexFile.data.nav)

   if (entries.length === 0) return []

   const withIndex = entries.some((el) => el.slug === INDEX_PAGE_SLUG)
      ? entries
      : [{ slug: INDEX_PAGE_SLUG, group: null }, ...entries]

   return withIndex.flatMap(({ slug: pageSlug, group }) => {
      const file =
         pageSlug === INDEX_PAGE_SLUG ? indexFile : readPostMatter(slug, pageSlug)

      if (file === null) {
         throw new Error(
            `The post "${slug}" lists "${pageSlug}" in its nav, but posts/${slug}/${pageSlug}.mdx does not exist.`
         )
      }

      const meta = getPostMeta(file.content, file.data, pageSlug)

      return [
         {
            slug: pageSlug,
            // The index page has no page title of its own.
            title: (file.data.pageTitle as string) ?? meta.title,
            group,
            wordCount: meta.wordCount,
         },
      ]
   })
}

export const getPostFromSlug = (slug: string): Post => {
   const indexFile = readPostMatter(slug, INDEX_PAGE_SLUG)

   if (indexFile === null) throw new Error(`No post found for the slug "${slug}".`)

   const pages = getPostPages(slug, indexFile)
   const meta = getPostMeta(indexFile.content, indexFile.data, slug, pages)

   // A cover may sit on any page, not only the index.
   if (meta.coverSrc === null) {
      for (const page of pages) {
         const file = readPostMatter(slug, page.slug)
         const coverSrc = file && getPostCoverSrc(file.content)

         if (coverSrc) {
            meta.coverSrc = coverSrc
            meta.coverBlurDataURL = getPostBlurDataURL(file.content)
            break
         }
      }
   }

   return { content: indexFile.content, meta }
}

export const getPostPage = (
   slug: string,
   pageSlug: string = INDEX_PAGE_SLUG
): PostPage => {
   const post = getPostFromSlug(slug)
   const page = post.meta.pages.find((el) => el.slug === pageSlug) ?? null

   if (pageSlug === INDEX_PAGE_SLUG) return { ...post, page }

   const file = readPostMatter(slug, pageSlug)

   if (file === null) {
      throw new Error(`No page "${pageSlug}" found for the post "${slug}".`)
   }

   return { content: file.content, meta: post.meta, page }
}

export const getAllPosts = () => {
   if (posts !== null) return posts

   const unsortedPosts = getSlugs().map((slug) => getPostFromSlug(slug))

   const sorted = unsortedPosts.sort((a, b) =>
      new Date(a.meta.date) < new Date(b.meta.date) ? 1 : -1
   )

   posts = sorted

   return posts
}

/** Every `/p/[...slug]` param, one entry per page of every post */
export const getPostPathSlugs = (): string[][] =>
   getAllPosts().flatMap((post) =>
      post.meta.pages.length
         ? post.meta.pages.map((page) =>
              page.slug === INDEX_PAGE_SLUG
                 ? [post.meta.slug]
                 : [post.meta.slug, page.slug]
           )
         : [[post.meta.slug]]
   )
