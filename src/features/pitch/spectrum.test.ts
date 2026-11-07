/** @jest-environment node */
import { hzToMidi } from "./notes"
import {
   createSpectrum,
   SPECTRUM_LOWEST,
   SPECTRUM_ROWS_PER_SEMITONE,
} from "./spectrum"
import { harmonicAmplitudes, silence, tone } from "./testSignals"
import type { SpectrumFrame } from "./types"

const RATE = 48000

const framesOf = (signal: Float32Array) => {
   const spectrum = createSpectrum("song", RATE)
   const frames: SpectrumFrame[] = []
   for (let i = 0; i < signal.length; i += 512)
      frames.push(...spectrum.push(signal.subarray(i, i + 512), i))
   return frames
}

const midiOfRow = (row: number) => SPECTRUM_LOWEST + row / SPECTRUM_ROWS_PER_SEMITONE

describe("the spectrum", () => {
   it("shows a note's fundamental and harmonics on their rows, and nothing for silence", () => {
      const frames = framesOf(
         tone({
            hz: 220,
            seconds: 1,
            harmonics: harmonicAmplitudes(4),
            amplitude: 0.03,
         })
      )
      expect(frames.length).toBeGreaterThan(25)
      const values = frames[frames.length >> 1].values
      let loudest = 0
      for (let r = 1; r < values.length; r++)
         if (values[r] > values[loudest]) loudest = r
      expect(midiOfRow(loudest)).toBeCloseTo(hzToMidi(220), 0)
      const octave = Math.round(
         (hzToMidi(440) - SPECTRUM_LOWEST) * SPECTRUM_ROWS_PER_SEMITONE
      )
      const between = Math.round(
         (hzToMidi(311) - SPECTRUM_LOWEST) * SPECTRUM_ROWS_PER_SEMITONE
      )
      expect(values[octave]).toBeGreaterThan(values[between] + 60)
      framesOf(silence({ seconds: 0.5 })).forEach((frame) =>
         expect(Math.max.apply(null, Array.from(frame.values))).toBe(0)
      )
   })
})
