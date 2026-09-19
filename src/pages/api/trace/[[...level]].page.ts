import type { NextApiRequest, NextApiResponse } from "next"
import { getRequestContext } from "@/features/request-info/requestContext"
import { sendText } from "@/features/request-info/textResponse"
import { buildTrace, parseTraceLevel } from "@/features/trace/trace"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
   return sendText(
      req,
      res,
      200,
      buildTrace(req, getRequestContext(), level, startedAt, timestamp)
   )
}

// Only inspect metadata; never consume or parse request bodies.
export const config = { api: { bodyParser: false } }
