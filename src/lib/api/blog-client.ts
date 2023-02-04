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
