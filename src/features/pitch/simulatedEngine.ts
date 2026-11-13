import {
   SPECTRUM_LOWEST,
   SPECTRUM_ROWS,
   SPECTRUM_ROWS_PER_SEMITONE,
} from "./spectrum"
import type {
   EngineState,
   PitchEngine,
   PitchFrame,
   Source,
   SpectrumFrame,
} from "./types"

/** Analysis hop of the real analyzers at 48 kHz. */
const HOP = 256 / 48000
const TICK_MS = 16
const LATENCY: Record<Source, number> = { voice: 0.075, song: 0.12 }
/** Output step of the real spectrum at 48 kHz. */
const SPECTRUM_STEP = 0.032
/** The backing: one chord per 2 s, under the melody (C, Am, F, G). */
const CHORDS = [
   [48, 55, 60, 64],
   [45, 57, 60, 64],
   [41, 53, 57, 60],
   [43, 55, 59, 62],
]
/** How late the simulated singer follows the song. */
const VOICE_LAG = 0.18

/** [midi, seconds]; null is a rest. Loops. */
const MELODY: [number | null, number][] = [
   [64, 0.45],
   [67, 0.45],
   [69, 0.9],
   [67, 0.45],
   [64, 0.45],
   [62, 1.2],
   [null, 1.1],
   [60, 0.45],
   [62, 0.45],
   [64, 0.7],
   [65, 0.25],
   [64, 0.45],
   [62, 0.45],
   [60, 1.5],
   [null, 1.4],
   [67, 0.35],
   [69, 0.35],
   [71, 0.35],
   [72, 1.1],
   [71, 0.45],
   [69, 0.45],
   [67, 1.6],
   [null, 1.6],
]

interface Segment {
   midi: number | null
   start: number
   end: number
   /** Previous note when it ends right where this one starts (a glide). */
   from: number | null
   glide: number
}

const SEGMENTS: Segment[] = []
let melodyLength = 0
MELODY.forEach(([midi, seconds], i) => {
   const prev = i > 0 ? MELODY[i - 1][0] : null
   SEGMENTS.push({
      midi,
      start: melodyLength,
      end: melodyLength + seconds,
      from: prev,
      // 50..150 ms, varied per note
      glide: 0.05 + ((i * 37) % 101) / 1000,
   })
   melodyLength += seconds
})

/** Deterministic noise in -1..1 for an integer key. */
const hashNoise = (key: number) => {
   let x = (key | 0) ^ 0x9e3779b9
   x = Math.imul(x ^ (x >>> 16), 0x85ebca6b)
   x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
   x ^= x >>> 16
   return ((x >>> 0) / 0xffffffff) * 2 - 1
}

/** Smooth noise in -1..1 over time, `rate` changes per second. */
const smoothNoise = (t: number, rate: number, seed: number) => {
   const x = t * rate
   const i = Math.floor(x)
   const f = x - i
   const s = f * f * (3 - 2 * f)
   return hashNoise(i * 7919 + seed) * (1 - s) + hashNoise((i + 1) * 7919 + seed) * s
}

const smoothstep = (x: number) => {
   const c = Math.min(1, Math.max(0, x))
   return c * c * (3 - 2 * c)
}

/** The song's melody at time t: glides, scoops, vibrato that fades in. */
const songMidiAt = (t: number): number | null => {
   if (t < 0) return null
   const local = t % melodyLength
   let seg = SEGMENTS[SEGMENTS.length - 1]
   for (let i = 0; i < SEGMENTS.length; i++) {
      if (local < SEGMENTS[i].end) {
         seg = SEGMENTS[i]
         break
      }
   }
   if (seg.midi === null) return null
   const since = local - seg.start
   let midi = seg.midi
   if (seg.from !== null) {
      // Glide from the previous note.
      midi = seg.from + (seg.midi - seg.from) * smoothstep(since / seg.glide)
   } else {
      // Scoop up from below at a phrase start.
      const p = Math.min(1, since / 0.14)
      midi = seg.midi - 0.7 * (1 - p) * (1 - p)
   }
   const length = seg.end - seg.start
   if (length >= 0.6) {
      const depth = 0.35 * smoothstep((since - 0.3) / 0.4)
      midi += depth * Math.sin(2 * Math.PI * 5.5 * since)
   }
   return midi
}

