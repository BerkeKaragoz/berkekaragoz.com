import { createRealFft, type RealFft } from "./fft"
import type { Source, SpectrumFrame } from "./types"

/**
 * One source's spectrogram on the graph's scale: C2 to C6, four rows per
 * semitone, so the frequency axis matches the note grid.
 *
 * Every ~32 ms each row reads the FFT magnitude at its frequency. Low notes
 * are a few Hz apart, so they are read from a long window (~170 ms); higher
 * ones from shorter windows centred on the same moment, so they stay sharp in
 * time. The windows are zero-padded to twice their length, and each row is
 * interpolated between the two bins around it, the same way for every row.
 *
 * Levels are plain dB, from RANGE_DB under the source's recent peak (0) to the
 * peak (255), so a quiet tab and a loud one look alike. A curve (GAMMA) keeps
 * the noise floor near clear and gives most of the colour to the loud parts.
 */

export const SPECTRUM_LOWEST = 36
export const SPECTRUM_HIGHEST = 84
export const SPECTRUM_ROWS_PER_SEMITONE = 4
export const SPECTRUM_ROWS =
   (SPECTRUM_HIGHEST - SPECTRUM_LOWEST) * SPECTRUM_ROWS_PER_SEMITONE + 1

const LONG_SECONDS = 0.16
const HOP_SECONDS = 0.032
/** A row uses the shortest window with at least this many bins per semitone. */
const BINS_PER_SEMITONE = 1.5
/** dB under the recent peak that still shows. */
const RANGE_DB = 50
/** Curve on the level, so the floor fades out and the loud parts take the colour. */
const GAMMA = 3
/** How fast the recent peak falls, in dB per second. */
const PEAK_FALL_DB = 6
/** A peak quieter than this counts as this, so near-silence stays dark. */
const QUIETEST_PEAK_DB = -50

export interface Spectrum {
   /** Left (or mono) samples, and the right channel when the tab is stereo. */
   push(
      samples: Float32Array,
      startFrame: number,
      right?: Float32Array
   ): SpectrumFrame[]
   reset(): void
}

interface Window {
   size: number
   fft: RealFft
   hann: Float64Array
   /** Twice the window, zero-padded. */
   buffer: Float64Array
   /** dB per padded bin, up to the highest row's. */
   db: Float64Array
}

const midiHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

export const createSpectrum = (source: Source, sampleRate: number): Spectrum => {
   let long = 256
   while (long < LONG_SECONDS * sampleRate) long *= 2
   const hop = Math.round(HOP_SECONDS * sampleRate)
   const highestHz = midiHz(SPECTRUM_HIGHEST + 1)

   const windows: Window[] = [long / 4, long / 2, long].map((size) => {
      const hann = new Float64Array(size)
      for (let n = 0; n < size; n++)
         hann[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / size)
      return {
         size,
         fft: createRealFft(2 * size),
         hann,
         buffer: new Float64Array(2 * size),
         db: new Float64Array(Math.ceil((highestHz * 2 * size) / sampleRate) + 2),
      }
   })

   // Per row: the shortest window that resolves it, and where it falls in its bins.
   const rowWindow = new Int32Array(SPECTRUM_ROWS)
   const position = new Float64Array(SPECTRUM_ROWS)
   for (let r = 0; r < SPECTRUM_ROWS; r++) {
      const hz = midiHz(SPECTRUM_LOWEST + r / SPECTRUM_ROWS_PER_SEMITONE)
      const semitoneHz = hz * (Math.pow(2, 1 / 12) - 1)
      let w = 0
      while (
         w < windows.length - 1 &&
         semitoneHz / (sampleRate / windows[w].size) < BINS_PER_SEMITONE
      )
         w++
      rowWindow[r] = w
      position[r] = (hz * 2 * windows[w].size) / sampleRate
   }

   const input = new Float64Array(long)
   let filled = 0
   /** Absolute sample of input[0]; null until the first block after a reset. */
   let start: number | null = null
   let peak = -Infinity

   const reset = () => {
      filled = 0
      start = null
      peak = -Infinity
   }

   const frame = (out: SpectrumFrame[]) => {
      windows.forEach((w) => {
         // Centred in the long window, so every row describes the same moment.
         const offset = (long - w.size) / 2
         for (let n = 0; n < w.size; n++) w.buffer[n] = input[offset + n] * w.hann[n]
         w.buffer.fill(0, w.size)
         w.fft.forward(w.buffer)
         // Scaled so a full-scale sine peaks at 0 dB.
         for (let k = 1; k < w.db.length; k++) {
            const re = w.buffer[2 * k]
            const im = w.buffer[2 * k + 1]
            w.db[k] =
               20 * Math.log10((4 / w.size) * Math.sqrt(re * re + im * im) + 1e-12)
         }
      })

      const db = new Float64Array(SPECTRUM_ROWS)
      let loudest = -Infinity
      for (let r = 0; r < SPECTRUM_ROWS; r++) {
         const bins = windows[rowWindow[r]].db
         const i = Math.floor(position[r])
         const t = position[r] - i
         db[r] = bins[i] * (1 - t) + bins[i + 1] * t
         if (db[r] > loudest) loudest = db[r]
      }

      const dt = hop / sampleRate
      peak = Math.max(loudest, peak - PEAK_FALL_DB * dt)
      const top = Math.max(peak, QUIETEST_PEAK_DB)
      const values = new Uint8Array(SPECTRUM_ROWS)
      for (let r = 0; r < SPECTRUM_ROWS; r++) {
         const v = (db[r] - (top - RANGE_DB)) / RANGE_DB
         values[r] = Math.round(255 * Math.pow(Math.min(1, Math.max(0, v)), GAMMA))
      }
      out.push({
         source,
         time: ((start as number) + long / 2) / sampleRate,
         duration: dt,
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
         if (++filled === long) frame(out)
      }
      return out
   }

   return { push, reset }
}
