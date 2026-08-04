const MIN_PASSAGE_LENGTH = 240
const MAX_PASSAGE_LENGTH = 1200
export const GUTENBERG_RANGE_SIZE = 96 * 1024

export type GutendexBook = {
   id: number
   title: string
}

const normaliseParagraph = (text: string) =>
   text.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim()

const isReadableProse = (text: string) => {
   if (
      text.length < MIN_PASSAGE_LENGTH ||
      text.length > 1800 ||
      text.split(/\s+/).length < 40
   )
      return false

   const letters = Array.from(text).filter(
      (character) => character.toLowerCase() !== character.toUpperCase()
   )
   const englishLetters = text.match(/[A-Za-z]/g) ?? []
   const sentenceMarks = text.match(/[.!?]/g) ?? []

   return (
      letters.length > 0 &&
      englishLetters.length / letters.length >= 0.9 &&
      sentenceMarks.length >= 2 &&
      /[a-z]/.test(text) &&
      !/^(?:chapter|book|part|contents|project gutenberg|transcriber|copyright)\b/i.test(
         text
      )
   )
}

const trimAtSentence = (text: string) => {
   if (text.length <= MAX_PASSAGE_LENGTH) return text

   const candidate = text.slice(0, MAX_PASSAGE_LENGTH + 1)
   const sentenceEnd = Math.max(
      candidate.lastIndexOf(". "),
      candidate.lastIndexOf("? "),
      candidate.lastIndexOf("! ")
   )

   return (
      sentenceEnd >= MIN_PASSAGE_LENGTH
         ? candidate.slice(0, sentenceEnd + 1)
         : candidate.slice(0, MAX_PASSAGE_LENGTH)
   ).trim()
}

export const extractGutenbergPassage = (source: string, random = Math.random) => {
   const paragraphs = source
      .split(/(?:\r?\n){2,}/)
      .slice(1, -1)
      .map(normaliseParagraph)
      .filter(isReadableProse)
   if (!paragraphs.length) throw new Error()

   const index = Math.min(
      paragraphs.length - 1,
      Math.floor(Math.max(0, random()) * paragraphs.length)
   )
   return trimAtSentence(paragraphs[index])
}

export const calculateGutenbergRange = (
   contentLength: number,
   random = Math.random
) => {
   if (!Number.isFinite(contentLength) || contentLength < MIN_PASSAGE_LENGTH)
      throw new Error()

   const position = 0.15 + Math.min(1, Math.max(0, random())) * 0.55
   const start = Math.min(contentLength - 1, Math.floor(contentLength * position))
   const end = Math.min(contentLength - 1, start + GUTENBERG_RANGE_SIZE - 1)

   return { end, start }
}

export const parseGutendexBooks = (value: unknown): GutendexBook[] => {
   if (!value || typeof value !== "object") return []
   const results = (value as { results?: unknown }).results
   if (!Array.isArray(results)) return []

   return results.flatMap((book) => {
      if (!book || typeof book !== "object") return []
      const { id, title } = book as { id?: unknown; title?: unknown }
      return typeof id === "number" && typeof title === "string"
         ? [{ id, title }]
         : []
   })
}

export const rotateBooks = (books: GutendexBook[], random = Math.random) => {
   if (!books.length) return []
   const start = Math.min(
      books.length - 1,
      Math.floor(Math.max(0, random()) * books.length)
   )
   return books.slice(start).concat(books.slice(0, start))
}
