import { createMachine, createMachineContext } from "@statekit/react"
import {
   ADSENSE_CLIENT,
   CONSENT_NEEDED,
   CONSENT_STORAGE_KEY,
   GA_MEASUREMENT_ID,
   TCF_DETECT_TIMEOUT_MS,
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
   grantAdConsent,
   hasGoogleChoice,
   openGoogleSettings,
   releaseGoogleMessage,
   startAds,
   startAnalytics,
   watchTcf,
} from "./google"

/**
 * - `detecting`: waiting to learn whether Google's TCF message covers this visitor.
 * - `tcf`: Google's message asks (EEA, UK, Switzerland).
 * - `own`: our banner asks (everyone else, or when Google's tool is absent).
 *   A visitor with a choice saved from it starts here, and moves to `tcf` if
 *   Google's message turns out to cover them.
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
      undecide: ({ draft }) => {
         draft.decided = false
         draft.grants = NO_GRANTS
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

const forgetOwnChoice = () => {
   try {
      localStorage.removeItem(CONSENT_STORAGE_KEY)
   } catch {
      // Nothing was stored.
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
   if (next.ads && !before.ads) {
      // A TCF decision always grants "ads" here (tcfGrants), whatever the
      // visitor chose, so only our banner's choice may reach consent mode.
      if (consentMachine.data.mode !== "tcf") grantAdConsent()
      startAds()
   }
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

// Google's tool only says whether it covers the visitor (TCF) once its message
// is released, and releasing it shows the message to anyone who hasn't chosen.
// So a visitor who has chosen before is detected on load, and a new visitor
// only when the page asks (Consent's delay), by releasing Google's message
// and falling back to our banner if Google doesn't cover them. A choice saved
// from our banner doesn't wait for the answer (startConsent).

let stopDetecting: (() => void) | null = null
/** Open our banner as soon as detection lands on it: the page already asked. */
let askWhenKnown = false

const outsideTcf = () => {
   if (consentMachine.data.mode !== "detecting") return
   switchToOwnBanner()
   if (askWhenKnown && !consentMachine.data.decided) consentMachine.event.openBanner()
}

// Google's tool can load, say GDPR applies, and still show nothing, e.g. when
// no European regulations message is published. Then our banner asks instead.
let silentTimer: ReturnType<typeof setTimeout> | undefined

const onTcData = (data: TcData) => {
   if (data.gdprApplies === false) return outsideTcf()
   if (!data.eventStatus) {
      if (consentMachine.data.mode === "detecting" && silentTimer === undefined) {
         silentTimer = setTimeout(outsideTcf, TCF_DETECT_TIMEOUT_MS)
      }
      return
   }
   clearTimeout(silentTimer)
   const takingOver = consentMachine.data.mode !== "tcf"
   consentMachine.event.setMode("tcf")
   // Google's message covers this visitor from now on, so a choice saved from
   // our banner no longer counts, on this load or the next.
   if (takingOver) forgetOwnChoice()
   if (tcfDecided(data)) apply(tcfGrants(data))
   else if (takingOver && consentMachine.data.decided) {
      // A choice from our banner is in effect: one applied on load
      // (startConsent), or one made on this page before Google's tool spoke
      // up. Nothing runs until Google's message is answered: this reloads if
      // anything started.
      apply(NO_GRANTS)
      consentMachine.event.undecide()
   }
}

const detect = () => {
   if (stopDetecting) return
   releaseGoogleMessage()
   const stopWatching = watchTcf(onTcData, outsideTcf)
   stopDetecting = () => {
      clearTimeout(silentTimer)
      stopWatching()
   }
}

/** Starts consent handling once, in the browser. Returns a cleanup. */
export const startConsent = () => {
   if (!CONSENT_NEEDED) return () => {}
   if (!ADSENSE_CLIENT) {
      switchToOwnBanner()
      return () => {}
   }
   // A choice saved from our banner applies at once, so ads and the room they
   // take are there from the start instead of seconds in. Detection still
   // runs: if Google's message covers this visitor now, it takes over (onTcData).
   const own = readOwnChoice() !== null
   if (own) switchToOwnBanner()
   if (own || hasGoogleChoice()) detect()
   return () => {
      stopDetecting?.()
      stopDetecting = null
   }
}

/** Asks the visitor, through whichever banner covers them. Pages call this after their delay. */
export const askConsent = () => {
   const { mode, decided } = consentMachine.data
   if (decided) return
   if (mode === "own") consentMachine.event.openBanner()
   else if (mode === "detecting") {
      askWhenKnown = true
      detect()
   }
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
