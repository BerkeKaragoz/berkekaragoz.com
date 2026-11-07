// Consent for GA4 and AdSense. See docs/cookie-consent.md for the decisions.
//
// EEA, UK and Swiss visitors get Google's own TCF message (AdSense Privacy &
// messaging), restyled by src/styles/google-consent.css. Everyone else gets
// our banner. Nothing from GA4 or AdSense loads before a decision.

/** AdSense client id, "ca-pub-…". Unset: no ads and no Google message. */
export const ADSENSE_CLIENT = process.env["NEXT_PUBLIC_ADSENSE_CLIENT"] || ""

/**
 * AdSense ad unit slot ids, one per kind of placement so AdSense reports them
 * apart. An unset slot shows no ad there.
 */
export const ADSENSE_SLOTS = {
   /** At the end of a blog post. */
   post: process.env["NEXT_PUBLIC_ADSENSE_SLOT_POST"] || "",
   /** Below a tool: pitch graph, English IPA. */
   tool: process.env["NEXT_PUBLIC_ADSENSE_SLOT_TOOL"] || "",
}

/** GA4 measurement id, "G-…". Unset: no analytics. */
export const GA_MEASUREMENT_ID = process.env["NEXT_PUBLIC_GA_MEASUREMENT_ID"] || ""

/** With neither set, the site keeps no optional cookies and shows no banner. */
export const CONSENT_NEEDED = Boolean(ADSENSE_CLIENT || GA_MEASUREMENT_ID)

/** Bump to ask everyone again, e.g. after adding a new kind of cookie. */
export const CONSENT_VERSION = 1

/** Ask again after about six months (ICO and CNIL suggestion). */
export const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000

export const CONSENT_STORAGE_KEY = "consent"

/**
 * TCF purposes GA4 runs under, set as "purposes for your own use" in AdSense
 * Privacy & messaging with consent as the legal basis: store and access
 * information (1), measure content performance (8), understand audiences (9).
 * GA4 loads only when the visitor consents to all of them.
 */
export const ANALYTICS_PUBLISHER_PURPOSES = [1, 8, 9] as const

/** How long to wait for Google's consent tool before treating the visitor as outside TCF. */
export const TCF_DETECT_TIMEOUT_MS = 4000

/**
 * Where our banner goes. Google's message stays a dialog over a backdrop that
 * covers the page (TCF Policies Appendix B C(a)); `placement` only moves the
 * dialog within that.
 * - `corner`: a card in the bottom-left corner.
 * - `bar`: a bar along the bottom.
 * - `inline`: inside the page's `<ConsentSlot />`, or `corner` without one.
 */
export type ConsentPlacement = "corner" | "bar" | "inline"

export type ConsentPageConfig = {
   /** Wait this long on the page before asking. Default 0. */
   delayMs?: number
   placement?: ConsentPlacement
   /** Sets `data-consent-variant` on <html> so CSS can restyle per page. */
   variant?: string
}

export const DEFAULT_PAGE_CONSENT: Required<Omit<ConsentPageConfig, "variant">> = {
   delayMs: 0,
   placement: "corner",
}
