const DEV_ARTICLES_URL = "https://dev.to/api/articles?tag=discuss&top=30&per_page=30"
const DEV_ARTICLE_URL = "https://dev.to/api/articles"
const DEV_ACCEPT = "application/vnd.forem.api-v1+json"
const MIN_EXCERPT_LENGTH = 220
const MAX_EXCERPT_LENGTH = 1200
const MAX_ARTICLE_ATTEMPTS = 3

type DevArticleSummary = {
   id?: unknown
}

type DevArticle = {
   body_html?: unknown
}

const normaliseParagraph = (text: string) => text.replace(/\s+/g, " ").trim()

const isReadableEnglishProse = (text: string) => {
   if (text.length < 55 || text.split(/\s+/).length < 10) return false

   const letters = Array.from(text).filter(
      (character) => character.toLowerCase() !== character.toUpperCase()
   )
   const englishLetters = text.match(/[A-Za-z]/g) ?? []
   if (!letters.length || englishLetters.length / letters.length < 0.9) return false

   return !/^(?:image (?:credit|description)|photo by|subscribe|follow me|thanks for reading)\b/i.test(
      text
   )
}

const trimAtSentence = (text: string, maximumLength: number) => {
   if (text.length <= maximumLength) return text

   const candidate = text.slice(0, maximumLength + 1)
   const sentenceEnd = Math.max(
      candidate.lastIndexOf(". "),
      candidate.lastIndexOf("? "),
      candidate.lastIndexOf("! ")
   )

   return (
      sentenceEnd >= MIN_EXCERPT_LENGTH
         ? candidate.slice(0, sentenceEnd + 1)
         : candidate.slice(0, maximumLength)
   ).trim()
}

export const extractReadableDevText = (html: string) => {
   const document = new DOMParser().parseFromString(html, "text/html")
   document
      .querySelectorAll(
         "pre, code, figure, picture, img, iframe, video, table, script, style"
      )
      .forEach((element) => element.remove())

   const paragraphs = Array.from(document.querySelectorAll("p"))
      .map((paragraph) => normaliseParagraph(paragraph.textContent ?? ""))
      .filter(isReadableEnglishProse)

   let excerpt = ""
   for (const paragraph of paragraphs) {
      const nextExcerpt = excerpt ? `${excerpt}\n\n${paragraph}` : paragraph
      if (nextExcerpt.length > MAX_EXCERPT_LENGTH) {
         if (excerpt.length >= MIN_EXCERPT_LENGTH) break
         excerpt = trimAtSentence(nextExcerpt, MAX_EXCERPT_LENGTH)
         break
      }

      excerpt = nextExcerpt
      if (excerpt.length >= 700) break
   }

   if (excerpt.length < MIN_EXCERPT_LENGTH) throw new Error()
   return excerpt
}

const fetchJson = async <Response>(url: string, signal: AbortSignal) => {
   const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: DEV_ACCEPT },
      signal,
   })
   if (!response.ok) throw new Error()
   return (await response.json()) as Response
}

export const fetchRandomText = async (signal: AbortSignal) => {
   const articles = await fetchJson<DevArticleSummary[]>(DEV_ARTICLES_URL, signal)
   const articleIds = articles
      .map((article) => article.id)
      .filter((id): id is number => typeof id === "number")
   if (!articleIds.length) throw new Error()

   const startIndex = Math.floor(Math.random() * articleIds.length)
   const candidates = articleIds
      .slice(startIndex)
      .concat(articleIds.slice(0, startIndex))
      .slice(0, MAX_ARTICLE_ATTEMPTS)

   for (const id of candidates) {
      try {
         const article = await fetchJson<DevArticle>(
            `${DEV_ARTICLE_URL}/${id}`,
            signal
         )
         if (typeof article.body_html !== "string") continue
         return extractReadableDevText(article.body_html)
      } catch (error) {
         if (signal.aborted) throw error
      }
   }

   throw new Error()
}
