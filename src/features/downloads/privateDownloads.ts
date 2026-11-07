// Per-tester release folders: /downloads/<app>/<tester>/<file...> maps to the
// private key downloads/<app>/<tester>/<file...>. HTTP Basic auth with the
// tester code as both username and password opens that one folder. A tester
// whose folder has no latest.json is treated as removed.

const SEGMENT = /^[A-Za-z0-9._-]{1,128}$/

export type DownloadPath = {
   app: string
   tester: string
   key: string
   markerKey: string
}

/** Validates the route segments; null for anything malformed. */
export function parseDownloadPath(
   segments: string | string[] | undefined
): DownloadPath | null {
   const parts = Array.isArray(segments) ? segments : segments ? [segments] : []
   if (parts.length < 3) return null
   if (!parts.every((part) => SEGMENT.test(part) && !/^\.+$/.test(part))) {
      return null
   }
   const [app, tester] = parts
   const folder = `downloads/${app}/${tester}`
   return {
      app,
      tester,
      key: `${folder}/${parts.slice(2).join("/")}`,
      markerKey: `${folder}/latest.json`,
   }
}

/** Decodes an `Authorization: Basic ...` header. */
export function parseBasicAuth(
   header: string | undefined
): { user: string; password: string } | null {
   const match = header?.match(/^Basic\s+([A-Za-z0-9+/=]+)\s*$/i)
   if (!match) return null
   const decoded = Buffer.from(match[1], "base64").toString("utf8")
   const colon = decoded.indexOf(":")
   if (colon < 0) return null
   return { user: decoded.slice(0, colon), password: decoded.slice(colon + 1) }
}

export function isTesterAuthorized(
   header: string | undefined,
   tester: string
): boolean {
   const auth = parseBasicAuth(header)
   return auth !== null && auth.user === tester && auth.password === tester
}
