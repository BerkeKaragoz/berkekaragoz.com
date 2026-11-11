// How much room an ad slot takes while its ad is on the way, and what happens
// to that room when no ad comes. Everything about it lives in this file, bar
// the height a responsive ad is held at (.ad-hold in google-consent.css): to
// drop it, render the ins in a plain <div className="ad-slot"> instead.

import React from "react"

/** The id startAds gives the adsbygoogle.js script element. */
const SCRIPT_ID = "consent-adsbygoogle"
/** How long AdSense may take to pick a slot up before it is given up. */
const PICK_UP_MS = 8000
/** How long a slot AdSense picked up may go without asking for an ad. */
const STALL_MS = 3000
/** How long an ad that was asked for may go unanswered. */
const ANSWER_MS = 8000
/** localStorage: "0" once AdSense stopped asking for ads, until one fills. */
const SERVING_KEY = "ads.serving"

/**
 * What a slot does with its room.
 * - held: kept for an ad that is expected, so the page doesn't move when it arrives
 * - shown: an ad filled it
 * - folded: no height and out of the page flow, but still there in case an ad comes late
 * - gone: no ad will come, so nothing is rendered
 */
type AdSpaceState ="held" | "shown" | "folded" | "gone"

/** Set once adsbygoogle.js fails to load, e.g. under an ad blocker. */
let scriptFailed = false

/**
 * Whether ads arrived the last time this browser asked. Room is held on that
 * assumption; where AdSense isn't serving (an account not approved yet), a
 * slot starts folded instead of flashing an empty box on every page.
 */
const wasServing = () => {
   try {
      return window.localStorage.getItem(SERVING_KEY) !== "0"
   } catch {
      return true
   }
}

const rememberServing = (serving: boolean) => {
   try {
      window.localStorage.setItem(SERVING_KEY, serving ? "1" : "0")
   } catch {
      // Storage is off: the assumption stays "ads arrive".
   }
}

/**
 * Follows the ad in `ins`. AdSense marks the ins when it picks the slot up
 * (data-adsbygoogle-status), asks for the ad through an iframe it puts inside,
 * and marks the answer (data-ad-status: filled or unfilled).
 */
const useAdSpace =(ins: React.RefObject<HTMLModElement | null>) => {
   const [state, setState] = React.useState<AdSpaceState>(() =>
      scriptFailed ? "gone" : wasServing() ? "held" : "folded"
   )

   React.useEffect(() => {
      const el = ins.current
      if (!el || scriptFailed) return
      let pickedUp = false
      const timers: number[] = []
      const later = (run: () => void, ms: number) => timers.push(window.setTimeout(run, ms))
      const answered = () => el.hasAttribute("data-ad-status")

      const read = () => {
         const ad = el.getAttribute("data-ad-status")
         if (ad === "filled") {
            rememberServing(true)
            setState("shown")
         } else if (ad === "unfilled") {
            setState("gone")
         } else if (!pickedUp && el.hasAttribute("data-adsbygoogle-status")) {
            pickedUp = true
            later(() => {
               if (answered()) return
               if (el.querySelector("iframe")) {
                  // Asked for; give the answer its time.
                  later(() => {
                     if (!answered()) setState("folded")
                  }, ANSWER_MS - STALL_MS)
               } else {
                  // Never asked for: AdSense isn't serving this site.
                  rememberServing(false)
                  setState("folded")
               }
            }, STALL_MS)
         }
      }
      read()
      const observer = new MutationObserver(read)
      observer.observe(el, {
         attributes: true,
         attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
      })

      const script = document.getElementById(SCRIPT_ID)
      const fail = () => {
         scriptFailed = true
         setState("gone")
      }
      script?.addEventListener("error", fail)
      later(() => {
         if (!pickedUp) setState("gone")
      }, PICK_UP_MS)

      return () => {
         observer.disconnect()
         script?.removeEventListener("error", fail)
         timers.forEach((id) => window.clearTimeout(id))
      }
   }, [ins])

   return state
}

type AdSpaceProps = {
   /** The slot's ins element; it must be the one rendered in `children`. */
   ins: React.RefObject<HTMLModElement | null>
   /** Spacing around the ad, applied while its room is held or filled. */
   className?: string
   /** The ad's height in px when it is fixed. Without it the ad is responsive. */
   height?: number
   children: React.ReactNode
}

/**
 * Wraps a slot's ins and gives it room. The ins itself always keeps its own
 * size and the slot's full width, since AdSense reads both from there; these
 * wrappers decide whether that size shows. Folded, the outer div has nothing
 * in the page flow, so the margins around it collapse as if it weren't there.
 */
const AdSpace: React.FC<AdSpaceProps> = (props) => {
   const { ins, className, height, children } = props
   const state = useAdSpace(ins)

   if (state === "gone") return null
   const kept = state === "held" || state === "shown"
   // A fixed ad holds its own height; a responsive one holds what AdSense
   // will give it (.ad-hold in google-consent.css).
   const hold = state === "held" && height === undefined ? "ad-hold" : ""
   return (
      <div
         className={`ad-slot ${kept ? (className ?? "") : "relative"} ${hold}`}
         style={state === "held" && height !== undefined ? { minHeight: height } : undefined}
      >
         <div className={kept ? undefined : "absolute inset-x-0 top-0 h-0 overflow-clip"}>
            {children}
         </div>
      </div>
   )
}

export default AdSpace
