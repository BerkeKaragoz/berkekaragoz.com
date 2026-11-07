import { createMachine, createMachineContext } from "@statekit/react"
import {
   ADSENSE_CLIENT,
   CONSENT_NEEDED,
   CONSENT_STORAGE_KEY,
   GA_MEASUREMENT_ID,
} from "./config"
import {
   createOwnChoice,
   Grants,
   NO_GRANTS,
   OwnChoice,
   parseOwnChoice,
   revoked,
   TcData,
   tcfDecided,
   tcfGrants,
} from "./choice"
import {
   clearAnalyticsCookies,
   openGoogleSettings,
   startAds,
   startAnalytics,
   watchTcf,
} from "./google"

/**
 * - `detecting`: waiting to learn whether Google's TCF message covers this visitor.
 * - `tcf`: Google's message asks (EEA, UK, Switzerland).
 * - `own`: our banner asks (everyone else, or when Google's tool is absent).
 * - `off`: nothing is configured, so there is nothing to ask.
 */
export type ConsentMode = "detecting" | "tcf" | "own" | "off"

export type BannerView = "first" | "preferences"

export const consentMachine = createMachine({
   data: {
      mode: (CONSENT_NEEDED ? "detecting" : "off") as ConsentMode,
      decided: false,
      grants: NO_GRANTS as Grants,
      bannerOpen: false,
      view: "first" as BannerView,
      /** How many <ConsentSlot />s are mounted; the banner looks for one when it changes. */
      slots: 0,
   },
   events: {
      setMode: ({ draft }, mode: ConsentMode) => {
         draft.mode = mode
      },
      decide: ({ draft }, grants: Grants) => {
         draft.decided = true
         draft.grants = grants
      },
      openBanner: ({ draft }, view: BannerView = "first") => {
         draft.bannerOpen = true
         draft.view = view
      },
      showView: ({ draft }, view: BannerView) => {
         draft.view = view
      },
      closeBanner: ({ draft }) => {
         draft.bannerOpen = false
      },
      slotMounted: ({ draft }) => {
         draft.slots++
      },
      slotUnmounted: ({ draft }) => {
         draft.slots--
      },
   },
})

export const [useConsentMachine] = createMachineContext(consentMachine)

/** What our banner offers: only the services that are configured. */
export const OFFERED = { analytics: Boolean(GA_MEASUREMENT_ID), ads: Boolean(ADSENSE_CLIENT) }

const readOwnChoice = (): OwnChoice | null => {
   try {
      return parseOwnChoice(localStorage.getItem(CONSENT_STORAGE_KEY), Date.now())
   } catch {
      return null
   }
}

const writeOwnChoice = (choice: OwnChoice) => {
   try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice))
   } catch {
      // Private mode or blocked storage: the choice holds for this page view only.
   }
}

const newId = () =>
   typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

/** Starts what the visitor allowed. Withdrawing something already running reloads the page. */
const apply = (next: Grants) => {
   const before = consentMachine.data.grants
   consentMachine.event.decide(next)
   if (revoked(before, next)) {
      if (before.analytics && !next.analytics) clearAnalyticsCookies()
      window.location.reload()
      return
   }
   if (next.analytics && !before.analytics) startAnalytics()
   if (next.ads && !before.ads) startAds()
}

const recordOwnChoice = (choice: OwnChoice) => {
   fetch("/api/consent", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...choice, locale: document.documentElement.lang }),
   }).catch(() => {
      // The record is best effort; the choice itself is already applied.
   })
}

const switchToOwnBanner = () => {
   consentMachine.event.setMode("own")
   const stored = readOwnChoice()
   if (stored) apply({ analytics: stored.analytics, ads: stored.ads })
}

const onTcData = (data: TcData) => {
   if (data.gdprApplies === false) {
      if (consentMachine.data.mode === "detecting") switchToOwnBanner()
      return
   }
   consentMachine.event.setMode("tcf")
   if (tcfDecided(data)) apply(tcfGrants(data))
}

/** Starts consent handling once, in the browser. Returns a cleanup. */
export const startConsent = () => {
   if (!CONSENT_NEEDED) return () => {}
   return watchTcf(onTcData, () => {
      if (consentMachine.data.mode === "detecting") switchToOwnBanner()
   })
}

/** Saves a choice made in our banner and applies it. */
export const decideOwn = (grants: Grants) => {
   const allowed = {
      analytics: grants.analytics && OFFERED.analytics,
      ads: grants.ads && OFFERED.ads,
   }
   const previous = readOwnChoice()
   const choice = createOwnChoice(allowed, new Date(), previous?.id ?? newId())
   writeOwnChoice(choice)
   recordOwnChoice(choice)
   consentMachine.event.closeBanner()
   apply(allowed)
}

/** The footer's "Cookie settings": reopens whichever banner this visitor gets. */
export const openConsentSettings = () => {
   const { mode } = consentMachine.data
   if (mode === "tcf") openGoogleSettings()
   else if (mode === "own") consentMachine.event.openBanner("preferences")
}
