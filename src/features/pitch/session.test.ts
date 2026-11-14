/** @jest-environment node */
import { createSession } from "./session"
import type { PitchFrame, Source } from "./types"

const HOP = 0.005

/** Frames every 5 ms from `from` (inclusive) to `to` (exclusive). */
const frames = (
   source: Source,
   from: number,
   to: number,
   midi: number | null | ((t: number) => number | null),
   db: number | ((t: number) => number) = -30
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
         db: typeof db === "function" ? db(time) : db,
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

describe("readout", () => {
   it("reads the mic while it runs, even with a tab shared", () => {
      const s = createSession()
      s.setActive({ voice: true, song: true })
      s.addFrames(frames("song", 0, 1, 64.2, -10))
      s.addFrames(frames("voice", 0, 1, 66.9, -20))
      expect(s.readout()).toMatchObject({
         source: "voice",
         target: 67,
         db: -20,
      })
   })

   it("reads the tab while the mic is off", () => {
      const s = createSession()
      s.setActive({ voice: false, song: true })
      s.addFrames(frames("voice", 0, 1, 66.9, -20))
      s.addFrames(frames("song", 0, 1, 64.2, -10))
      const r = s.readout()
      expect(r).toMatchObject({ source: "song", target: 64, db: -10 })
      expect(r.midi).toBeCloseTo(64.2)
      expect(r.cents).toBeCloseTo(20)
   })

   it("is empty with nothing running", () => {
      const s = createSession()
      s.addFrames(frames("song", 0, 1, 64.2))
      expect(s.readout()).toMatchObject({ source: null, midi: null, db: null })
   })
})

describe("levels", () => {
   it("carries db with unvoiced frames too", () => {
      const s = createSession()
      s.addFrames(frames("voice", 0, 0.1, null, -50))
      s.addFrames(frames("voice", 0.1, 0.2, 60, -20))
      const seen: [number | null, number][] = []
      s.forEachFrame("voice", 0, 1, (_, midi, db) => seen.push([midi, db]))
      expect(seen[0]).toEqual([null, -50])
      expect(seen[seen.length - 1]).toEqual([60, -20])
      expect(s.latestLevel("voice")).toBe(-20)
      expect(s.latestLevel("song")).toBeNull()
   })

   it("drops levels together with frames", () => {
      const s = createSession({ windowSeconds: 1 })
      // Long enough that the dropped frames are cut off the arrays, which is
      // when the two tracks' indices would part if only one were cut.
      s.addFrames(frames("voice", 0, 10, 60, (t) => -t))
      let first = Infinity
      s.forEachFrame("voice", 0, 20, (time, _, db) => {
         first = Math.min(first, time)
         expect(db).toBeCloseTo(-time)
      })
      expect(first).toBeGreaterThan(7.9)
   })

   it("shows no level from the last run once the mic is back on", () => {
      const s = createSession()
      s.setActive({ voice: true, song: false })
      s.addFrames(frames("voice", 0, 1, 60, -15))
      expect(s.readout().db).toBe(-15)
      s.setActive({ voice: false, song: false })
      s.setActive({ voice: true, song: false })
      expect(s.latestLevel("voice")).toBeNull()
      expect(s.readout().db).toBeNull()
      s.addFrames(frames("voice", 1, 2, 60, -40))
      expect(s.latestLevel("voice")).toBe(-40)
   })
})
