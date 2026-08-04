import {
   extractWikipediaPassage,
   parseWikipediaCandidates,
   rankWikipediaCandidates,
} from "./wikipedia"

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

const fetchWikipedia = async (
   parameters: Record<string, string>,
   signal: AbortSignal
) => {
   const query = new URLSearchParams({
      ...parameters,
      format: "json",
      formatversion: "2",
      origin: "*",
   })
   const response = await fetch(`${WIKIPEDIA_API}?${query}`, {
      cache: "no-store",
      signal,
   })
   if (!response.ok) throw new Error()
   return response.json() as Promise<unknown>
}

export const fetchRandomText = async (signal: AbortSignal) => {
   const candidateData = await fetchWikipedia(
      {
         action: "query",
         cllimit: "max",
         clshow: "!hidden",
         exintro: "1",
         explaintext: "1",
         exsentences: "5",
         generator: "random",
         grnfilterredir: "nonredirects",
         grnlimit: "40",
         grnmaxsize: "60000",
         grnminsize: "8000",
         grnnamespace: "0",
         prop: "categories|extracts|pageprops",
      },
      signal
   )
   const candidates = rankWikipediaCandidates(
      parseWikipediaCandidates(candidateData)
   )

   for (const candidate of candidates.slice(0, 4)) {
      const articleData = await fetchWikipedia(
         {
            action: "parse",
            pageid: String(candidate.pageid),
            prop: "text|tocdata",
         },
         signal
      )
      const passage = extractWikipediaPassage(articleData)
      if (passage) return passage
   }

   throw new Error()
}
