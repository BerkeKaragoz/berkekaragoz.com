import type { NextApiRequest } from "next"
import { userAgentFromString } from "next/server"
import type { TLSSocket } from "node:tls"
import { getClientIp } from "@/features/request-info/clientIp"
import type { RequestContext } from "@/features/request-info/requestContext"
import { getIpScope, parseIpAddress } from "@/features/request-info/ipAddress"
import { lookupLocalAsn } from "./localNetwork"

// Each level adds fields to all previous levels. Unavailable values stay unknown.
const FIELDS_BY_LEVEL = [
   [
      "level",
      "metadata_source",
      "fl",
      "h",
      "ip",
      "ip_version",
      "ip_scope",
      "ts",
      "visit_scheme",
      "http",
      "tls",
      "colo",
      "loc",
      "server_node",
      "anycast_node",
      "server_process_time_us",
      "content_length",
      "keep_alive",
   ],
   [
      "uag",
      "browser_name",
      "browser_version",
      "os_name",
      "device_type",
      "client_identity_source",
      "client_language",
      "cipher_suite",
      "alpn_protocol",
      "sni",
      "kex",
      "client_tcp_rtt_ms",
      "client_quic_rtt_ms",
      "tcp_handshake_ms",
      "tls_handshake_ms",
      "ttfb_ms",
   ],
   [
      "asn",
      "as_organization",
      "asn_source",
      "asn_lookup_status",
      "asn_dataset_date",
      "asn_dataset_age_hours",
      "asn_dataset_stale",
      "isp",
      "bgp_prefix",
      "region",
      "timezone",
      "geo_source",
      "connection_type",
      "proxy",
      "vpn",
      "warp",
      "gateway",
   ],
   [
      "city",
      "postal_code",
      "latitude",
      "longitude",
      "location_accuracy_radius_km",
      "ptr",
   ],
   [
      "ja3_fingerprint",
      "ja4_fingerprint",
      "referer",
      "forwarded_for",
      "forwarded_for_source",
      "client_port",
      "tls_session_reused",
      "bot_score",
      "threat_score",
      "reputation",
      "rate_limit_status",
      "waf_matches",
   ],
] as const

export const MAX_TRACE_LEVEL = FIELDS_BY_LEVEL.length

export function parseTraceLevel(
   value: string | string[] | undefined
): number | null {
   if (value === undefined) return MAX_TRACE_LEVEL
   // Next's optional catch-all path is an array. Reject query-only overrides.
   if (!Array.isArray(value) || value.length !== 1 || !/^[1-5]$/.test(value[0])) {
      return null
   }
   return Number(value[0])
}

function header(req: NextApiRequest, name: string): string | undefined {
   const value = req.headers[name]
   return typeof value === "string" ? value.slice(0, 4096) : undefined
}

