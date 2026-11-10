// Measures how long the tool is really in use: the mic or a shared tab is
// running and the page is in view. A visit that reaches the goal counts as a
// successful one.

import type { PitchEngine } from "./types"

/** Use that counts as a successful visit. */
export const ACTIVE_USE_GOAL_MS = 2 * 60 * 1000

const TICK_MS = 1000

/** A longer gap between ticks means the tab was throttled or asleep, so only this much of it counts. */
const MAX_TICK_MS = 2 * TICK_MS

/** Adds up active time across ticks. */
export const createActiveUseTimer = (goalMs = ACTIVE_USE_GOAL_MS) => {
   let total = 0
   let last: number | null = null
   return {
      /** Call about once a second. Returns true once the goal is reached. */
      tick(now: number, active: boolean) {
         if (active && last !== null) total += Math.min(now - last, MAX_TICK_MS)
         last = active ? now : null
         return total >= goalMs
      },
   }
}

/**
 * Calls `onGoal` once the engine has been in use for the goal time. `onGoal`
 * returns whether it could report; if not, it is asked again each tick.
 * Returns a cleanup.
 */
export const watchActiveUse = (
   engine: Pick<PitchEngine, "getState">,
   onGoal: () => boolean
) => {
   const timer = createActiveUseTimer()
   const id = setInterval(() => {
      const { mic, tab } = engine.getState()
      const active =
         (mic === "on" || tab === "on") && document.visibilityState === "visible"
      if (timer.tick(Date.now(), active) && onGoal()) clearInterval(id)
   }, TICK_MS)
   return () => clearInterval(id)
}
