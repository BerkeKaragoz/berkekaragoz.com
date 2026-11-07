/** @jest-environment node */
import { hzToMidi } from "./notes"
import { createSongAnalyzer } from "./song"
import { harmonicAmplitudes, tone } from "./testSignals"
import type { PitchFrame } from "./types"

const RATE = 48000
const BLOCK = 512

const feed = (left: Float32Array, right?: Float32Array, startFrame = 0) => {
   const analyzer = createSongAnalyzer(RATE)
   const frames: PitchFrame[] = []
   for (let i = 0; i < left.length; i += BLOCK)
      frames.push(
         ...analyzer.push(
            left.subarray(i, i + BLOCK),
            startFrame + i,
            right?.subarray(i, i + BLOCK)
         )
      )
   return frames
}

/** Median midi of the voiced frames after the first half second. */
const settledMidi = (frames: PitchFrame[]) => {
   const voiced = frames
      .filter((f) => f.time > 0.5 && f.midi !== null)
      .map((f) => f.midi as number)
      .sort((a, b) => a - b)
   expect(voiced.length).toBeGreaterThan(50)
   return voiced[voiced.length >> 1]
}

const add = (a: Float32Array, b: Float32Array) => a.map((v, i) => v + b[i])

describe("createSongAnalyzer", () => {
   const harmonics = harmonicAmplitudes(6)
   const voice = tone({ hz: 330, seconds: 2, harmonics, amplitude: 0.2 })

   it("tracks a centred voice under a louder instrument panned to one side", () => {
      const guitar = tone({ hz: 220, seconds: 2, harmonics, amplitude: 0.5 })
      const silent = new Float32Array(guitar.length)
      const frames = feed(add(voice, guitar), add(voice, silent))
      expect(frames.every((f) => f.source === "song")).toBe(true)
      expect(settledMidi(frames)).toBeCloseTo(hzToMidi(330), 0)
   })

   it("drops the centred bass", () => {
      const bass = tone({ hz: 55, seconds: 2, harmonics: [1, 0.3], amplitude: 0.6 })
      const both = add(voice, bass)
      expect(settledMidi(feed(both, both))).toBeCloseTo(hzToMidi(330), 0)
   })

   it("tracks mono input, on the input's clock", () => {
      const start = 4800
      const frames = feed(voice, undefined, start)
      expect(settledMidi(frames.map((f) => ({ ...f, time: f.time - start / RATE })))).toBeCloseTo(
         hzToMidi(330),
         0
      )
      expect(frames[0].time).toBeGreaterThanOrEqual(start / RATE)
   })
})
