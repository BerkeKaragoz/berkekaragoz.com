/**
 * Fixed-lag Viterbi pitch tracker over 10-cent states plus one unvoiced state,
 * fed by YIN candidates, gated by RMS with hysteresis, then a short median.
 */
import type { PitchCandidate } from "./types"

export interface TrackerOptions {
   minMidi: number
   maxMidi: number
   binCents?: number // default 10
   /** Hops between a frame entering the Viterbi and its state being committed. */
   lagFrames?: number // default 8
   /** Odd length of the median on committed pitch; 1 turns it off. */
   medianFrames?: number // default 5
   maxStepSemitones?: number // per hop, default 2.5
   switchProbability?: number // voiced <-> unvoiced, default 0.01
   /** The gate opens at or above gateOnDb and closes below gateOffDb (frame RMS, dBFS). */
   gateOnDb?: number // default -55
   gateOffDb?: number // default -60
   /** Weight of the unvoiced observation (1 - voiced probability) against a pitch bin's. */
   unvoicedWeight?: number // default 0.1
}

export interface TrackerInput {
   candidates: PitchCandidate[]
   /** RMS of the analysed signal; it drives the gate. */
   rms: number
   /** RMS to report as the frame's level when it differs from `rms` (the song's raw mix). */
   level?: number
}

export interface TrackedFrame {
   /** Index of the input frame (0 = first push after creation or reset). */
   index: number
   midi: number | null
   confidence: number
   /** RMS level of the frame, dBFS. */
   db: number
}

export interface Tracker {
   /** Frames between pushing frame k and receiving it: lagFrames + median half-length. */
   readonly delay: number
   push(input: TrackerInput): TrackedFrame[]
   reset(): void
}

/** Lowest level reported, dBFS; digital silence would otherwise be about -240. */
export const LEVEL_FLOOR_DB = -100
/** Where the gate opens unless the options say otherwise, dBFS. */
export const DEFAULT_GATE_ON_DB = -55
const levelDb = (rms: number) =>
   Math.max(LEVEL_FLOOR_DB, 20 * Math.log10(rms + 1e-12))
const OBSERVATION_FLOOR = 1e-3
const GATED = Math.log(1e-8)
/** A committed pitch takes the nearest candidate's exact value within this distance. */
const SNAP_SEMITONES = 0.2

interface Committed {
   midi: number | null
   confidence: number
   db: number
}

