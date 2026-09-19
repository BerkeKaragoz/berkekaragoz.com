import type { NextApiRequest, NextApiResponse } from "next"
import { getClientIp } from "@/features/request-info/clientIp"
import { getRequestContext } from "@/features/request-info/requestContext"
import { sendText } from "@/features/request-info/textResponse"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
   if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Allow", "GET, HEAD")
      return sendText(req, res, 405, "Method not allowed")
   }

   const { proxy } = getRequestContext()
   const ip = getClientIp(req.headers, req.socket?.remoteAddress, proxy)

   if (!ip) {
      return sendText(req, res, 503, "Client IP address unavailable")
   }

   return sendText(req, res, 200, ip)
}

export const config = { api: { bodyParser: false } }
