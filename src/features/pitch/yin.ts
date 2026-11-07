/**
 * YIN pitch candidates, pYIN style (Mauch & Dixon 2014): the cumulative mean
 * normalised difference function (CMNDF) of one frame, its dips picked under a
 * beta-distributed spread of thresholds and turned into candidate probabilities.
 */
import { createRealFft } from "./fft"
import { hzToMidi } from "./notes"
import type { PitchCandidate } from "./types"

export const VOICE_MIN_HZ = 65
export const VOICE_MAX_HZ = 1100

/**
 * Window 2048 and hop 256 at 48 kHz, scaled with the rate. The window rounds up to a
 * power of two, so it never covers less time than at 48 kHz.
 */
export const voiceFraming = (sampleRate: number) => {
   const scale = sampleRate / 48000
   return {
      window: 2 ** Math.ceil(Math.log2(2048 * scale) - 1e-9),
      hop: Math.max(1, Math.round(256 * scale)),
   }
}

export interface YinOptions {
   sampleRate: number
   /** Analysis window; the difference function integrates over its first half. */
   window: number
   minHz?: number
   maxHz?: number
   /** Mean of the beta(2, b) threshold prior. pYIN's default is 0.15. */
   thresholdMean?: number
   /** Share of a threshold's prior given to the global minimum when no dip is under it. */
   noDipProbability?: number
   maxCandidates?: number
}

export interface YinResult {
   candidates: PitchCandidate[] // most probable first
   /** Sum of candidate probabilities, 0..1. */
   voicedProbability: number
   rms: number
}

export interface Yin {
   /** Samples analyze() reads: the integration length plus the longest lag (+2). */
   readonly span: number
   /** Integration length W of the difference function. */
   readonly integration: number
   readonly minLag: number
   readonly maxLag: number
   analyze(samples: Float32Array, offset?: number): YinResult
}

const THRESHOLDS = 100

/** CDF of beta(2, b): 1 - (1 - x)^b (1 + b x). */
const beta2Cdf = (x: number, b: number) => 1 - (1 - x) ** b * (1 + b * x)

