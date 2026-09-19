import { isIP } from "node:net"
import type { IncomingHttpHeaders } from "node:http"

export type TrustedProxy = "cloudflare" | "vercel" | "direct"

function parseIp(value: string | string[] | undefined): string | null {
   if (typeof value !== "string") return null
   const ip = value.trim()
   if (ip.includes("%") || !isIP(ip)) return null

   // Node can represent an IPv4 peer as an IPv4-mapped IPv6 address.
   if (ip.toLowerCase().startsWith("::ffff:") && isIP(ip.slice(7)) === 4) {
      return ip.slice(7)
   }
   return ip
}

export function getClientIp(
   headers: IncomingHttpHeaders,
   remoteAddress: string | undefined,
   trustedProxy: TrustedProxy
): string | null {
   if (trustedProxy === "cloudflare") {
      const ip = parseIp(headers["cf-connecting-ip"])
      // Cloudflare's Pseudo IPv4 overwrite mode preserves IPv6 separately.
      if (ip && isIP(ip) === 4 && Number(ip.split(".")[0]) >= 240) {
         const ipv6 = parseIp(headers["cf-connecting-ipv6"])
         return ipv6 && isIP(ipv6) === 6 ? ipv6 : null
      }
      return ip
   }

   if (trustedProxy === "vercel") {
      // Vercel overwrites this header with the connecting client's address.
      return parseIp(headers["x-forwarded-for"])
   }

   // Never accept caller-supplied forwarding headers on a direct server.
   return parseIp(remoteAddress)
}
