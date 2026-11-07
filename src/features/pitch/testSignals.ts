/**
 * Deterministic test signals for the pitch analyzers. Imported only by tests.
 *
 * Every generator returns a mono Float32Array at `sampleRate` (default 48 kHz).
 * Pitch is given as fractional midi (69 = A4 = 440 Hz); a curve returning null
 * means silence at that time.
 */
import { hzToMidi, midiToHz } from "./notes"

export const DEFAULT_SAMPLE_RATE = 48000

export type MidiCurve = (t: number) => number | null

interface Length {
   seconds: number
   sampleRate?: number
}

interface Voice {
   /** Linear amplitude per harmonic; [0] is the fundamental. Default [1]. */
   harmonics?: number[]
   /** The harmonic amplitudes are scaled to sum to this (a peak bound). Default 0.5. */
   amplitude?: number
   /** Onset and release ramp when the curve turns voiced or silent. Default 5 ms. */
   fadeSeconds?: number
}

export const dbToGain = (db: number) => 10 ** (db / 20)

/** Seeded PRNG (mulberry32), uniform in [0, 1). */
export const createRandom = (seed: number) => {
   let state = seed >>> 0
   return () => {
      state = (state + 0x6d2b79f5) >>> 0
      let x = state
      x = Math.imul(x ^ (x >>> 15), x | 1)
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296
   }
}

/** Amplitudes 1, 1/2, 1/3, ... for `count` harmonics. */
export const harmonicAmplitudes = (count: number) =>
   Array.from({ length: count }, (_, i) => 1 / (i + 1))

const sampleCount = ({ seconds, sampleRate = DEFAULT_SAMPLE_RATE }: Length) =>
   Math.round(seconds * sampleRate)

/**
 * A harmonic tone, at a fixed `hz` or following `midiCurve`. Harmonics above
 * Nyquist are skipped. Phase is continuous across pitch changes and silences.
 */
export const tone = (
   opts: Length & Voice & ({ hz: number } | { midiCurve: MidiCurve })
): Float32Array => {
   const sampleRate = opts.sampleRate ?? DEFAULT_SAMPLE_RATE
   const harmonics = opts.harmonics ?? [1]
   const total = harmonics.reduce((sum, a) => sum + Math.abs(a), 0) || 1
   const scale = (opts.amplitude ?? 0.5) / total
   const fadeSeconds = opts.fadeSeconds ?? 0.005
   const envStep = fadeSeconds > 0 ? 1 / (fadeSeconds * sampleRate) : Infinity
   const curve: MidiCurve = "hz" in opts ? () => hzToMidi(opts.hz) : opts.midiCurve
   const nyquist = sampleRate / 2

   const out = new Float32Array(sampleCount(opts))
   let phase = 0
   let env = 0
   let hz = 0
   for (let i = 0; i < out.length; i++) {
      const midi = curve(i / sampleRate)
      if (midi !== null) hz = midiToHz(midi)
      const target = midi === null ? 0 : 1
      env =
         env < target
            ? Math.min(target, env + envStep)
            : Math.max(target, env - envStep)
      if (env > 0 && hz > 0) {
         let sum = 0
         for (let h = 0; h < harmonics.length && (h + 1) * hz < nyquist; h++) {
            sum += harmonics[h] * Math.sin((h + 1) * phase)
         }
         out[i] = scale * env * sum
      }
      phase += (2 * Math.PI * hz) / sampleRate
      if (phase > 2 * Math.PI) phase -= 2 * Math.PI
   }
   return out
}

/** Sinusoidal vibrato of ±depthCents around midi, optionally fading in from t = 0. */
export const vibratoCurve =
   (o: {
      midi: number
      depthCents: number
      rateHz: number
      fadeInSeconds?: number
   }) =>
   (t: number) => {
      const fade = o.fadeInSeconds ? Math.min(1, t / o.fadeInSeconds) : 1
      return (
         o.midi + (o.depthCents / 100) * fade * Math.sin(2 * Math.PI * o.rateHz * t)
      )
   }

export const vibrato = (
   opts: Length &
      Voice & {
         midi: number
         depthCents: number
         rateHz: number
         fadeInSeconds?: number
      }
) => tone({ ...opts, midiCurve: vibratoCurve(opts) })

/** Holds fromMidi, moves linearly (in midi) to toMidi over [start, start + duration]. */
export const glideCurve =
   (o: {
      fromMidi: number
      toMidi: number
      startSeconds: number
      glideSeconds: number
   }) =>
   (t: number) => {
      const u = Math.min(1, Math.max(0, (t - o.startSeconds) / o.glideSeconds))
      return o.fromMidi + (o.toMidi - o.fromMidi) * u
   }

/** A glide centred in the signal unless startSeconds is given. */
export const glide = (
   opts: Length &
      Voice & {
         fromMidi: number
         toMidi: number
         glideSeconds: number
         startSeconds?: number
      }
) =>
   tone({
      ...opts,
      midiCurve: glideCurve({
         ...opts,
         startSeconds: opts.startSeconds ?? (opts.seconds - opts.glideSeconds) / 2,
      }),
   })

