import { ADSENSE_CLIENT } from "@/features/consent/config"
import { useConsentMachine } from "@/features/consent/consent"
import { useRouter } from "next/router"
import React from "react"

declare global {
   interface Window {
      adsbygoogle?: unknown[]
   }
}

type AdSenseBannerProps = {
   /** The ad unit's slot id, from ADSENSE_SLOTS. Empty: no ad. */
   slot: string
   format?: string
   /**
    * A fixed ad size in px, e.g. [300, 250], for a spot whose width is known
    * (a desktop rail). Without it the ad is responsive and fills its column.
    */
   size?: readonly [width: number, height: number]
   /**
    * A media query the ad needs, e.g. "(min-width: 1024px)" for a desktop-only
    * rail. AdSense can't size an ad inside a hidden container, so outside it
    * the ad isn't rendered at all.
    */
   media?: string
   /** Spacing around the ad, applied only once an ad has filled the slot. */
   className?: string
}

/** The id startAds gives the adsbygoogle.js script element. */
const SCRIPT_ID = "consent-adsbygoogle"
/** How long AdSense may take to pick up a slot before it is given up. */
const GIVE_UP_MS = 8000

/** Set once adsbygoogle.js fails to load, e.g. under an ad blocker. */
let scriptFailed = false

type AdStatus = "loading" | "filled" | "empty"

/**
 * What became of the ad in `ins`: AdSense marks it filled or unfilled; a
 * script that never loads, or never picks the slot up, leaves it empty.
 */
const useAdStatus = (ins: React.RefObject<HTMLModElement | null>) => {
   const [status, setStatus] = React.useState<AdStatus>(() =>
      scriptFailed ? "empty" : "loading"
   )
   React.useEffect(() => {
      const el = ins.current
      if (!el || scriptFailed) return
      const read = () => {
         const ad = el.getAttribute("data-ad-status")
         if (ad === "filled") setStatus("filled")
         else if (ad === "unfilled") setStatus("empty")
      }
      read()
      const observer = new MutationObserver(read)
      observer.observe(el, { attributes: true, attributeFilter: ["data-ad-status"] })

      const script = document.getElementById(SCRIPT_ID)
      const fail = () => {
         scriptFailed = true
         setStatus("empty")
      }
      script?.addEventListener("error", fail)
      const timer = window.setTimeout(() => {
         if (!el.hasAttribute("data-adsbygoogle-status")) setStatus("empty")
      }, GIVE_UP_MS)

      return () => {
         observer.disconnect()
         script?.removeEventListener("error", fail)
         window.clearTimeout(timer)
      }
   }, [ins])
   return status
}

const useMedia = (query: string | undefined) => {
   const [matches, setMatches] = React.useState(false)
   React.useEffect(() => {
      if (!query) return setMatches(true)
      const list = window.matchMedia(query)
      const update = () => setMatches(list.matches)
      update()
      list.addEventListener("change", update)
      return () => list.removeEventListener("change", update)
   }, [query])
   return matches
}

/**
 * One AdSense ad unit. It renders only once the visitor has allowed ads
 * (src/features/consent), so before that, or without consent, it takes no
 * space. It asks for a new ad on every page, including client-side navigation.
 * If no ad comes (unfilled, blocked, or the script never loads) it collapses;
 * its spacing appears only with an ad.
 */
const AdSenseBanner: React.FC<AdSenseBannerProps> = (props) => {
   const { slot, format = "auto", size, media, className } = props
   const m = useConsentMachine()
   const { asPath } = useRouter()
   const fits = useMedia(media)
   const show = Boolean(ADSENSE_CLIENT && slot && m.data.grants.ads && fits)

   if (!show) return null
   return (
      <AdSlot
         key={`${slot}:${asPath}`}
         slot={slot}
         format={format}
         size={size}
         fullWidth={!media}
         className={className}
      />
   )
}

type AdSlotProps = {
   slot: string
   format: string
   size?: readonly [width: number, height: number]
   fullWidth: boolean
   className?: string
}

/** One ad request; keyed per page, so each page starts over. */
const AdSlot = (props: AdSlotProps) => {
   const { slot, format, size, fullWidth, className } = props
   const ins = React.useRef<HTMLModElement>(null)
   const status = useAdStatus(ins)

   React.useEffect(() => {
      if (scriptFailed) return
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
   }, [])

   if (status === "empty") return null

   // A fixed ad keeps its size while loading, since AdSense reads it from
   // there; a responsive one has no height until it fills.
   return (
      <div className={`ad-slot ${status === "filled" ? (className ?? "") : ""}`}>
         {size ? (
            <ins
               ref={ins}
               className="adsbygoogle block mx-auto"
               style={{ width: size[0], height: size[1] }}
               data-ad-client={ADSENSE_CLIENT}
               data-ad-slot={slot}
            />
         ) : (
            <ins
               ref={ins}
               className="adsbygoogle block"
               data-ad-client={ADSENSE_CLIENT}
               data-ad-slot={slot}
               data-ad-format={format}
               data-full-width-responsive={fullWidth ? "true" : "false"}
            />
         )}
      </div>
   )
}

export default AdSenseBanner
