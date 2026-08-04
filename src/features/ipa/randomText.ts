const GUTENBERG_EXCERPTS_URL = "/data/ipa/gutenberg-excerpts.json"

export type GutenbergExcerpt = {
   gutenbergId: number
   title: string
   text: string
}

const isExcerpt = (value: unknown): value is GutenbergExcerpt => {
   if (!value || typeof value !== "object") return false

   const excerpt = value as Partial<GutenbergExcerpt>
   return (
      typeof excerpt.gutenbergId === "number" &&
      typeof excerpt.title === "string" &&
      typeof excerpt.text === "string" &&
      excerpt.text.trim().length >= 200
   )
}

export const selectRandomExcerpt = (
   values: unknown,
   excludedText = "",
   random = Math.random
) => {
   if (!Array.isArray(values)) throw new Error()

   const excerpts = values.filter(isExcerpt)
   if (!excerpts.length) throw new Error()

   const alternatives = excerpts.filter(
      (excerpt) => excerpt.text.trim() !== excludedText.trim()
   )
   const candidates = alternatives.length ? alternatives : excerpts
   const randomIndex = Math.min(
      candidates.length - 1,
      Math.floor(Math.max(0, random()) * candidates.length)
   )

   return candidates[randomIndex].text.trim()
}

export const fetchRandomText = async (signal: AbortSignal, excludedText = "") => {
   const response = await fetch(GUTENBERG_EXCERPTS_URL, { signal })
   if (!response.ok) throw new Error()

   return selectRandomExcerpt(await response.json(), excludedText)
}
