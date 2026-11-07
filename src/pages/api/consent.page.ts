import type { NextApiRequest, NextApiResponse } from "next"
import { getObjectStore } from "@/features/object-store/objectStore.mjs"
import { CONSENT_VERSION } from "@/features/consent/config"

// Keeps a record of each choice made in our banner, so consent can be shown
// later (UK GDPR Art 7(1)). Google keeps the records for its own message. The
// record has no IP address or user agent: only the random id the browser
// stores with the choice.

const STORE_TIMEOUT_MS = 2500

type ConsentRecord = {
   id: string
   version: number
   analytics: boolean
   ads: boolean
   decidedAt: string
   locale: string
   receivedAt: string
}

const parseRecord = (body: unknown, now: Date): ConsentRecord | null => {
   if (!body || typeof body !== "object") return null
   const b = body as Record<string, unknown>
   if (
      typeof b["id"] !== "string" ||
      !/^[\w-]{8,64}$/.test(b["id"]) ||
      b["version"] !== CONSENT_VERSION ||
      typeof b["analytics"] !== "boolean" ||
      typeof b["ads"] !== "boolean" ||
      typeof b["decidedAt"] !== "string" ||
      Number.isNaN(Date.parse(b["decidedAt"]))
   ) {
      return null
   }
   return {
      id: b["id"],
      version: b["version"],
      analytics: b["analytics"],
      ads: b["ads"],
      decidedAt: b["decidedAt"],
      locale: typeof b["locale"] === "string" ? b["locale"].slice(0, 16) : "",
      receivedAt: now.toISOString(),
   }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   res.setHeader("Cache-Control", "private, no-store, max-age=0")
   if (req.method !== "POST") {
      res.setHeader("Allow", "POST")
      return res.status(405).end()
   }
   const now = new Date()
   const record = parseRecord(req.body, now)
   if (!record) return res.status(400).end()

   const store = getObjectStore()
   if (!store) {
      console.warn("consent: OBJECT_STORE_* is not set, dropping record")
      return res.status(204).end()
   }
   const key = `consent/${now.toISOString().slice(0, 10)}/${record.id}-${now.getTime()}.json`
   let timer: ReturnType<typeof setTimeout> | undefined
   try {
      await Promise.race([
         store.put(key, JSON.stringify(record), "application/json"),
         new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("timed out")), STORE_TIMEOUT_MS)
         }),
      ])
   } catch (error) {
      console.error("consent: storing record failed", error)
   } finally {
      clearTimeout(timer)
   }
   return res.status(204).end()
}
