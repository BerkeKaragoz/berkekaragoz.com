import type { NextApiRequest, NextApiResponse } from "next"

export function sendText(
   req: NextApiRequest,
   res: NextApiResponse,
   status: number,
   body: string
) {
   res.setHeader("Content-Type", "text/plain; charset=utf-8")
   res.setHeader("Cache-Control", "private, no-store, max-age=0")
   res.setHeader("CDN-Cache-Control", "no-store")
   res.setHeader("X-Content-Type-Options", "nosniff")
   res.setHeader("X-Robots-Tag", "noindex, nofollow")
   res.setHeader("Referrer-Policy", "no-referrer")
   res.status(status).end(req.method === "HEAD" ? undefined : `${body}\n`)
}
