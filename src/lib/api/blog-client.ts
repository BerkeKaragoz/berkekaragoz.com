import { serialize } from "next-mdx-remote/serialize"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeHighlight from "rehype-highlight"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import { getWordCount } from "../utils"

export const getPostMeta = (
   contentString: string,
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   data: Record<string, any>,
   slug: string
) => ({
   slug,
   excerpt: data.excerpt,
   title: data.title ?? slug,
   tags: data.tags ? data.tags.sort() : [],
   date: (data.date ?? new Date()).toString(),
   wordCount: getWordCount(contentString),
})

export const serializeWithAppOptions = (stringContent: string) =>
   serialize(stringContent, {
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
