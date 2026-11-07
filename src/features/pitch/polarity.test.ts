/** @jest-environment node */
import { createPolarity } from "./polarity"
import { tone } from "./testSignals"

const RATE = 48000
const BLOCK = 128

/** The right blocks polarity hands on for one second of `left` and `right`. */
const run = (left: Float32Array, right: Float32Array) => {
   const polarity = createPolarity(RATE)
   const out: Float32Array[] = []
   for (let i = 0; i + BLOCK <= left.length; i += BLOCK)
      out.push(
         polarity.fix(left.subarray(i, i + BLOCK), right.subarray(i, i + BLOCK))
      )
   return out
}

describe("polarity", () => {
   const voice = tone({ hz: 220, seconds: 1 })

   it("inverts the right channel back when it is inverted", () => {
      const blocks = run(
         voice,
         voice.map((v) => -v)
      )
      // The last block handed on matches the left channel, not its inverse.
      const start = (blocks.length - 1) * BLOCK
      expect(blocks[blocks.length - 1][10]).toBeCloseTo(voice[start + 10], 6)
   })

   it("leaves a normal stereo pair alone", () => {
      const right = voice.map((v) => 0.8 * v)
      const blocks = run(voice, right)
      expect(blocks[blocks.length - 1][10]).toBeCloseTo(
         0.8 * voice[(blocks.length - 1) * BLOCK + 10],
         6
      )
   })
})
