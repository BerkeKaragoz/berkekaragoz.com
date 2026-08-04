import {
   calculateGutenbergRange,
   extractGutenbergPassage,
   parseGutendexBooks,
   rotateBooks,
} from "@/features/ipa/gutenberg"
import type { NextApiRequest, NextApiResponse } from "next"

const GUTENDEX_PAGE_COUNT = 6
const MAX_BOOK_ATTEMPTS = 3
const REQUEST_TIMEOUT = 8000

const gutenbergTextUrl = (id: number) =>
   `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`

const fetchPassage = async (id: number, signal: AbortSignal): Promise<string> => {
   const url = gutenbergTextUrl(id)
   const metadataResponse = await fetch(url, { method: "HEAD", signal })
   const contentLength = Number(metadataResponse.headers.get("content-length"))
   if (!metadataResponse.ok || !contentLength) throw new Error()

   const { end, start } = calculateGutenbergRange(contentLength)
   const textResponse = await fetch(url, {
      headers: { Range: `bytes=${start}-${end}` },
      signal,
   })
   if (!textResponse.ok) throw new Error()

   return extractGutenbergPassage(await textResponse.text())
}

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
   response.setHeader("Cache-Control", "no-store, max-age=0")
   if (request.method !== "GET") {
      response.setHeader("Allow", "GET")
      response.status(405).json({ error: "Method not allowed" })
      return
   }

   const controller = new AbortController()
   const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

   try {
      const page = 1 + Math.floor(Math.random() * GUTENDEX_PAGE_COUNT)
      const catalogueResponse = await fetch(
         `https://gutendex.com/books/?languages=en&topic=fiction&sort=popular&page=${page}`,
         { signal: controller.signal }
      )
      if (!catalogueResponse.ok) throw new Error()

      const books = rotateBooks(
         parseGutendexBooks(await catalogueResponse.json())
      ).slice(0, MAX_BOOK_ATTEMPTS)
      if (!books.length) throw new Error()

      for (const book of books) {
         try {
            const text = await fetchPassage(book.id, controller.signal)
            response.status(200).json({
               source: {
                  id: book.id,
                  title: book.title,
                  url: `https://www.gutenberg.org/ebooks/${book.id}`,
               },
               text,
            })
            return
         } catch (error) {
            if (controller.signal.aborted) throw error
         }
      }

      throw new Error()
   } catch {
      response.status(503).json({ error: "Practice text is unavailable" })
   } finally {
      clearTimeout(timeout)
   }
}

export default handler
