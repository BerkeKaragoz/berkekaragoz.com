const RANDOM_TEXT_URL = "/api/english-ipa/random-text"

export const fetchRandomText = async (signal: AbortSignal) => {
   const response = await fetch(RANDOM_TEXT_URL, {
      cache: "no-store",
      signal,
   })
   if (!response.ok) throw new Error()

   const data = (await response.json()) as { text?: unknown }
   if (typeof data.text !== "string" || !data.text.trim()) throw new Error()

   return data.text.trim()
}
