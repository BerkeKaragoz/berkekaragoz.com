import { createRealFft } from "./fft"
import { midiToHz } from "./notes"
import type { PitchCandidate } from "./types"

/**
 * Harmonic evidence for the voice in a mix, from the spectrum of the window YIN
 * reads. Salience is subharmonic summation (Hermes 1988): the magnitudes at a
 * pitch's first HARMONICS harmonics, each worth DECAY times the one before.
 * The true pitch collects every harmonic; a pitch below it also sums the gaps
 * between them, and one above it misses the odd ones.
 *
 * Two uses:
 * - refine(): in a mix YIN often lands on the voice's 2nd, 3rd or 4th
 *   harmonic, or on a note below it. Each candidate moves to the relative (an
 *   octave, an octave and a fifth, or two octaves away) with the highest
 *   salience, if that beats its own by MARGIN.
 * - follow(): when YIN loses the voice under the instruments, its harmonics
 *   are often still among the strongest in the spectrum. The strongest pitch
 *   within FOLLOW_SEMITONES of the last one YIN found counts if it is in the
 *   top FOLLOW_RANK share of the frame's salience.
 */

const HARMONICS = 10
const DECAY = 0.84
const MARGIN = 1.15
const RELATIVES = [-24, -19, -12, 12, 19, 24]
const TOP_HZ = 5000
/** How far from a harmonic a peak may sit, as a fraction of its frequency (~17 cents). */
const TOLERANCE = 0.01
/** Salience is read on this grid, in semitones. */
const GRID = 0.25
const FOLLOW_SEMITONES = 0.5
const FOLLOW_RANK = 0.9

export interface HarmonicCheck {
   /** Reads the window at samples[offset] and returns its salience grid. */
   analyze(samples: Float32Array, offset: number): Float64Array
   /** The candidates of the window last analyzed, moved to their best relatives. */
   refine(candidates: PitchCandidate[]): PitchCandidate[]
   /** The pitch near `midi` the grid's harmonics still back, or null. */
   follow(grid: Float64Array, midi: number): number | null
}

export const createHarmonicCheck = (opts: {
   sampleRate: number
   window: number
   minMidi: number
   maxMidi: number
}): HarmonicCheck => {
   const { sampleRate, window, minMidi, maxMidi } = opts
   const size = 2 * window // zero-padded, for finer peaks
   const fft = createRealFft(size)
   const hann = new Float64Array(window)
   for (let n = 0; n < window; n++)
      hann[n] = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / window)
   const buffer = new Float64Array(size)
   const top = Math.min(size / 2 - 1, Math.floor((TOP_HZ * size) / sampleRate))
   const magnitude = new Float64Array(top + 1)
   const binHz = sampleRate / size
   const gridSize = Math.floor((maxMidi - minMidi) / GRID) + 1

   /** The strongest bin within TOLERANCE of hz. */
   const peakNear = (hz: number) => {
      const centre = hz / binHz
      const reach = Math.max(1, centre * TOLERANCE)
      const from = Math.max(1, Math.round(centre - reach))
      const to = Math.min(top, Math.round(centre + reach))
      let m = 0
      for (let k = from; k <= to; k++) if (magnitude[k] > m) m = magnitude[k]
      return m
   }

   const salience = (midi: number) => {
      const hz = midiToHz(midi)
      let sum = 0
      let weight = 1
      for (let h = 1; h <= HARMONICS && h * hz < TOP_HZ; h++) {
         sum += weight * peakNear(h * hz)
         weight *= DECAY
      }
      return sum
   }

   const analyze = (samples: Float32Array, offset: number) => {
      for (let n = 0; n < window; n++) buffer[n] = samples[offset + n] * hann[n]
      buffer.fill(0, window)
      fft.forward(buffer)
      for (let k = 1; k <= top; k++) {
         const re = buffer[2 * k]
         const im = buffer[2 * k + 1]
         magnitude[k] = Math.sqrt(re * re + im * im)
      }
      const grid = new Float64Array(gridSize)
      for (let r = 0; r < gridSize; r++) grid[r] = salience(minMidi + r * GRID)
      return grid
   }

   const refine = (candidates: PitchCandidate[]) =>
      candidates.map((candidate) => {
         let best = candidate.midi
         let bestSalience = salience(candidate.midi) * MARGIN
         for (let i = 0; i < RELATIVES.length; i++) {
            const midi = candidate.midi + RELATIVES[i]
            if (midi < minMidi || midi > maxMidi) continue
            const s = salience(midi)
            if (s > bestSalience) {
               best = midi
               bestSalience = s
            }
         }
         return best === candidate.midi ? candidate : { ...candidate, midi: best }
      })

   const follow = (grid: Float64Array, midi: number) => {
      const centre = Math.round((midi - minMidi) / GRID)
      const reach = Math.round(FOLLOW_SEMITONES / GRID)
      let best = -1
      for (let r = centre - reach; r <= centre + reach; r++)
         if (r >= 0 && r < gridSize && (best < 0 || grid[r] > grid[best])) best = r
      if (best < 0) return null
      let below = 0
      for (let r = 0; r < gridSize; r++) if (grid[r] < grid[best]) below++
      if (below < FOLLOW_RANK * gridSize) return null
      // Parabolic peak between the grid points either side.
      let shift = 0
      if (best > 0 && best < gridSize - 1) {
         const a = grid[best - 1]
         const b = grid[best]
         const c = grid[best + 1]
         const curve = a - 2 * b + c
         if (curve < 0)
            shift = Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / curve))
      }
      return minMidi + (best + shift) * GRID
   }

   return { analyze, refine, follow }
}
