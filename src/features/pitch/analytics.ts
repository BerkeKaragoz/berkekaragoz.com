// The GA4 event for the pitch graph. It goes out at most once per visit, and
// its name is also set in GA4.

import { sendAnalyticsEvent } from "@/features/consent/google"
import { watchActiveUse } from "@/lib/utils/activeUse"
import type { PitchEngine } from "./types"

const PITCH_EVENTS = {
   /** Two minutes of the mic or a shared tab running with the page in view. */
   activeUse: "pitch_active_2min",
} as const

/** Sends `pitch_active_2min` once `engine` has been in use for two minutes. Returns a cleanup. */
export const watchPitchActiveUse = (engine: Pick<PitchEngine, "getState">) =>
   watchActiveUse(
      () => {
         const { mic, tab } = engine.getState()
         return mic === "on" || tab === "on"
      },
      () => sendAnalyticsEvent(PITCH_EVENTS.activeUse)
   )
