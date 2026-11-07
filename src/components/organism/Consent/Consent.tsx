import Switch from "@/components/atomic/Switch/Switch"
import LinkText from "@/components/atomic/LinkText/LinkText"
import { COMMON_TNS } from "@/lib/i18n/consts"
import {
   ConsentPageConfig,
   ConsentPlacement,
   DEFAULT_PAGE_CONSENT,
} from "@/features/consent/config"
import {
   consentMachine,
   decideOwn,
   OFFERED,
   startConsent,
   useConsentMachine,
} from "@/features/consent/consent"
import { releaseGoogleMessage } from "@/features/consent/google"
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
const BUTTON =
   "px-3 py-1.5 text-sm font-medium card-input grow basis-0 whitespace-nowrap enabled:!bg-background-50 dark:enabled:!bg-background-700 enabled:text-primary-700 enabled:hover:text-primary-800"

// Accept, reject and choose have equal weight: same size, style and order of
// prominence (ICO, EDPB, CNIL).
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

         <div className="flex flex-wrap gap-2">
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
               {t("consent.rejectAll")}
            </button>
            {view === "first" ? (
               <button
                  type="button"
                  className={BUTTON}
                  onClick={() => m.event.showView("preferences")}
               >
                  {t("consent.choose")}
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

   // The delay restarts on every page, so each page decides when to ask.
   React.useEffect(() => {
      if (decided || (mode !== "tcf" && mode !== "own")) return
      if (mode === "own" && bannerOpen) return
      const timer = setTimeout(() => {
         if (mode === "tcf") releaseGoogleMessage()
         else consentMachine.event.openBanner()
      }, delayMs)
      return () => clearTimeout(timer)
   }, [mode, decided, bannerOpen, delayMs, router.asPath])

   return <Banner placement={placement} />
}

export default Consent