export const createTracker = (opts: TrackerOptions): Tracker => {
   const binSize = (opts.binCents ?? 10) / 100
   const lag = Math.max(0, Math.round(opts.lagFrames ?? 8))
   const medianFrames = Math.max(1, Math.round(opts.medianFrames ?? 5)) | 1
   const medianHalf = (medianFrames - 1) / 2
   const reach = Math.round((opts.maxStepSemitones ?? 2.5) / binSize)
   const switchP = opts.switchProbability ?? 0.01
   const gateOn = opts.gateOnDb ?? DEFAULT_GATE_ON_DB
   const gateOff = opts.gateOffDb ?? -60
   const unvoicedWeight = opts.unvoicedWeight ?? 0.1

   const bins = Math.floor((opts.maxMidi - opts.minMidi) / binSize) + 1
   const unvoiced = bins
   const states = bins + 1
   const binMidi = (b: number) => opts.minMidi + b * binSize

   const logStay = Math.log(1 - switchP)
   const logSwitch = Math.log(switchP)
   // Triangular step weights, 1 for staying on a bin (an unnormalised cost, so a
   // voiced path is not penalised against the single unvoiced state for spreading).
   const logStep = new Float64Array(reach + 1)
   for (let d = 0; d <= reach; d++) logStep[d] = Math.log(1 - d / (reach + 1))
   const logFloor = Math.log(OBSERVATION_FLOOR)

   let prev = new Float64Array(states)
   let cur = new Float64Array(states)
   const observation = new Float64Array(bins)
   const mass = new Float64Array(bins)
   const ring = lag + 1
   const back = new Int32Array(ring * states)
   const inputs: PitchCandidate[][] = new Array(ring)
   const levels = new Float64Array(ring)
   const history: Committed[] = []

   let frame = 0
   let gateOpen = false

   const reset = () => {
      prev.fill(-Infinity)
      prev[unvoiced] = 0
      frame = 0
      gateOpen = false
      history.length = 0
   }
   reset()

   const observe = (input: TrackerInput) => {
      const db = levelDb(input.rms)
      gateOpen = gateOpen ? db >= gateOff : db >= gateOn
      if (!gateOpen) {
         observation.fill(GATED)
         return 0
      }
      observation.fill(logFloor)
      let voiced = 0
      const { candidates } = input
      for (let i = 0; i < candidates.length; i++) {
         const b = Math.round((candidates[i].midi - opts.minMidi) / binSize)
         if (b < 0 || b >= bins) continue
         mass[b] = 0
      }
      for (let i = 0; i < candidates.length; i++) {
         const b = Math.round((candidates[i].midi - opts.minMidi) / binSize)
         if (b < 0 || b >= bins) continue
         mass[b] += candidates[i].probability
         voiced += candidates[i].probability
         observation[b] = Math.log(mass[b] + OBSERVATION_FLOOR)
      }
      return Math.log(unvoicedWeight * Math.max(0, 1 - voiced) + OBSERVATION_FLOOR)
   }

   const step = (input: TrackerInput, unvoicedObservation: number) => {
      const offset = (frame % ring) * states
      let fromVoiced = -Infinity
      let fromVoicedBin = 0
      for (let i = 0; i < bins; i++) {
         if (prev[i] > fromVoiced) {
            fromVoiced = prev[i]
            fromVoicedBin = i
         }
      }
      const fromUnvoiced = prev[unvoiced] + logSwitch
      let best = -Infinity
      for (let j = 0; j < bins; j++) {
         let score = fromUnvoiced
         let arg = unvoiced
         const lo = j - reach < 0 ? 0 : j - reach
         const hi = j + reach >= bins ? bins - 1 : j + reach
         for (let i = lo; i <= hi; i++) {
            const s = prev[i] + logStay + logStep[i > j ? i - j : j - i]
            if (s > score) {
               score = s
               arg = i
            }
         }
         cur[j] = score + observation[j]
         back[offset + j] = arg
         if (cur[j] > best) best = cur[j]
      }
      const stayUnvoiced = prev[unvoiced] + logStay
      const toUnvoiced = fromVoiced + logSwitch
      if (stayUnvoiced >= toUnvoiced) {
         cur[unvoiced] = stayUnvoiced + unvoicedObservation
         back[offset + unvoiced] = unvoiced
      } else {
         cur[unvoiced] = toUnvoiced + unvoicedObservation
         back[offset + unvoiced] = fromVoicedBin
      }
      if (cur[unvoiced] > best) best = cur[unvoiced]
      for (let j = 0; j < states; j++) cur[j] -= best
      inputs[frame % ring] = input.candidates
      levels[frame % ring] = levelDb(input.level ?? input.rms)
      const swap = prev
      prev = cur
      cur = swap
      frame++
   }

   /** The best path's state `lag` frames back from the newest frame. */
   const commit = (): Committed => {
      let state = 0
      for (let j = 1; j < states; j++) if (prev[j] > prev[state]) state = j
      const newest = frame - 1
      for (let k = newest; k > newest - lag; k--)
         state = back[(k % ring) * states + state]
      const db = levels[(newest - lag) % ring]
      if (state === unvoiced) return { midi: null, confidence: 0, db }
      const centre = binMidi(state)
      const candidates = inputs[(newest - lag) % ring]
      let midi = centre
      let nearest = SNAP_SEMITONES
      let confidence = 0
      for (let i = 0; i < candidates.length; i++) {
         const distance = Math.abs(candidates[i].midi - centre)
         if (distance <= nearest) {
            nearest = distance
            midi = candidates[i].midi
         }
         if (distance <= 0.5) confidence += candidates[i].probability
      }
      return { midi, confidence: Math.min(1, confidence), db }
   }

   /** Median over the frame's voiced run within ±medianHalf frames. */
   const smooth = (centreIndex: number): TrackedFrame => {
      const centre = history[centreIndex]
      const index = frame - 1 - lag - (history.length - 1 - centreIndex)
      if (centre.midi === null || medianHalf === 0)
         return {
            index,
            midi: centre.midi,
            confidence: centre.confidence,
            db: centre.db,
         }
      const values: number[] = [centre.midi]
      for (let k = centreIndex - 1; k >= centreIndex - medianHalf && k >= 0; k--) {
         const m = history[k].midi
         if (m === null) break
         values.push(m)
      }
      for (let k = centreIndex + 1; k <= centreIndex + medianHalf; k++) {
         const m = history[k].midi
         if (m === null) break
         values.push(m)
      }
      values.sort((a, b) => a - b)
      const mid = values.length >> 1
      const midi =
         values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2
      return { index, midi, confidence: centre.confidence, db: centre.db }
   }

   const push = (input: TrackerInput): TrackedFrame[] => {
      step(input, observe(input))
      if (frame <= lag) return []
      history.push(commit())
      if (history.length > medianFrames) history.shift()
      const centreIndex = history.length - 1 - medianHalf
      if (centreIndex < 0) return []
      return [smooth(centreIndex)]
   }

   return { delay: lag + medianHalf, push, reset }
}
