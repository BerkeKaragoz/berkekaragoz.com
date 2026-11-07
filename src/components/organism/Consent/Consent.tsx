import Switch from "@/components/atomic/Switch/Switch"
import LinkText from "@/components/atomic/LinkText/LinkText"
import { COMMON_TNS } from "@/lib/i18n/consts"
import {
   ConsentPageConfig,
   ConsentPlacement,
   DEFAULT_PAGE_CONSENT,
} from "@/features/consent/config"
import {
   askConsent,
   consentMachine,
   decideOwn,
   OFFERED,
   startConsent,
   useConsentMachine,
} from "@/features/consent/consent"
import { useTranslation } from "next-i18next"
import { useRouter } from "next/router"
import React from "react"
import { createPortal } from "react-dom"
import { CONSENT_SLOT_ID } from "./ConsentSlot"

// The banner only mentions what is configured.
const BODY_KEY =
   OFFERED.analytics && OFFERED.ads
      ? "consent.body"
      : OFFERED.analytics
        ? "consent.bodyAnalytics"
        : "consent.bodyAds"

// card-input's background matches the card the banner sits on, so the buttons
// sit one step lighter, like the StateKit demo buttons (PostDemo/DemoUI.tsx).
const BUTTON_BASE = "px-3 py-1.5 text-sm font-medium grow basis-0 whitespace-nowrap"
const BUTTON = `${BUTTON_BASE} card-input enabled:!bg-background-50 dark:enabled:!bg-background-700 enabled:text-primary-700 enabled:hover:text-primary-800`
const BUTTON_GHOST = `${BUTTON_BASE} card-input-ghost`

// "Necessary cookies only" sits on the first screen in the same style as
// "Accept all" (ICO, EDPB, CNIL: refusing must be as easy as accepting).
// "Settings" only opens the preferences, so it is the ghost variant; once they
// are open, "Save choices" takes its place in the full style.
const Banner: React.FC<{ placement: ConsentPlacement }> = (props) => {
   const m = useConsentMachine()
   const { t } = useTranslation(COMMON_TNS)
   const [analytics, setAnalytics] = React.useState(false)
   const [ads, setAds] = React.useState(false)
   const [slot, setSlot] = React.useState<HTMLElement | null>(null)

   const open = m.data.mode === "own" && m.data.bannerOpen
   const view = m.data.view
   const slots = m.data.slots

   React.useEffect(() => {
      setSlot(props.placement === "inline" ? document.getElementById(CONSENT_SLOT_ID) : null)
   }, [props.placement, slots, open])

   // The preferences start from what the visitor chose before, or all off.
   React.useEffect(() => {
      if (!open) return
      setAnalytics(consentMachine.data.grants.analytics)
      setAds(consentMachine.data.grants.ads)
   }, [open])

   if (!open) return null

   const placement = props.placement === "inline" && !slot ? "corner" : props.placement
   const frame = {
      corner: "fixed z-50 bottom-4 left-4 right-4 sm:right-auto sm:w-[26rem]",
      bar: "fixed z-50 bottom-0 inset-x-0 rounded-none sm:px-[max(1rem,calc(50%-36rem))]",
      inline: "relative w-full my-6",
   }[placement]

   const banner = (
      <section
         aria-label={t("consent.region")}
         className={`p-4 card text-sm consent-banner ${frame}`}
         data-placement={placement}
      >
         <h2 className="mb-1 text-base font-semibold text-caption-color">
            {t("consent.title")}
         </h2>
         <p className="mb-3 opacity-90">
            {t(BODY_KEY)}{" "}
            <LinkText href="/privacy">{t("consent.privacy")}</LinkText>
         </p>

         {view === "preferences" && (
            <div className="flex flex-col gap-2 p-3 mb-3 well">
               {OFFERED.analytics && (
                  <Switch
                     checked={analytics}
                     onChange={(e) => setAnalytics(e.target.checked)}
                  >
                     <span className="mr-auto">
                        <span className="block font-medium">{t("consent.analytics")}</span>
                        <span className="block text-xs opacity-80">
                           {t("consent.analyticsDetail")}
                        </span>
                     </span>
                  </Switch>
               )}
               {OFFERED.ads && (
                  <Switch checked={ads} onChange={(e) => setAds(e.target.checked)}>
                     <span className="mr-auto">
                        <span className="block font-medium">{t("consent.ads")}</span>
                        <span className="block text-xs opacity-80">
                           {t("consent.adsDetail")}
                        </span>
                     </span>
                  </Switch>
               )}
            </div>
         )}

         {/* Reversed so the row reads Settings, Necessary, Accept, and when the
             buttons wrap, Settings is the one that drops to the bottom row. */}
         <div className="flex flex-row-reverse flex-wrap gap-2">
            <button
               type="button"
               className={BUTTON}
               onClick={() => decideOwn({ analytics: true, ads: true })}
            >
               {t("consent.acceptAll")}
            </button>
            <button
               type="button"
               className={BUTTON}
               onClick={() => decideOwn({ analytics: false, ads: false })}
            >
               {t("consent.necessaryOnly")}
            </button>
            {view === "first" ? (
               <button
                  type="button"
                  className={BUTTON_GHOST}
                  onClick={() => m.event.showView("preferences")}
               >
                  {t("consent.preferences")}
               </button>
            ) : (
               <button
                  type="button"
                  className={BUTTON}
                  onClick={() => decideOwn({ analytics, ads })}
               >
                  {t("consent.save")}
               </button>
            )}
         </div>
      </section>
   )

   return placement === "inline" && slot ? createPortal(banner, slot) : banner
}

/**
 * Asks for consent, once per visitor, when and where the page wants. Pages set
 * `Page.consent` (see `AppPage` in _app) to change the delay, placement or
 * style; Google's message is restyled through `data-consent-*` on <html>.
 */
const Consent: React.FC<{ page?: ConsentPageConfig }> = (props) => {
   const m = useConsentMachine()
   const router = useRouter()
   const delayMs = props.page?.delayMs ?? DEFAULT_PAGE_CONSENT.delayMs
   const placement = props.page?.placement ?? DEFAULT_PAGE_CONSENT.placement
   const variant = props.page?.variant

   React.useEffect(() => startConsent(), [])

   React.useEffect(() => {
      const root = document.documentElement
      root.dataset["consentPlacement"] = placement
      if (variant) root.dataset["consentVariant"] = variant
      else delete root.dataset["consentVariant"]
   }, [placement, variant])

   const { mode, decided, bannerOpen } = m.data

   // The delay restarts on every page, so each page decides when to ask. Once
   // Google's message is released or our banner is open, it stays up.
   React.useEffect(() => {
      if (decided || mode === "off" || mode === "tcf" || bannerOpen) return
      const timer = setTimeout(askConsent, delayMs)
      return () => clearTimeout(timer)
   }, [mode, decided, bannerOpen, delayMs, router.asPath])

   return <Banner placement={placement} />
}

export default Consent
