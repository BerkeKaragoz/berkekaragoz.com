import { consentMachine } from "@/features/consent/consent"
import React from "react"

export const CONSENT_SLOT_ID = "consent-slot"

/**
 * Where our banner appears on a page whose `consent.placement` is "inline",
 * e.g. between a post's paragraphs. Empty until the banner opens. Google's
 * message never goes here: TCF requires it to cover the page.
 */
const ConsentSlot: React.FC<{ className?: string }> = (props) => {
   React.useEffect(() => {
      consentMachine.event.slotMounted()
      return () => consentMachine.event.slotUnmounted()
   }, [])

   return <div id={CONSENT_SLOT_ID} className={props.className} />
}

export default ConsentSlot
