import type { NextApiRequest, NextApiResponse } from "next"
import { getClientIp, TrustedProxy } from "@/features/public-ip/clientIp"

type IpResponse = { ip: string } | { error: string }

export default function handler(
   req: NextApiRequest,
   res: NextApiResponse<IpResponse>
) {
   res.setHeader("Cache-Control", "private, no-store, max-age=0")

   if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD")
      return res.status(405).json({ error: "Method not allowed" })
   }

   const trustedProxy: TrustedProxy =
      process.env.IP_TRUSTED_PROXY === "cloudflare"
         ? "cloudflare"
         : process.env.VERCEL === "1"
           ? "vercel"
           : "direct"
   const ip = getClientIp(req.headers, req.socket?.remoteAddress, trustedProxy)

   if (!ip) {
      res.status(503)
      return req.method === "HEAD"
         ? res.end()
         : res.json({ error: "Client IP address unavailable" })
   }

   res.status(200)
   return req.method === "HEAD" ? res.end() : res.json({ ip })
}
