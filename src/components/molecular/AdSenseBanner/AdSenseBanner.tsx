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
    * A media query the ad needs, e.g. "(min-width: 1024px)" for a desktop-only
    * rail. AdSense can't size an ad inside a hidden container, so outside it
    * the ad isn't rendered at all.
    */
   media?: string
   /** Applied to the ad itself, so spacing only exists when an ad does. */
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
 */
const AdSenseBanner: React.FC<AdSenseBannerProps> = (props) => {
   const { slot, format = "auto", media, className } = props
   const m = useConsentMachine()
   const { asPath } = useRouter()
   const fits = useMedia(media)
   const show = Boolean(ADSENSE_CLIENT && slot && m.data.grants.ads && fits)

   React.useEffect(() => {
      if (!show) return
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
   }, [show, slot, asPath])

   if (!show) return null

   return (
      <ins
         key={`${slot}:${asPath}`}
         className={`adsbygoogle block ${className ?? ""}`}
         data-ad-client={ADSENSE_CLIENT}
         data-ad-slot={slot}
         data-ad-format={format}
         data-full-width-responsive={media ? "false" : "true"}
      />
   )
}

export default AdSenseBanner