export const createYin = (opts: YinOptions): Yin => {
   const { sampleRate, window: n } = opts
   const integration = n / 2
   const minLag = Math.max(2, Math.floor(sampleRate / (opts.maxHz ?? VOICE_MAX_HZ)))
   const maxLag = Math.min(
      integration - 2,
      Math.ceil(sampleRate / (opts.minHz ?? VOICE_MIN_HZ))
   )
   const span = integration + maxLag + 2
   const noDip = opts.noDipProbability ?? 0.01
   const maxCandidates = opts.maxCandidates ?? 8

   const mean = opts.thresholdMean ?? 0.15
   const betaB = 2 / mean - 2
   const thresholds = new Float64Array(THRESHOLDS)
   const prior = new Float64Array(THRESHOLDS)
   for (let i = 0; i < THRESHOLDS; i++) {
      thresholds[i] = (i + 1) / THRESHOLDS
      prior[i] = beta2Cdf(thresholds[i], betaB) - beta2Cdf(i / THRESHOLDS, betaB)
   }

   const fft = createRealFft(n)
   const head = new Float64Array(n) // x[0, W), then its spectrum
   const r = new Float64Array(n) // x[0, span), then the cross spectrum, then r(tau)
   const energy = new Float64Array(span + 1) // energy[i] = sum of x^2 over [0, i)
   const diff = new Float64Array(maxLag + 2)
   const cmndf = new Float64Array(maxLag + 2)
   const dipLag = new Float64Array(maxLag)
   const dipValue = new Float64Array(maxLag)
   const dipProb = new Float64Array(maxLag)

   const analyze = (samples: Float32Array, offset = 0): YinResult => {
      let sum = 0
      energy[0] = 0
      for (let i = 0; i < span; i++) {
         const x = samples[offset + i]
         sum += x * x
         energy[i + 1] = sum
      }
      const rms = Math.sqrt(sum / span)
      if (!(rms > 1e-6)) return { candidates: [], voicedProbability: 0, rms }

      // r(tau) = sum_{j<W} x_j x_{j+tau} by FFT: the inverse of conj(A) * B, with
      // A the spectrum of x[0, W) and B that of x[0, span).
      // No circular wrap: j + tau < W + maxLag + 2 <= n.
      for (let i = 0; i < n; i++) {
         head[i] = i < integration ? samples[offset + i] : 0
         r[i] = i < span ? samples[offset + i] : 0
      }
      fft.forward(head)
      fft.forward(r)
      // Packed layout (fft.ts): DC and Nyquist are real, in [0] and [1].
      r[0] *= head[0]
      r[1] *= head[1]
      for (let k = 2; k < n; k += 2) {
         const ar = head[k]
         const ai = head[k + 1]
         const br = r[k]
         const bi = r[k + 1]
         r[k] = ar * br + ai * bi
         r[k + 1] = ar * bi - ai * br
      }
      fft.inverse(r)

      const e0 = energy[integration]
      diff[0] = 0
      cmndf[0] = 1
      let running = 0
      for (let tau = 1; tau <= maxLag + 1; tau++) {
         const d = e0 + energy[tau + integration] - energy[tau] - 2 * r[tau]
         diff[tau] = d > 0 ? d : 0
         running += diff[tau]
         cmndf[tau] = running > 0 ? (diff[tau] * tau) / running : 1
      }

      // Dips in lag order, refined by parabolic interpolation: the lag on the raw
      // difference (unbiased by the cumulative mean), the value on the CMNDF.
      let dips = 0
      let globalMin = -1
      for (let tau = minLag; tau <= maxLag; tau++) {
         const b = cmndf[tau]
         if (!(b < cmndf[tau - 1] && b <= cmndf[tau + 1])) continue
         const da = diff[tau - 1]
         const db = diff[tau]
         const dc = diff[tau + 1]
         const curve = da - 2 * db + dc
         let delta = curve > 0 ? (0.5 * (da - dc)) / curve : 0
         if (delta > 0.5) delta = 0.5
         else if (delta < -0.5) delta = -0.5
         const a = cmndf[tau - 1]
         const c = cmndf[tau + 1]
         const value =
            b + (delta * (c - a)) / 2 + (delta * delta * (a - 2 * b + c)) / 2
         dipLag[dips] = tau + delta
         dipValue[dips] = value > 0 ? value : 0
         dipProb[dips] = 0
         if (globalMin < 0 || dipValue[dips] < dipValue[globalMin]) globalMin = dips
         dips++
      }
      if (dips === 0) return { candidates: [], voicedProbability: 0, rms }

      // Each threshold votes its prior for the first dip under it, or a small
      // share for the global minimum when no dip is under it.
      let first = 0
      for (let t = THRESHOLDS - 1; t >= 0; t--) {
         // Thresholds fall as t falls, so the first dip under it can only move later.
         while (first < dips && !(dipValue[first] < thresholds[t])) first++
         if (first < dips) dipProb[first] += prior[t]
         else dipProb[globalMin] += noDip * prior[t]
         if (first >= dips) {
            // Every lower threshold also has no dip under it.
            let rest = 0
            for (let u = t - 1; u >= 0; u--) rest += prior[u]
            dipProb[globalMin] += noDip * rest
            break
         }
      }

      const candidates: PitchCandidate[] = []
      let voicedProbability = 0
      for (let i = 0; i < dips; i++) {
         if (dipProb[i] <= 1e-6) continue
         candidates.push({
            midi: hzToMidi(sampleRate / dipLag[i]),
            probability: dipProb[i],
         })
      }
      candidates.sort((x, y) => y.probability - x.probability)
      if (candidates.length > maxCandidates) candidates.length = maxCandidates
      for (let i = 0; i < candidates.length; i++)
         voicedProbability += candidates[i].probability
      return { candidates, voicedProbability, rms }
   }

   return { span, integration, minLag, maxLag, analyze }
}
