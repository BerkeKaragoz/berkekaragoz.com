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
   /** Applied to the ad itself, so spacing only exists when an ad does. */
   className?: string
}

/**
 * One AdSense ad unit. It renders only once the visitor has allowed ads
 * (src/features/consent), so before that, or without consent, it takes no
 * space. It asks for a new ad on every page, including client-side navigation.
 */
const AdSenseBanner: React.FC<AdSenseBannerProps> = (props) => {
   const { slot, format = "auto", className } = props
   const m = useConsentMachine()
   const { asPath } = useRouter()
   const show = Boolean(ADSENSE_CLIENT && slot && m.data.grants.ads)

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
         data-full-width-responsive="true"
      />
   )
}

export default AdSenseBanner