function scalar(value: unknown): string {
   if (
      value === undefined ||
      value === null ||
      value === "" ||
      !["string", "number", "boolean"].includes(typeof value) ||
      (typeof value === "number" && !Number.isFinite(value))
   )
      return "unknown"

   // Keep every value on one physical line; header contents cannot inject keys.
   return String(value)
      .slice(0, 4096)
      .replace(/\\/g, "\\\\")
      .replace(
         /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g,
         (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
      )
}

function object(value: unknown): Record<string, unknown> {
   return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
}

function preferredLanguage(value: string | undefined): string | undefined {
   return value
      ?.split(",")
      .map((entry, index) => {
         const [language, ...parameters] = entry.trim().split(";")
         const quality = parameters.find((parameter) =>
            parameter.trim().startsWith("q=")
         )
         const weight = quality ? Number(quality.trim().slice(2)) : 1
         return { language, weight, index }
      })
      .filter(
         ({ language, weight }) =>
            /^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/i.test(language) &&
            Number.isFinite(weight) &&
            weight > 0 &&
            weight <= 1
      )
      .sort((a, b) => b.weight - a.weight || a.index - b.index)[0]?.language
}

export function buildTrace(
   req: NextApiRequest,
   context: RequestContext,
   level: number,
   startedAt: number,
   timestamp: number
): string {
   const { proxy, cf = {} } = context
   const direct = proxy === "direct"
   const socket = req.socket as Partial<TLSSocket> | undefined
   const encrypted = direct && socket?.encrypted === true
   const forwardedScheme = !direct ? header(req, "x-forwarded-proto") : undefined
   const scheme = direct
      ? encrypted
         ? "https"
         : "http"
      : forwardedScheme === "https" || forwardedScheme === "http"
        ? forwardedScheme
        : undefined
   const contentLength = header(req, "content-length")
   const connection = direct ? header(req, "connection")?.toLowerCase() : undefined
   const clientIp = getClientIp(req.headers, socket?.remoteAddress, proxy)
   const address = parseIpAddress(clientIp)
   const values: Record<string, unknown> = {
      level,
      metadata_source: proxy,
      h: header(req, "host"),
      ip: clientIp,
      ip_version: address?.version,
      ip_scope: getIpScope(address),
      // Handler arrival time, not an invented edge or TCP handshake timestamp.
      ts: (timestamp / 1000).toFixed(3),
      visit_scheme: scheme,
      http:
         typeof cf.httpProtocol === "string"
            ? cf.httpProtocol.toLowerCase()
            : direct && req.httpVersion
              ? `http/${req.httpVersion}`
              : undefined,
      tls: cf.tlsVersion ?? (encrypted ? socket?.getProtocol?.() : undefined),
      colo: cf.colo,
      loc:
         cf.country ??
         (proxy === "cloudflare"
            ? header(req, "cf-ipcountry")
            : proxy === "vercel"
              ? header(req, "x-vercel-ip-country")
              : undefined),
      server_node:
         cf.colo ?? (proxy === "vercel" ? process.env.VERCEL_REGION : undefined),
      anycast_node: cf.colo,
      content_length:
         contentLength && /^\d+$/.test(contentLength) ? contentLength : undefined,
      keep_alive:
         connection === "keep-alive"
            ? true
            : connection === "close"
              ? false
              : undefined,
   }

   if (level >= 2) {
      const ua = header(req, "user-agent")
      const parsed = userAgentFromString(ua)
      const desktop =
         !parsed.isBot &&
         parsed.browser.name &&
         ["Windows", "Mac OS", "Linux", "Ubuntu", "Chrome OS"].includes(
            parsed.os.name || ""
         )
      Object.assign(values, {
         uag: ua,
         browser_name: parsed.browser.name,
         browser_version: parsed.browser.version,
         os_name: parsed.os.name,
         device_type:
            parsed.device.type === "smarttv"
               ? "smart-tv"
               : (parsed.device.type ?? (desktop ? "desktop" : undefined)),
         client_identity_source: ua ? "user_agent" : undefined,
         client_language: preferredLanguage(header(req, "accept-language")),
         cipher_suite:
            cf.tlsCipher ??
            (encrypted ? socket?.getCipher?.()?.standardName : undefined),
         alpn_protocol: encrypted ? socket?.alpnProtocol || undefined : undefined,
         client_tcp_rtt_ms: cf.clientTcpRtt,
         client_quic_rtt_ms: cf.clientQuicRtt,
      })
   }

   if (level >= 3) {
      const localAsn = lookupLocalAsn(address, timestamp)
      Object.assign(values, {
         asn: localAsn.asn ?? cf.asn,
         as_organization: localAsn.asn ? localAsn.organization : cf.asOrganization,
         asn_source: localAsn.asn
            ? "iptoasn_local"
            : cf.asn
              ? "cloudflare"
              : undefined,
         asn_lookup_status:
            !localAsn.asn && cf.asn ? "edge_metadata" : localAsn.status,
         asn_dataset_date: localAsn.date,
         asn_dataset_age_hours: localAsn.ageHours,
         asn_dataset_stale: localAsn.stale,
         region:
            cf.region ??
            (proxy === "vercel"
               ? header(req, "x-vercel-ip-country-region")
               : undefined),
         timezone:
            cf.timezone ??
            (proxy === "vercel" ? header(req, "x-vercel-ip-timezone") : undefined),
         geo_source: context.cf
            ? "cloudflare"
            : proxy === "vercel"
              ? "vercel"
              : undefined,
      })
   }

   if (level >= 4) {
      const vercelCity =
         proxy === "vercel" ? header(req, "x-vercel-ip-city") : undefined
      let city = vercelCity
      try {
         if (city) city = decodeURIComponent(city)
      } catch {
         city = undefined
      }
      Object.assign(values, {
         city: cf.city ?? city,
         postal_code: cf.postalCode,
         latitude:
            cf.latitude ??
            (proxy === "vercel" ? header(req, "x-vercel-ip-latitude") : undefined),
         longitude:
            cf.longitude ??
            (proxy === "vercel" ? header(req, "x-vercel-ip-longitude") : undefined),
      })
   }

   if (level >= 5) {
      const bot = object(cf.botManagement)
      const forwardedFor = header(req, "x-forwarded-for")
      Object.assign(values, {
         ja3_fingerprint: bot.ja3Hash,
         ja4_fingerprint: bot.ja4,
         referer: header(req, "referer"),
         forwarded_for: forwardedFor,
         // A supplied chain is useful to inspect, but is not a verified route.
         forwarded_for_source: forwardedFor
            ? "request_header_unverified"
            : undefined,
         client_port: direct ? socket?.remotePort : undefined,
         tls_session_reused: encrypted ? socket?.isSessionReused?.() : undefined,
         bot_score: bot.score,
      })
   }

   // Time to prepare the response, not network RTT or client-observed TTFB.
   values.server_process_time_us = Math.round((performance.now() - startedAt) * 1000)
   return FIELDS_BY_LEVEL.slice(0, level)
      .flat()
      .map((key) => `${key}=${scalar(values[key])}`)
      .join("\n")
}