/** White noise with an RMS level of `dbfs` (uniform distribution). */
export const noise = (opts: Length & { seed: number; dbfs: number }) => {
   const random = createRandom(opts.seed)
   const peak = dbToGain(opts.dbfs) * Math.sqrt(3)
   const out = new Float32Array(sampleCount(opts))
   for (let i = 0; i < out.length; i++) out[i] = (random() * 2 - 1) * peak
   return out
}

export const silence = (opts: Length) => new Float32Array(sampleCount(opts))

/** Sums signals, each a bare signal (0 dB) or [signal, gainDb]. Length of the longest. */
export const mix = (...parts: (Float32Array | [Float32Array, number])[]) => {
   const tracks = parts.map((p) => (Array.isArray(p) ? p : ([p, 0] as const)))
   const out = new Float32Array(Math.max(0, ...tracks.map(([s]) => s.length)))
   for (const [signal, db] of tracks) {
      const gain = dbToGain(db)
      for (let i = 0; i < signal.length; i++) out[i] += signal[i] * gain
   }
   return out
}

/** Joins signals end to end. */
export const concat = (...signals: Float32Array[]) => {
   const out = new Float32Array(signals.reduce((n, s) => n + s.length, 0))
   let offset = 0
   for (const s of signals) {
      out.set(s, offset)
      offset += s.length
   }
   return out
}

export interface MelodyNote {
   midi: number | null // null = rest
   seconds: number
}

export interface MelodyOptions extends Voice {
   sampleRate?: number
   /** Samples per ground-truth step. Default 256 at 48 kHz, scaled with the rate. */
   hop?: number
   /** Glide from the previous voiced note, at the start of a note. Default 80 ms. */
   glideSeconds?: number
   /** A note after a rest starts this far below and rises. Default 60 cents. */
   scoopCents?: number
   scoopSeconds?: number // default 70 ms
   vibratoCents?: number // depth (±), default 40
   vibratoHz?: number // default 5.5
   vibratoDelaySeconds?: number // from note start, default 250 ms
   vibratoFadeSeconds?: number // fade-in after the delay, default 300 ms
}

export interface Melody {
   signal: Float32Array
   sampleRate: number
   hop: number
   /** Ground-truth midi at time hop * i / sampleRate; null where the line rests. */
   truth: (number | null)[]
   /** Ground-truth midi at any time in seconds. */
   midiAt: MidiCurve
}

const smoothstep = (u: number) => u * u * (3 - 2 * u)

/**
 * A sung-like line: glides between consecutive notes, scoops from below after a
 * rest, vibrato that fades in on held notes. Defaults to 10 harmonics at 1/h.
 */
export const melodyLine = (
   notes: MelodyNote[],
   opts: MelodyOptions = {}
): Melody => {
   const sampleRate = opts.sampleRate ?? DEFAULT_SAMPLE_RATE
   const hop = opts.hop ?? Math.round((256 * sampleRate) / DEFAULT_SAMPLE_RATE)
   const glideSeconds = opts.glideSeconds ?? 0.08
   const scoopCents = opts.scoopCents ?? 60
   const scoopSeconds = opts.scoopSeconds ?? 0.07
   const vibratoCents = opts.vibratoCents ?? 40
   const vibratoHz = opts.vibratoHz ?? 5.5
   const vibratoDelay = opts.vibratoDelaySeconds ?? 0.25
   const vibratoFade = opts.vibratoFadeSeconds ?? 0.3

   const starts: number[] = []
   let total = 0
   for (const note of notes) {
      starts.push(total)
      total += note.seconds
   }

   const midiAt: MidiCurve = (t) => {
      if (t < 0 || t >= total) return null
      let i = starts.length - 1
      while (i > 0 && starts[i] > t) i--
      const midi = notes[i].midi
      if (midi === null) return null
      const local = t - starts[i]
      const prev = i > 0 ? notes[i - 1].midi : null

      let base = midi
      if (prev !== null && local < glideSeconds) {
         base = prev + (midi - prev) * smoothstep(local / glideSeconds)
      } else if (prev === null && local < scoopSeconds) {
         base = midi - (scoopCents / 100) * (1 - smoothstep(local / scoopSeconds))
      }

      const v = local - vibratoDelay
      if (v <= 0 || vibratoCents === 0) return base
      const depth = (vibratoCents / 100) * Math.min(1, v / vibratoFade)
      return base + depth * Math.sin(2 * Math.PI * vibratoHz * v)
   }

   const signal = tone({
      seconds: total,
      sampleRate,
      harmonics: opts.harmonics ?? harmonicAmplitudes(10),
      amplitude: opts.amplitude,
      fadeSeconds: opts.fadeSeconds,
      midiCurve: midiAt,
   })
   const truth: (number | null)[] = []
   for (let i = 0; i * hop < signal.length; i++)
      truth.push(midiAt((i * hop) / sampleRate))

   return { signal, sampleRate, hop, truth, midiAt }
}
