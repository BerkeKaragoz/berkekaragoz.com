import { createRealFft } from "./fft"
import type { Source, SpectrumFrame } from "./types"

/**
 * A plain spectrum of one source on the graph's pitch scale: every ~32 ms, the
 * level of an ~85 ms window per row from C2 to C6, in dB mapped to 0..255.
 */

const WINDOW_SECONDS = 0.08
export const SPECTRUM_LOWEST = 36
export const SPECTRUM_HIGHEST = 84
export const SPECTRUM_ROWS_PER_SEMITONE = 4
export const SPECTRUM_ROWS =
   (SPECTRUM_HIGHEST - SPECTRUM_LOWEST) * SPECTRUM_ROWS_PER_SEMITONE + 1
/** dBFS shown as empty and as full. */
const FLOOR_DB = -80
const TOP_DB = -20

export interface Spectrum {
   /** Left (or mono) samples, and the right channel when the tab is stereo. */
   push(
      samples: Float32Array,
      startFrame: number,
      right?: Float32Array
   ): SpectrumFrame[]
   reset(): void
}

export const createSpectrum = (source: Source, sampleRate: number): Spectrum => {
   let size = 256
   while (size < WINDOW_SECONDS * sampleRate) size *= 2
   const hop = (size * 3) / 8
   const half = size / 2
   const fft = createRealFft(size)
   const hann = new Float64Array(size)
   for (let n = 0; n < size; n++)
      hann[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)

   // Each row's FFT bins: from..to inclusive, or one fractional bin to
   // interpolate where the rows are narrower than the bins.
   const from = new Int32Array(SPECTRUM_ROWS)
   const to = new Int32Array(SPECTRUM_ROWS)
   const centre = new Float64Array(SPECTRUM_ROWS)
   const binOf = (midi: number) =>
      (440 * Math.pow(2, (midi - 69) / 12) * size) / sampleRate
   for (let r = 0; r < SPECTRUM_ROWS; r++) {
      const midi = SPECTRUM_LOWEST + r / SPECTRUM_ROWS_PER_SEMITONE
      const edge = 0.5 / SPECTRUM_ROWS_PER_SEMITONE
      from[r] = Math.ceil(binOf(midi - edge))
      to[r] = Math.min(half - 1, Math.floor(binOf(midi + edge)))
      centre[r] = binOf(midi)
   }

   const input = new Float64Array(size)
   const buffer = new Float64Array(size)
   const magnitude = new Float64Array(half)
   let filled = 0
   /** Absolute sample of input[0]; null until the first block after a reset. */
   let start: number | null = null

   const reset = () => {
      filled = 0
      start = null
   }

   const frame = (out: SpectrumFrame[]) => {
      for (let n = 0; n < size; n++) buffer[n] = input[n] * hann[n]
      fft.forward(buffer)
      // Scaled so a full-scale sine peaks at 1 (0 dBFS).
      for (let k = 1; k < half; k++) {
         const re = buffer[2 * k]
         const im = buffer[2 * k + 1]
         magnitude[k] = (4 / size) * Math.sqrt(re * re + im * im)
      }
      const values = new Uint8Array(SPECTRUM_ROWS)
      for (let r = 0; r < SPECTRUM_ROWS; r++) {
         let m = 0
         if (from[r] <= to[r]) {
            for (let k = from[r]; k <= to[r]; k++)
               if (magnitude[k] > m) m = magnitude[k]
         } else {
            const i = Math.floor(centre[r])
            const t = centre[r] - i
            m = magnitude[i] * (1 - t) + magnitude[i + 1] * t
         }
         const db = 20 * Math.log10(m + 1e-12)
         const v = (db - FLOOR_DB) / (TOP_DB - FLOOR_DB)
         values[r] = Math.round(255 * Math.min(1, Math.max(0, v)))
      }
      out.push({
         source,
         time: ((start as number) + size / 2) / sampleRate,
         duration: hop / sampleRate,
         values,
      })
      input.copyWithin(0, hop)
      filled -= hop
      start = (start as number) + hop
   }

   const push = (
      samples: Float32Array,
      startFrame: number,
      right?: Float32Array
   ) => {
      if (right && right.length !== samples.length)
         throw new Error("left and right blocks differ in length")
      if (start !== null && startFrame !== start + filled) reset()
      if (start === null) start = startFrame
      const out: SpectrumFrame[] = []
      for (let i = 0; i < samples.length; i++) {
         input[filled] = right ? (samples[i] + right[i]) / 2 : samples[i]
         if (++filled === size) frame(out)
      }
      return out
   }

   return { push, reset }
}
