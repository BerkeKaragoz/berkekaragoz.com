import {
   ANALYTICS_PUBLISHER_PURPOSES,
   CONSENT_MAX_AGE_MS,
   CONSENT_VERSION,
} from "./config"

/** A choice made in our banner, kept in localStorage. */
export type OwnChoice = {
   version: number
   /** Random id, so the consent record can be found again. */
   id: string
   analytics: boolean
   ads: boolean
   decidedAt: string
}

/** What may run, whichever banner the visitor answered. */
export type Grants = { analytics: boolean; ads: boolean }

export const NO_GRANTS: Grants = { analytics: false, ads: false }

/** The stored choice, or null when missing, malformed, outdated or expired. */
export const parseOwnChoice = (raw: string | null, now: number): OwnChoice | null => {
   if (!raw) return null
   let value: unknown
   try {
      value = JSON.parse(raw)
   } catch {
      return null
   }
   if (!value || typeof value !== "object") return null
   const choice = value as Partial<OwnChoice>
   if (
      choice.version !== CONSENT_VERSION ||
      typeof choice.id !== "string" ||
      typeof choice.analytics !== "boolean" ||
      typeof choice.ads !== "boolean" ||
      typeof choice.decidedAt !== "string"
   ) {
      return null
   }
   const decidedAt = Date.parse(choice.decidedAt)
   if (Number.isNaN(decidedAt) || now - decidedAt > CONSENT_MAX_AGE_MS) return null
   return choice as OwnChoice
}

export const createOwnChoice = (grants: Grants, now: Date, id: string): OwnChoice => ({
   version: CONSENT_VERSION,
   id,
   analytics: grants.analytics,
   ads: grants.ads,
   decidedAt: now.toISOString(),
})

/** The parts of the TCF API's TCData we read. */
export type TcData = {
   gdprApplies?: boolean
   eventStatus?: "tcloaded" | "cmpuishown" | "useractioncomplete" | string
   publisher?: { consents?: Record<string, boolean> }
}

/** True once the visitor has a TCF decision, stored or just made. */
export const tcfDecided = (tcData: TcData) =>
   tcData.eventStatus === "tcloaded" || tcData.eventStatus === "useractioncomplete"

/**
 * Grants from a TCF decision. AdSense reads the TC string itself, so "ads"
 * only means AdSense may load and decide; GA4 needs our own purposes.
 */
export const tcfGrants = (tcData: TcData): Grants => {
   const consents = tcData.publisher?.consents ?? {}
   return {
      analytics: ANALYTICS_PUBLISHER_PURPOSES.every((p) => consents[p] === true),
      ads: true,
   }
}

/** True when a grant was taken back, so already-loaded scripts must go. */
export const revoked = (before: Grants, after: Grants) =>
   (before.analytics && !after.analytics) || (before.ads && !after.ads)
