// Measures how long a tool is really in use: whatever the tool counts as use
// is happening and the page is in view. A visit that reaches the goal counts
// as a successful one.

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
 * Calls `onGoal` once `isActive` has held, with the page in view, for the goal
 * time. `onGoal` returns whether it could report; if not, it is asked again
 * each tick. Returns a cleanup.
 */
export const watchActiveUse = (
   isActive: () => boolean,
   onGoal: () => boolean
) => {
   const timer = createActiveUseTimer()
   const id = setInterval(() => {
      const active = isActive() && document.visibilityState === "visible"
      if (timer.tick(Date.now(), active) && onGoal()) clearInterval(id)
   }, TICK_MS)
   return () => clearInterval(id)
}
