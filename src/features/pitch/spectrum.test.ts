/** @jest-environment node */
import { hzToMidi } from "./notes"
import {
   createSpectrum,
   SPECTRUM_LOWEST,
   SPECTRUM_ROWS_PER_SEMITONE,
} from "./spectrum"
import { createRandom, harmonicAmplitudes, silence, tone } from "./testSignals"
import type { SpectrumFrame } from "./types"

const RATE = 48000

const framesOf = (signal: Float32Array) => {
   const spectrum = createSpectrum("song", RATE)
   const frames: SpectrumFrame[] = []
   for (let i = 0; i < signal.length; i += 512)
      frames.push(...spectrum.push(signal.subarray(i, i + 512), i))
   return frames
}

const rowOf = (hz: number) =>
   Math.round((hzToMidi(hz) - SPECTRUM_LOWEST) * SPECTRUM_ROWS_PER_SEMITONE)

describe("the spectrum", () => {
   it("peaks on a note's row and its harmonics', and is dim between them", () => {
      const harmonics = harmonicAmplitudes(4)
      const noise = createRandom(3)
      const signal = tone({ hz: 220, seconds: 1, harmonics, amplitude: 0.2 }).map(
         (v) => v + 0.002 * (2 * noise() - 1)
      )
      const frames = framesOf(signal)
      expect(frames.length).toBeGreaterThan(20)
      const values = frames[frames.length >> 1].values
      const at = (hz: number) => values[rowOf(hz)]
      expect(at(220)).toBeGreaterThan(245)
      expect(at(440)).toBeGreaterThan(at(415))
      expect(at(440)).toBeGreaterThan(at(466))
      // A semitone either side, and a tritone between the harmonics.
      expect(at(208)).toBeLessThan(at(220) - 50)
      expect(at(233)).toBeLessThan(at(220) - 50)
      expect(at(311)).toBeLessThan(at(220) - 100)
   })

   it("stays empty for silence", () => {
      framesOf(silence({ seconds: 0.5 })).forEach((frame) =>
         expect(Math.max.apply(null, Array.from(frame.values))).toBe(0)
      )
   })
})
