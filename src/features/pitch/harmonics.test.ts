/** @jest-environment node */
import { createHarmonicCheck } from "./harmonics"
import { hzToMidi } from "./notes"
import { harmonicAmplitudes, tone } from "./testSignals"

const RATE = 48000
const WINDOW = 2048

describe("the harmonic check", () => {
   const check = createHarmonicCheck({
      sampleRate: RATE,
      window: WINDOW,
      minMidi: hzToMidi(65),
      maxMidi: hzToMidi(1100),
   })
   const signal = tone({ hz: 220, seconds: 0.2, harmonics: harmonicAmplitudes(8) })
   const a3 = hzToMidi(220)
   const grid = check.analyze(signal, 0)

   it("moves a candidate an octave off back to the voice", () => {
      const refined = check.refine([
         { midi: a3 - 12, probability: 0.5 },
         { midi: a3 + 12, probability: 0.3 },
         { midi: a3, probability: 0.2 },
      ])
      refined.forEach((c) => expect(c.midi).toBeCloseTo(a3, 5))
   })

   it("follows the voice near the last pitch, not far from it", () => {
      expect(check.follow(grid, a3 + 0.3)).toBeCloseTo(a3, 0)
      expect(check.follow(grid, a3 + 6)).toBeNull()
   })
})
