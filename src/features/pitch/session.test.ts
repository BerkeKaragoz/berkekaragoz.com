/** @jest-environment node */
import { createSession } from "./session"
import type { PitchFrame, Source } from "./types"

const HOP = 0.005

/** Frames every 5 ms from `from` (inclusive) to `to` (exclusive). */
const frames = (
   source: Source,
   from: number,
   to: number,
   midi: number | null | ((t: number) => number | null)
): PitchFrame[] => {
   const out: PitchFrame[] = []
   const n = Math.round((to - from) / HOP)
   for (let i = 0; i < n; i++) {
      const time = from + i * HOP
      out.push({
         source,
         time,
         midi: typeof midi === "function" ? midi(time) : midi,
         confidence: 1,
      })
   }
   return out
}

describe("targetAt", () => {
   it("is the note nearest the voice, whatever the song does", () => {
      const s = createSession()
      s.addFrames(frames("song", 0, 1, 64.4))
      s.addFrames(frames("voice", 0, 1, 66.6))
      expect(s.targetAt(0.5)).toBe(67)
      s.addFrames(frames("voice", 1, 2, null))
      expect(s.targetAt(1.5)).toBeNull()
   })
})

describe("alignedEdge", () => {
   it("follows the mic while it runs, so the tab line trails", () => {
      const s = createSession()
      s.setActive({ voice: true, song: true })
      s.addFrames(frames("song", 0, 1.5, 60))
      expect(s.alignedEdge()).toBeNull()
      s.addFrames(frames("voice", 0, 2, 60))
      expect(s.alignedEdge()).toBeCloseTo(1.995)
   })

   it("follows the tab when the mic is off", () => {
      const s = createSession()
      s.setActive({ voice: false, song: true })
      s.addFrames(frames("song", 0, 1.5, 60))
      expect(s.alignedEdge()).toBeCloseTo(1.495)
   })
})

describe("score", () => {
   it("scores voice frames against their nearest note without waiting for the song", () => {
      const s = createSession()
      s.setActive({ voice: true, song: true })
      s.addFrames(frames("voice", 0, 1, 60.05)) // 5 cents off C4
      s.addFrames(frames("voice", 1, 2, 61.3)) // 30 cents off C#4
      const score = s.score()
      expect(score.voiced).toBe(400)
      expect(score.inTune).toBe(200)
      expect(score.percent).toBe(50)
   })
})
