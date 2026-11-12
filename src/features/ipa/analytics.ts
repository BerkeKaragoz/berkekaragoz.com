// GA4 events for the IPA tool. Each is sent at most once per visit: the page
// stays mounted when its two tabs swap, so a tab switch is not a new visit.
// The names are also set in GA4.

import { sendAnalyticsEvent } from "@/features/consent/google"
import { watchActiveUse } from "@/lib/utils/activeUse"
import { useCallback, useEffect, useRef } from "react"

export const IPA_EVENTS = {
   /** Text the visitor asked to convert was converted (not the example on entry). */
   convert: "ipa_convert",
   /** A sound or word clip played, or text was read aloud. */
   listen: "ipa_listen",
   /** Two minutes of use with the page in view; see `useIpaEvents`. */
   activeUse: "ipa_active_2min",
} as const

type IpaEvent = (typeof IPA_EVENTS)[keyof typeof IPA_EVENTS]

/** A click, key or scroll this recent counts as use, so reading a result does too. */
const IDLE_AFTER_MS = 30 * 1000

const INPUT_EVENT_TYPES = ["pointerdown", "keydown", "scroll"] as const

/**
 * Sends `ipa_active_2min` once the visitor has clicked, typed, scrolled or
 * listened for two minutes with the page in view, and `ipa_listen` when
 * speech starts. Returns trackers for what only the page sees.
 */
export const useIpaEvents = (isSpeaking: boolean) => {
   const sent = useRef(new Set<IpaEvent>())
   const speaking = useRef(isSpeaking)

   /** Sends `name` unless it went out already; retried on the next call while analytics is off. */
   const sendOnce = useCallback((name: IpaEvent) => {
      if (sent.current.has(name)) return
      if (sendAnalyticsEvent(name)) sent.current.add(name)
   }, [])

   useEffect(() => {
      speaking.current = isSpeaking
      if (isSpeaking) sendOnce(IPA_EVENTS.listen)
   }, [isSpeaking, sendOnce])

   useEffect(() => {
      let lastInput = -Infinity
      const markInput = () => {
         lastInput = Date.now()
      }
      // Capture, so scrolls inside the page's own scroll areas count too.
      const options = { capture: true, passive: true }
      const stopListening = () =>
         INPUT_EVENT_TYPES.forEach((type) =>
            window.removeEventListener(type, markInput, options)
         )
      INPUT_EVENT_TYPES.forEach((type) =>
         window.addEventListener(type, markInput, options)
      )
      const stopWatching = watchActiveUse(
         () => speaking.current || Date.now() - lastInput < IDLE_AFTER_MS,
         () => {
            const reported = sendAnalyticsEvent(IPA_EVENTS.activeUse)
            if (reported) stopListening()
            return reported
         }
      )
      return () => {
         stopWatching()
         stopListening()
      }
   }, [])

   return {
      /** A conversion the visitor asked for succeeded. */
      trackConvert: () => sendOnce(IPA_EVENTS.convert),
      /** A sound or word clip played; speech is tracked from `isSpeaking`. */
      trackListen: () => sendOnce(IPA_EVENTS.listen),
   }
}
