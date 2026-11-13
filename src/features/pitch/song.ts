import { createRealFft } from "./fft"
import type { PitchFrame } from "./types"
import { createVoiceAnalyzer } from "./voice"

/**
 * Song pitch: the lead vocal of a stereo mix, tracked like the mic.
 *
 * Lead vocals are mixed to the centre, while guitars, keys, backing vocals and
 * reverb spread to the sides. Each STFT bin whose left and right match in level
 * and phase is kept, the rest fade out, and so does everything below CUT_HZ, which
 * takes the bass, also centred. The rebuilt signal goes through the voice
 * analyzer. Mono input has no sides to remove and only loses the bass.
 */

/** Below this, bins are the bass's, not the voice's: YIN finds the voice from its harmonics. */
const CUT_HZ = 150
/** Left/right similarity (1 = centred) below which a bin is dropped; full above 1. */
const SIDE_SIMILARITY = 0.6
/** About 40 ms windows, a quarter window apart. */
const WINDOW_SECONDS = 0.04
/** Sum of squared Hann windows a quarter window apart. */
const OVERLAP_GAIN = 1.5

export interface SongAnalyzer {
   /** Seconds from a sample entering to its frame being returned. */
   readonly latency: number
   /** Left (or mono) samples, and the right channel when the tab is stereo. */
   push(
      samples: Float32Array,
      startFrame: number,
      right?: Float32Array
   ): PitchFrame[]
   reset(): void
}

export const createSongAnalyzer = (sampleRate: number): SongAnalyzer => {
   let size = 256
   while (size < WINDOW_SECONDS * sampleRate) size *= 2
   const hop = size / 4
   const voice = createVoiceAnalyzer(sampleRate, "song", { harmonicCheck: true })
   const fft = createRealFft(size)
   const hann = new Float64Array(size)
   for (let n = 0; n < size; n++)
      hann[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)
   const cutBin = Math.ceil((CUT_HZ * size) / sampleRate)

   const left = new Float64Array(size)
   const right = new Float64Array(size)
   const a = new Float64Array(size)
   const b = new Float64Array(size)
   const sum = new Float64Array(size) // overlap-add of the rebuilt centre
   const block = new Float32Array(hop)
   /** The raw mix of the same hop, for the level: sqrt((L² + R²) / 2) per sample. */
   const levelBlock = new Float32Array(hop)
   let filled = 0
   /** Absolute sample of left[0]; null until the first block after a reset. */
   let start: number | null = null

   const reset = () => {
      filled = 0
      start = null
      sum.fill(0)
      voice.reset()
   }

   const frame = (out: PitchFrame[]) => {
      for (let n = 0; n < size; n++) {
         a[n] = left[n] * hann[n]
         b[n] = right[n] * hann[n]
      }
      fft.forward(a)
      fft.forward(b)
      a[0] = 0 // DC
      a[1] = 0 // Nyquist
      for (let k = 1; k < size / 2; k++) {
         const lr = a[2 * k]
         const li = a[2 * k + 1]
         const rr = b[2 * k]
         const ri = b[2 * k + 1]
         let keep = 0
         if (k >= cutBin) {
            const similarity =
               (2 * (lr * rr + li * ri)) /
               (lr * lr + li * li + rr * rr + ri * ri + 1e-20)
            keep = Math.min(
               1,
               Math.max(0, (similarity - SIDE_SIMILARITY) / (1 - SIDE_SIMILARITY))
            )
         }
         a[2 * k] = (keep * (lr + rr)) / 2
         a[2 * k + 1] = (keep * (li + ri)) / 2
      }
      fft.inverse(a)
      for (let n = 0; n < size; n++) sum[n] += (a[n] * hann[n]) / OVERLAP_GAIN
      // The first hop has every window it will get: hand it to the tracker.
      for (let n = 0; n < hop; n++) {
         block[n] = sum[n]
         levelBlock[n] = Math.sqrt((left[n] * left[n] + right[n] * right[n]) / 2)
      }
      const frames = voice.push(block, start as number, levelBlock)
      for (let i = 0; i < frames.length; i++) out.push(frames[i])
      sum.copyWithin(0, hop)
      sum.fill(0, size - hop)
      left.copyWithin(0, hop)
      right.copyWithin(0, hop)
      filled -= hop
      start = (start as number) + hop
   }

   const push = (
      samples: Float32Array,
      startFrame: number,
      rightIn?: Float32Array
   ) => {
      if (rightIn && rightIn.length !== samples.length)
         throw new Error("left and right blocks differ in length")
      if (start !== null && startFrame !== start + filled) reset()
      if (start === null) start = startFrame
      const out: PitchFrame[] = []
      for (let i = 0; i < samples.length; i++) {
         left[filled] = samples[i]
         right[filled] = rightIn ? rightIn[i] : samples[i]
         if (++filled === size) frame(out)
      }
      return out
   }

   return { latency: voice.latency + size / sampleRate, push, reset }
}
