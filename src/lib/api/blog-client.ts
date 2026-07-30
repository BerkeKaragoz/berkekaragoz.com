import { serialize } from "next-mdx-remote/serialize"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { getWordCount } from "../utils"
import { PostMeta } from "./blog"

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
   slug: string
): PostMeta => ({
   slug,
   excerpt: data.excerpt,
   title: data.title ?? slug,
   tags: data.tags ? data.tags.sort() : [],
   date: (data.date ?? new Date()).toString(),
   wordCount: getWordCount(contentString),
   coverSrc: getPostCoverSrc(contentString),
   coverBlurDataURL: getPostBlurDataURL(contentString),
})

export const serializeWithAppOptions = (stringContent: string) =>
   serialize(stringContent, {
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
         ],
      },
   })