/** The singer: follows the song late, drifting in time and pitch. */
const voiceMidiAt = (t: number): number | null => {
   const lag = VOICE_LAG + 0.04 * smoothNoise(t, 0.4, 11)
   const target = songMidiAt(t - lag)
   if (target === null) return null
   const drift = 0.22 * smoothNoise(t, 0.25, 23) + 0.08 * smoothNoise(t, 2, 37)
   return target + drift
}

/** Level in dBFS of the melody at time t: a note swells in, peaks, fades out; rests are room noise. */
const melodyDbAt = (t: number, seed: number): number => {
   const local = ((t % melodyLength) + melodyLength) % melodyLength
   const i = SEGMENTS.findIndex((seg) => local < seg.end)
   const seg = SEGMENTS[i < 0 ? SEGMENTS.length - 1 : i]
   const room = -68 + 2 * smoothNoise(t, 6, seed + 3)
   if (seg.midi === null) return room
   const length = seg.end - seg.start
   const since = local - seg.start
   // Each note has its own loudness, -34..-16 dBFS, with a slow wobble.
   const peak = -25 + 9 * hashNoise(i * 31 + seed) + 1.5 * smoothNoise(t, 3, seed)
   const attack = smoothstep(since / 0.08)
   // The last 40% fades, a long note also swells towards the middle.
   const release = 1 - smoothstep((since / length - 0.6) / 0.4)
   const swell = 3 * Math.sin((Math.PI * since) / length)
   const level = peak + swell - 30 * (1 - release)
   return room + (level - room) * attack
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Levels per row: each sounding note's harmonics, louder low ones first, over a faint floor. */
const simulatedSpectrum = (source: Source, time: number) => {
   const values = new Uint8Array(SPECTRUM_ROWS).fill(40)
   const add = (midi: number, level: number) => {
      for (let h = 1; h <= 8; h++) {
         const centre =
            (midi + 12 * Math.log2(h) - SPECTRUM_LOWEST) * SPECTRUM_ROWS_PER_SEMITONE
         const peak = level - 50 * Math.log2(h)
         // Spread over about a semitone, like a real window's peak.
         for (
            let d = -SPECTRUM_ROWS_PER_SEMITONE;
            d <= SPECTRUM_ROWS_PER_SEMITONE;
            d++
         ) {
            const row = Math.round(centre) + d
            if (row < 0 || row >= SPECTRUM_ROWS) continue
            const v =
               peak - (40 * Math.abs(row - centre)) / SPECTRUM_ROWS_PER_SEMITONE
            values[row] = Math.max(values[row], Math.max(0, Math.round(v)))
         }
      }
   }
   if (source === "voice") {
      const midi = voiceMidiAt(time)
      if (midi !== null) add(midi, 230)
   } else {
      CHORDS[Math.floor(time / 2) % CHORDS.length].forEach((midi) => add(midi, 170))
      const midi = songMidiAt(time)
      if (midi !== null) add(midi, 240)
   }
   return values
}

/** A PitchEngine with no audio: a simulated song and a singer following it. */
export const createSimulatedEngine = (): PitchEngine => {
   const startedAt = performance.now()
   const now = () => (performance.now() - startedAt) / 1000

   let state: EngineState = {
      mic: "off",
      tab: "off",
      latency: { ...LATENCY },
      warnings: [],
   }
   const frameListeners = new Set<(frames: PitchFrame[]) => void>()
   const spectrumListeners = new Set<(frames: SpectrumFrame[]) => void>()
   const nextSpectrum: Record<Source, number> = { voice: 0, song: 0 }
   const stateListeners = new Set<(state: EngineState) => void>()
   /** Index of the next hop to emit per source, null while off. */
   const next: Record<Source, number | null> = { voice: null, song: null }
   let timer: ReturnType<typeof setInterval> | null = null
   let disposed = false

   /** Read through a call: TypeScript would keep a narrowing across awaits. */
   const current = (): EngineState => state

   const setState = (patch: Partial<EngineState>) => {
      state = { ...state, ...patch }
      stateListeners.forEach((cb) => cb(state))
   }

   const tick = () => {
      const t = now()
      const frames: PitchFrame[] = []
      const sources: Source[] = ["voice", "song"]
      sources.forEach((source) => {
         let hop = next[source]
         if (hop === null) return
         const until = t - LATENCY[source]
         for (; hop * HOP <= until; hop++) {
            const time = hop * HOP
            const midi = source === "voice" ? voiceMidiAt(time) : songMidiAt(time)
            const jitter = midi === null ? 0 : 0.03 * hashNoise(hop * 2 + 1)
            frames.push({
               source,
               time,
               midi: midi === null ? null : midi + jitter,
               confidence: midi === null ? 0.1 : 0.9,
               db: melodyDbAt(
                  source === "voice" ? time - VOICE_LAG : time,
                  source === "voice" ? 5 : 9
               ),
            })
         }
         next[source] = hop
      })
      if (frames.length) frameListeners.forEach((cb) => cb(frames))

      const spectra: SpectrumFrame[] = []
      sources.forEach((source) => {
         if (next[source] === null) return
         let i = nextSpectrum[source]
         for (; i * SPECTRUM_STEP <= t - LATENCY[source]; i++) {
            const time = i * SPECTRUM_STEP
            spectra.push({
               source,
               time,
               duration: SPECTRUM_STEP,
               values: simulatedSpectrum(source, time),
            })
         }
         nextSpectrum[source] = i
      })
      if (spectra.length) spectrumListeners.forEach((cb) => cb(spectra))
   }

   const run = () => {
      if (timer === null && !disposed) timer = setInterval(tick, TICK_MS)
   }

   const stopIfIdle = () => {
      if (timer !== null && next.voice === null && next.song === null) {
         clearInterval(timer)
         timer = null
      }
   }

   const start = (source: Source) => {
      next[source] = Math.ceil(now() / HOP)
      nextSpectrum[source] = Math.ceil(now() / SPECTRUM_STEP)
      run()
   }

   const stop = (source: Source) => {
      next[source] = null
      stopIfIdle()
   }

   const subscribe = <T>(set: Set<T>, cb: T) => {
      set.add(cb)
      return () => {
         set.delete(cb)
      }
   }

   return {
      enableMic: async () => {
         if (state.mic === "on" || state.mic === "starting") return
         setState({ mic: "starting" })
         await wait(250)
         if (disposed || current().mic !== "starting") return
         start("voice")
         setState({ mic: "on" })
      },
      disableMic: () => {
         stop("voice")
         setState({ mic: "off" })
      },
      shareTab: async () => {
         if (state.tab === "on" || state.tab === "starting") return
         setState({ tab: "starting" })
         await wait(600)
         if (disposed || current().tab !== "starting") return
         start("song")
         setState({ tab: "on" })
      },
      stopTab: () => {
         stop("song")
         setState({ tab: "off" })
      },
      now,
      onFrames: (cb) => subscribe(frameListeners, cb),
      onSpectrum: (cb) => subscribe(spectrumListeners, cb),
      onState: (cb) => subscribe(stateListeners, cb),
      getState: () => state,
      dispose: () => {
         disposed = true
         next.voice = null
         next.song = null
         stopIfIdle()
         frameListeners.clear()
         spectrumListeners.clear()
         stateListeners.clear()
      },
   }
}
