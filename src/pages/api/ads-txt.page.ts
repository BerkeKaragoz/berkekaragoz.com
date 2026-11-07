import type { NextApiRequest, NextApiResponse } from "next"
import { ADSENSE_CLIENT } from "@/features/consent/config"

// Served at /ads.txt (rewrite in next.config.js). Built from the AdSense client
// id so it never needs editing. f08c47fec0942fa0 is Google's fixed
// certification authority id.

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
   if (!ADSENSE_CLIENT) return res.status(404).end()
   const publisher = ADSENSE_CLIENT.replace(/^ca-/, "")
   res.setHeader("Content-Type", "text/plain; charset=utf-8")
   res.setHeader("Cache-Control", "public, max-age=86400")
   res.status(200).send(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`)
}
