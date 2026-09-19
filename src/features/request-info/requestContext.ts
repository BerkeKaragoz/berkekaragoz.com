import { getCloudflareContext } from "@opennextjs/cloudflare"
import type { TrustedProxy } from "./clientIp"

export type RequestContext = {
   proxy: TrustedProxy
   cf?: Record<string, unknown>
}

export function getRequestContext(): RequestContext {
   try {
      // OpenNext supplies original edge metadata for the current request.
      const { cf } = getCloudflareContext<Record<string, unknown>>()
      if (cf) return { proxy: "cloudflare", cf }
   } catch {
      // Direct Next.js and Vercel servers have no Cloudflare runtime context.
   }
   return {
      proxy:
         process.env.IP_TRUSTED_PROXY === "cloudflare"
            ? "cloudflare"
            : process.env.VERCEL === "1"
              ? "vercel"
              : "direct",
   }
}
