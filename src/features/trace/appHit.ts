import { randomBytes } from "node:crypto"
import type { IncomingHttpHeaders } from "node:http"

// Native apps that ping /trace/<level>?app=<name>&... on launch. Their hits
// are stored and answered with 204; any other request gets the text trace.
export const TRACE_APPS = new Set(["graphitect"])

const MAX_PARAMS = 24
const MAX_VALUE_LENGTH = 256
const SAFE_SEGMENT = /^[A-Za-z0-9._-]{1,64}$/

type Query = Partial<Record<string, string | string[]>>

export type AppHit = {
   ts: string
   ip: string | null
   query: Record<string, string>
   referer: string | null
   ua: string | null
}

function first(value: string | string[] | undefined): string | undefined {
   return Array.isArray(value) ? value[0] : value
}

/** The app named in the query when its hits are recorded, otherwise null. */
export function traceAppOf(query: Query): string | null {
   const app = first(query.app)
   return app && TRACE_APPS.has(app) ? app : null
}

/** The stored row: time, IP, the query (minus the route's own `level`), Referer and UA. */
export function buildAppHit(
   query: Query,
   headers: IncomingHttpHeaders,
   ip: string | null,
   now: Date
): AppHit {
   const params: Record<string, string> = {}
   for (const [name, value] of Object.entries(query)) {
      if (name === "level" || Object.keys(params).length >= MAX_PARAMS) continue
      const text = first(value)
      if (text !== undefined) {
         params[name.slice(0, 64)] = text.slice(0, MAX_VALUE_LENGTH)
      }
   }
   const header = (name: string) => {
      const value = first(headers[name])
      return value === undefined ? null : value.slice(0, MAX_VALUE_LENGTH)
   }
   return {
      ts: now.toISOString(),
      ip,
      query: params,
      referer: header("referer"),
      ua: header("user-agent"),
   }
}

/** trace/<app>/<tester>/<time>-<random>.json, so one tester's hits list together. */
export function appHitKey(app: string, hit: AppHit): string {
   const tester = hit.query.t
   const folder = tester && SAFE_SEGMENT.test(tester) ? tester : "_unknown"
   const stamp = hit.ts.replace(/[:.]/g, "-")
   return `trace/${app}/${folder}/${stamp}-${randomBytes(4).toString("hex")}.json`
}
