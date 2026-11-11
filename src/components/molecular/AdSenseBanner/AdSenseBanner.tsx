import { ADSENSE_CLIENT } from "@/features/consent/config"
import { useConsentMachine } from "@/features/consent/consent"
import { useRouter } from "next/router"
import React from "react"
import AdSpace from "./AdSpace"

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
   /** Spacing around the ad, applied while its room is held or filled. */
   className?: string
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
 * How much room it takes while the ad is on the way, and when no ad comes, is
 * AdSpace's job.
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

   React.useEffect(() => {
      // No ins: AdSpace already knows no ad can come (the script is blocked).
      if (!ins.current) return
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
   }, [])

   return (
      <AdSpace ins={ins} className={className} height={size?.[1]}>
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
      </AdSpace>
   )
}

export default AdSenseBanner
