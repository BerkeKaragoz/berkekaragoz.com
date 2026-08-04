const MIN_PASSAGE_LENGTH = 240
const MAX_PASSAGE_LENGTH = 1200

export type WikipediaCandidate = {
   categories: string[]
   extract: string
   pageid: number
   title: string
}

const BIOGRAPHY_CATEGORY =
   /(?:births|deaths|living people|people from|alumni|politicians|footballers|cricketers|athletes|actors|actresses|singers|musicians|composers|writers|novelists|poets|artists|painters|directors|businesspeople|military personnel|royalty|nobility)/i
const MEMORISATION_CATEGORY =
   /(?:albums|battles|competitions|elections|films|football|basketball|cricket|military operations|municipalities|populated places|schools|seasons|ships|songs|sports|television episodes|towns|villages)/i
const INTERESTING_CATEGORY =
   /(?:animal|architecture|astronomy|biology|chemistry|communication|concepts|culture|design|devices|ecology|engineering|food|geology|inventions|language|linguistics|materials|mathematics|methods|natural|neuroscience|phenomena|philosophy|physics|psychology|science|systems|techniques|technology|tools|weather)/i
const INTERESTING_TEXT =
   /\b(?:behavio(?:u)?r|cause|design|effect|function|mechanism|phenomenon|process|structure|technique|technology|use)\b/gi
const EXCLUDED_TITLE = /^(?:index|list|outline|timeline|glossary) of\b|^\d{3,4}$/i
const BIOGRAPHY_INTRO =
   /\b(?:born|birth name)\b|\b(?:is|was) an? [^.]{0,80}\b(?:actor|athlete|composer|director|footballer|musician|politician|singer|writer)\b/i
const MEMORISATION_INTRO =
   /\b(?:is|was) an? [^.]{0,90}\b(?:album|battle|city|election|film|municipality|school|season|ship|song|sports team|television series|town|village)\b/i
const EXCLUDED_HEADING =
   /^(?:awards?|bibliography|career|citations?|discography|early life|external links?|filmography|further reading|history|legacy|notes?|personal life|publications?|reception|references?|see also|sources?|works?)$/i
const INTERESTING_HEADING =
   /\b(?:applications?|behavio(?:u)?r|causes?|characteristics?|culture|design|effects?|features?|function|mechanism|operation|practice|process|science|structure|technology|uses?)\b/i

const normaliseText = (text: string) =>
   text
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\s+/g, " ")
      .trim()

const isEnglishProse = (text: string, minimumWords = 24) => {
   const words = text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) ?? []
   const allLetters = Array.from(text).filter(
      (character) => character.toLowerCase() !== character.toUpperCase()
   )
   const asciiLetters = text.match(/[A-Za-z]/g) ?? []
   const numbers = text.match(/\b\d+(?:[.,]\d+)?\b/g) ?? []

   return (
      text.length >= 110 &&
      words.length >= minimumWords &&
      allLetters.length > 0 &&
      asciiLetters.length / allLetters.length >= 0.9 &&
      numbers.length / words.length <= 0.06 &&
      /[.!?]/.test(text)
   )
}

export const parseWikipediaCandidates = (value: unknown): WikipediaCandidate[] => {
   if (!value || typeof value !== "object") return []
   const query = (value as { query?: unknown }).query
   if (!query || typeof query !== "object") return []
   const pages = (query as { pages?: unknown }).pages
   if (!Array.isArray(pages)) return []

   return pages.flatMap((page) => {
      if (!page || typeof page !== "object") return []
      const candidate = page as {
         categories?: unknown
         extract?: unknown
         pageid?: unknown
         pageprops?: unknown
         title?: unknown
      }
      if (
         typeof candidate.pageid !== "number" ||
         typeof candidate.title !== "string" ||
         typeof candidate.extract !== "string" ||
         (candidate.pageprops &&
            typeof candidate.pageprops === "object" &&
            "disambiguation" in candidate.pageprops)
      )
         return []

      const categories = Array.isArray(candidate.categories)
         ? candidate.categories.flatMap((category) => {
              if (!category || typeof category !== "object") return []
              const title = (category as { title?: unknown }).title
              return typeof title === "string"
                 ? [title.replace(/^Category:/, "")]
                 : []
           })
         : []

      if (
         EXCLUDED_TITLE.test(candidate.title) ||
         BIOGRAPHY_INTRO.test(candidate.extract) ||
         MEMORISATION_INTRO.test(candidate.extract) ||
         categories.some((category) => BIOGRAPHY_CATEGORY.test(category)) ||
         categories.some((category) => MEMORISATION_CATEGORY.test(category)) ||
         !isEnglishProse(candidate.extract)
      )
         return []

      return [
         {
            categories,
            extract: candidate.extract,
            pageid: candidate.pageid,
            title: candidate.title,
         },
      ]
   })
}

