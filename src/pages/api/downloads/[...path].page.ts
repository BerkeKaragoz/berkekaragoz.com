import type { NextApiRequest, NextApiResponse } from "next"
import {
   isTesterAuthorized,
   parseDownloadPath,
} from "@/features/downloads/privateDownloads"
import { getObjectStore } from "@/features/object-store/objectStore.mjs"
import { sendText } from "@/features/request-info/textResponse"

// Serverless responses are size-capped (4.5 MB on Vercel), so anything larger
// is a redirect to a short-lived signed URL on the bucket itself.
const MAX_PROXIED_BYTES = 1024 * 1024
const SIGNED_URL_SECONDS = 600

function unauthorized(req: NextApiRequest, res: NextApiResponse) {
   res.setHeader("WWW-Authenticate", 'Basic realm="downloads", charset="UTF-8"')
   return sendText(req, res, 401, "error=unauthorized")
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD")
      return sendText(req, res, 405, "error=method_not_allowed")
   }
   const path = parseDownloadPath(req.query.path)
   if (!path) return sendText(req, res, 404, "error=not_found")
   if (!isTesterAuthorized(req.headers.authorization, path.tester)) {
      return unauthorized(req, res)
   }
   const store = getObjectStore()
   if (!store) return sendText(req, res, 503, "error=store_not_configured")

   const [marker, object] = await Promise.all([
      path.key === path.markerKey ? null : store.head(path.markerKey),
      store.head(path.key),
   ])
   // Without a latest.json the tester is removed: refuse, never say what exists.
   if (path.key === path.markerKey ? !object : !marker) {
      return unauthorized(req, res)
   }
   if (!object) return sendText(req, res, 404, "error=not_found")

   res.setHeader("Cache-Control", "private, no-store, max-age=0")
   res.setHeader("CDN-Cache-Control", "no-store")
   res.setHeader("X-Robots-Tag", "noindex, nofollow")

   if (object.size > MAX_PROXIED_BYTES) {
      res.setHeader("Location", await store.presignGet(path.key, SIGNED_URL_SECONDS))
      return res.status(302).end()
   }

   const body = req.method === "HEAD" ? null : await store.get(path.key)
   if (req.method === "GET" && !body) {
      return sendText(req, res, 404, "error=not_found")
   }
   res.setHeader("Content-Type", object.contentType ?? "application/octet-stream")
   res.setHeader("Content-Length", String(object.size))
   if (!body) return res.status(200).end()
   return res.status(200).end(Buffer.from(await body.arrayBuffer()))
}

export const config = { api: { bodyParser: false } }
