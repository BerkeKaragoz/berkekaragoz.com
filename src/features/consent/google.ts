// Browser-side wiring to Google's consent message, GA4 and AdSense.

import { ADSENSE_CLIENT, GA_MEASUREMENT_ID, TCF_DETECT_TIMEOUT_MS } from "./config"
import type { TcData } from "./choice"

type TcfApi = (
   command: string,
   version: number,
   callback: (data: TcData & { listenerId?: number }, success: boolean) => void,
   parameter?: unknown
) => void

declare global {
   interface Window {
      dataLayer?: unknown[]
      gtag?: (...args: unknown[]) => void
      __tcfapi?: TcfApi
      googlefc?: {
         callbackQueue?: unknown[]
         showRevocationMessage?: () => void
      }
      __consentMessage?: { proceed: (show: boolean) => void }
      __consentReleased?: boolean
   }
}

const POLL_MS = 100

/**
 * Calls `onData` with every TCF update from Google's consent tool, or
 * `onAbsent` once if the tool doesn't appear in time (no AdSense client,
 * an ad blocker, or a region it doesn't serve). Returns a cleanup.
 */
export const watchTcf = (onData: (data: TcData) => void, onAbsent: () => void) => {
   let listenerId: number | undefined
   let stopped = false
   const startedAt = Date.now()

   const attach = (api: TcfApi) =>
      api("addEventListener", 2, (data, success) => {
         if (stopped || !success) return
         listenerId = data.listenerId
         onData(data)
      })

   if (!ADSENSE_CLIENT) {
      onAbsent()
      return () => {}
   }

   const timer = setInterval(() => {
      if (window.__tcfapi) {
         clearInterval(timer)
         attach(window.__tcfapi)
      } else if (Date.now() - startedAt > TCF_DETECT_TIMEOUT_MS) {
         clearInterval(timer)
         onAbsent()
      }
   }, POLL_MS)

   return () => {
      stopped = true
      clearInterval(timer)
      if (listenerId !== undefined) {
         window.__tcfapi?.("removeEventListener", 2, () => {}, listenerId)
      }
   }
}

/** Lets Google's message show. Before this, the head script holds it. */
export const releaseGoogleMessage = () => {
   window.__consentReleased = true
   window.__consentMessage?.proceed(true)
}

/** Reopens Google's message so the visitor can change or withdraw consent. */
export const openGoogleSettings = () => {
   const fc = (window.googlefc = window.googlefc || {})
   const queue = (fc.callbackQueue = fc.callbackQueue || [])
   queue.push(() => window.googlefc?.showRevocationMessage?.())
}

const loadScript = (id: string, src: string, crossOrigin?: string) => {
   if (document.getElementById(id)) return
   const script = document.createElement("script")
   script.id = id
   script.async = true
   script.src = src
   if (crossOrigin) script.crossOrigin = crossOrigin
   document.head.appendChild(script)
}

/** Loads GA4 after analytics consent (Consent Mode basic). */
export const startAnalytics = () => {
   if (!GA_MEASUREMENT_ID || !window.gtag) return
   window.gtag("consent", "update", { analytics_storage: "granted" })
   loadScript(
      "consent-gtag",
      `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
   )
   window.gtag("js", new Date())
   window.gtag("config", GA_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
   })
}

/** Loads AdSense after a decision. Ad slots pushed earlier render then. */
export const startAds = () => {
   if (!ADSENSE_CLIENT) return
   loadScript(
      "consent-adsbygoogle",
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
      "anonymous"
   )
}

/** Deletes GA4's cookies after analytics consent is withdrawn. */
export const clearAnalyticsCookies = () => {
   const host = window.location.hostname
   const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`]
   for (const entry of document.cookie.split(";")) {
      const name = entry.split("=")[0]?.trim()
      if (!name || !name.startsWith("_ga")) continue
      for (const domain of domains) {
         document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`
      }
   }
}