const candidateScore = (candidate: WikipediaCandidate) => {
   const interestingCategories = candidate.categories.filter((category) =>
      INTERESTING_CATEGORY.test(category)
   ).length
   const interestingWords = candidate.extract.match(INTERESTING_TEXT)?.length ?? 0
   return interestingCategories * 3 + Math.min(interestingWords, 4)
}

export const rankWikipediaCandidates = (
   candidates: WikipediaCandidate[],
   random = Math.random
) =>
   candidates
      .map((candidate) => ({
         candidate,
         rank: candidateScore(candidate) + Math.max(0, random()) * 3,
      }))
      .sort((left, right) => right.rank - left.rank)
      .map(({ candidate }) => candidate)

type ArticleSection = {
   heading: string
   paragraphs: string[]
}

const articleHtml = (value: unknown) => {
   if (!value || typeof value !== "object") return null
   const parse = (value as { parse?: unknown }).parse
   if (!parse || typeof parse !== "object") return null
   const text = (parse as { text?: unknown }).text
   return typeof text === "string" ? text : null
}

const sectionsFromHtml = (html: string) => {
   const document = new DOMParser().parseFromString(html, "text/html")
   const root = document.querySelector(".mw-parser-output") ?? document.body
   const sections: ArticleSection[] = []
   let section: ArticleSection | null = null

   root.querySelectorAll("h2, h3, p").forEach((element) => {
      if (element.matches("h2, h3")) {
         const heading = normaliseText(element.textContent ?? "")
            .replace(/\[edit\]$/i, "")
            .trim()
         section = EXCLUDED_HEADING.test(heading)
            ? null
            : { heading, paragraphs: [] }
         if (section) sections.push(section)
         return
      }

      if (
         !section ||
         element.closest("table, figure, blockquote, .navbox, .sidebar")
      )
         return

      element.querySelectorAll("sup, style").forEach((node) => node.remove())
      const paragraph = normaliseText(element.textContent ?? "")
      if (isEnglishProse(paragraph)) section.paragraphs.push(paragraph)
   })

   return sections.filter((item) => item.paragraphs.length)
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

const passageFromSection = (section: ArticleSection, random = Math.random) => {
   const starts = section.paragraphs.map((_, index) => index)
   const offset = starts.length
      ? Math.min(
           starts.length - 1,
           Math.floor(Math.max(0, random()) * starts.length)
        )
      : 0
   const orderedStarts = starts.slice(offset).concat(starts.slice(0, offset))

   for (const start of orderedStarts) {
      let passage = ""
      for (const paragraph of section.paragraphs.slice(start, start + 3)) {
         passage = passage ? `${passage} ${paragraph}` : paragraph
         if (passage.length >= MIN_PASSAGE_LENGTH) {
            const trimmed = trimAtSentence(passage)
            if (isEnglishProse(trimmed, 40)) return trimmed
         }
      }
   }
   return null
}

export const extractWikipediaPassage = (value: unknown, random = Math.random) => {
   const html = articleHtml(value)
   if (!html) return null

   const sections = sectionsFromHtml(html)
      .map((section) => ({
         rank:
            (INTERESTING_HEADING.test(section.heading) ? 4 : 0) +
            Math.max(0, random()) * 3,
         section,
      }))
      .sort((left, right) => right.rank - left.rank)
      .map(({ section }) => section)

   for (const section of sections) {
      const passage = passageFromSection(section, random)
      if (passage) return passage
   }
   return null
}
