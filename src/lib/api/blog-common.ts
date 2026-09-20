// Shapes and values shared by the browser and the build.
// blog.ts pulls in fs and glob. A value a component imports at runtime lives here.

/** The first page of a post. Lives in `<slug>.mdx` or `<slug>/index.mdx`. */
export const INDEX_PAGE_SLUG = "index"

export interface PostPageMeta {
   /** `index` for the first page, otherwise the file name under the post dir */
   slug: string
   title: string
   /** Sidebar group heading, `null` when the page stands on its own */
   group: string | null
   wordCount: number
}

export interface PostMeta {
   excerpt: string | null
   slug: string
   title: string
   tags: string[]
   date: string
   wordCount: number
   coverSrc: string | null
   coverBlurDataURL: string | null
   /** Empty for single file posts, otherwise every page in reading order */
   pages: PostPageMeta[]
}

export interface TocItem {
   id: string
   text: string
   depth: 2 | 3
}

export const getPostPageHref = (slug: string, pageSlug: string) =>
   pageSlug === INDEX_PAGE_SLUG ? `/p/${slug}` : `/p/${slug}/${pageSlug}`
