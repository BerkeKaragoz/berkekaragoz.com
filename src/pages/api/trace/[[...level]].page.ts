import type { NextApiRequest, NextApiResponse } from "next"
import { getObjectStore } from "@/features/object-store/objectStore.mjs"
import { getClientIp } from "@/features/request-info/clientIp"
import { getRequestContext } from "@/features/request-info/requestContext"
import { sendText } from "@/features/request-info/textResponse"
import { appHitKey, buildAppHit, traceAppOf } from "@/features/trace/appHit"
import { buildTrace, parseTraceLevel } from "@/features/trace/trace"

// The app does not wait on the answer, but do not hold its socket open either.
const STORE_TIMEOUT_MS = 2500

async function recordAppHit(req: NextApiRequest, app: string) {
   const store = getObjectStore()
   if (!store) {
      console.warn("trace: OBJECT_STORE_* is not set, dropping app hit")
      return
   }
   const { proxy } = getRequestContext()
   const ip = getClientIp(req.headers, req.socket?.remoteAddress, proxy)
   const hit = buildAppHit(req.query, req.headers, ip, new Date())
   let timer: ReturnType<typeof setTimeout> | undefined
   try {
      await Promise.race([
         store.put(appHitKey(app, hit), JSON.stringify(hit), "application/json"),
         new Promise((_, reject) => {
            timer = setTimeout(
               () => reject(new Error("timed out")),
               STORE_TIMEOUT_MS
            )
         }),
      ])
   } catch (error) {
      console.error("trace: storing app hit failed", error)
   } finally {
      clearTimeout(timer)
   }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   const startedAt = performance.now()
   const timestamp = Date.now()
   if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD")
      return sendText(req, res, 405, "error=method_not_allowed")
   }
   const level = parseTraceLevel(req.query.level)
   if (level === null) {
      return sendText(req, res, 400, "error=invalid_level\nallowed_levels=1,2,3,4,5")
   }
   const app = traceAppOf(req.query)
   if (app) {
      if (req.method === "GET") await recordAppHit(req, app)
      res.setHeader("Cache-Control", "private, no-store, max-age=0")
      res.setHeader("CDN-Cache-Control", "no-store")
      res.setHeader("X-Robots-Tag", "noindex, nofollow")
      return res.status(204).end()
   }
   return sendText(
      req,
      res,
      200,
      buildTrace(req, getRequestContext(), level, startedAt, timestamp)
   )
}

// Only inspect metadata; never consume or parse request bodies.
export const config = { api: { bodyParser: false } }
