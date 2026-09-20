import { serialize } from "next-mdx-remote/serialize"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { getWordCount } from "../utils"
import { PostMeta, PostPageMeta, TocItem } from "./blog-common"

export type { TocItem }

export const getPostCoverSrc = (contentString: string) => {
   const regex = /<(?:Image|img)\s+[^>]*src=['"]([^'"]+)['"][^>]*>/i
   const match = contentString.match(regex)
   return match ? match[1] : null
}

export const getPostBlurDataURL = (contentString: string) => {
   const regex = /<(?:Image|img)\s+[^>]*blurDataURL=['"]([^'"]+)['"][^>]*>/i
   const match = contentString.match(regex)
   return match ? match[1] : null
}

export const getPostMeta = (
   contentString: string,
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   data: Record<string, any>,
   slug: string,
   pages: PostPageMeta[] = []
): PostMeta => ({
   slug,
   excerpt: data.excerpt,
   title: data.title ?? slug,
   tags: data.tags ? data.tags.sort() : [],
   date: (data.date ?? new Date()).toString(),
   wordCount: pages.length
      ? pages.reduce((count, page) => count + page.wordCount, 0)
      : getWordCount(contentString),
   coverSrc: getPostCoverSrc(contentString),
   coverBlurDataURL: getPostBlurDataURL(contentString),
   pages,
})

/* eslint-disable @typescript-eslint/no-explicit-any */
const getNodeText = (node: any): string => {
   if (node.type === "text") return node.value ?? ""
   if (!Array.isArray(node.children)) return ""
   return node.children.map(getNodeText).join("")
}

/**
 * Collects h2 and h3 into `toc` during the existing rehype pass.
 * Runs after rehype-slug, so ids are the assigned ones, not re-derived.
 */
const rehypeCollectToc = (toc: TocItem[]) => () => (tree: any) => {
   const walk = (node: any) => {
      if (node.type === "element" && /^h[23]$/.test(node.tagName)) {
         const id = node.properties?.id
         const text = getNodeText(node).trim()

         if (typeof id === "string" && text) {
            toc.push({ id, text, depth: Number(node.tagName[1]) as 2 | 3 })
         }

         return // headings do not nest
      }

      if (Array.isArray(node.children)) node.children.forEach(walk)
   }

   walk(tree)
}
/* eslint-enable @typescript-eslint/no-explicit-any */

type SerializeOptions = NonNullable<Parameters<typeof serialize>[1]>

const getSerializeOptions = (toc?: TocItem[]): SerializeOptions => ({
   // Posts are trusted, repository-owned MDX and use JSX expressions for
   // component props. Keep v6's dangerous-global protection enabled.
   blockJS: false,
   blockDangerousJS: true,
   mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
         rehypeSlug,
         [rehypeAutolinkHeadings, { behavior: "wrap" }],
         rehypeHighlight,
         rehypeAccessibleEmojis,
         ...(toc ? [rehypeCollectToc(toc)] : []),
      ],
   },
})

export const serializeWithAppOptions = (stringContent: string) =>
   serialize(stringContent, getSerializeOptions())

export const serializeWithToc = async (stringContent: string) => {
   const toc: TocItem[] = []
   const source = await serialize(stringContent, getSerializeOptions(toc))

   return { source, toc }
}
