import { ACTIVE_USE_GOAL_MS, createActiveUseTimer } from "./activeUse"

const SECOND = 1000

/** Ticks once a second from `from` for `seconds`, returning the last result. */
const run = (
   timer: ReturnType<typeof createActiveUseTimer>,
   from: number,
   seconds: number,
   active: boolean
) => {
   let reached = false
   for (let i = 0; i <= seconds; i++) reached = timer.tick(from + i * SECOND, active)
   return reached
}

describe("createActiveUseTimer", () => {
   it("reaches the goal after two minutes of use", () => {
      const timer = createActiveUseTimer()
      expect(run(timer, 0, 119, true)).toBe(false)
      expect(timer.tick(120 * SECOND, true)).toBe(true)
   })

   it("does not count time while nothing is running", () => {
      const timer = createActiveUseTimer()
      expect(run(timer, 0, 600, false)).toBe(false)
   })

   it("adds up use across pauses, without counting the pauses", () => {
      const timer = createActiveUseTimer()
      expect(run(timer, 0, 60, true)).toBe(false)
      // Ten minutes off, then on again: the gap adds nothing.
      expect(run(timer, 61 * SECOND, 600, false)).toBe(false)
      expect(run(timer, 700 * SECOND, 59, true)).toBe(false)
      expect(timer.tick(760 * SECOND, true)).toBe(true)
   })

   it("counts a throttled gap as two seconds at most", () => {
      const timer = createActiveUseTimer()
      timer.tick(0, true)
      expect(timer.tick(ACTIVE_USE_GOAL_MS, true)).toBe(false)
   })
})
