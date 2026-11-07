import { centsBetween, midiToHz } from "./notes"
import type { PitchFrame, Source, SpectrumFrame } from "./types"

/** Half-width of the target band and of "in tune", in cents. */
export const IN_TUNE_CENTS = 15
/** Semitones of vertical space in the graph, unless zoomed. */
export const DEFAULT_RANGE_SEMITONES = 30

const READOUT_SECONDS = 0.15
const RANGE_MEDIAN_SECONDS = 4
const RANGE_EASE_SECONDS = 0.6
/** The view stays inside C2..C6. */
const RANGE_LOWEST = 36
const RANGE_HIGHEST = 84
/** A3..D5 rows with half a row of margin. */
const DEFAULT_CENTER = (57 + 74) / 2
/** A frame stands for the time around it up to this far. */
const MAX_FRAME_GAP = 0.03

export interface Readout {
   /** Mean voice midi over the last 150 ms of voiced frames, null when silent. */
   midi: number | null
   hz: number | null
   /** Cents from the target to the voice. */
   cents: number | null
   /** Target note (integer midi). */
   target: number | null
   inTune: boolean
}

export interface Score {
   voiced: number
   inTune: number
   /** 0..100, null before any voiced frame was scored. */
   percent: number | null
}

export interface VisibleRange {
   /** Fractional midi at the bottom and top of the graph. */
   min: number
   max: number
}

export interface Session {
   readonly windowSeconds: number
   addFrames(frames: PitchFrame[]): void
   addSpectrum(frames: SpectrumFrame[]): void
   setActive(active: Record<Source, boolean>): void
   /**
    * The graph's right edge: the mic's latest frame while the mic runs, so the
    * mic line stays live and the tab line trails by its analysis delay;
    * otherwise the tab's. Null while the leading source has no frame yet.
    */
   alignedEdge(): number | null
   /** The eased visible range at `edge`, `semitones` tall (default 30). */
   range(edge: number, semitones?: number): VisibleRange
   targetAt(time: number): number | null
   readout(): Readout
   score(): Score
   resetScore(): void
   /** Frames with time in [from, to], in time order. */
   forEachFrame(
      source: Source,
      from: number,
      to: number,
      cb: (time: number, midi: number | null) => void
   ): void
   /** Spectrum frames with time in [from, to], in time order. */
   forEachSpectrum(
      source: Source,
      from: number,
      to: number,
      cb: (frame: SpectrumFrame) => void
   ): void
}

interface Track<T> {
   times: number[]
   values: T[]
   head: number
}

const createTrack = <T>(): Track<T> => ({
   times: [],
   values: [],
   head: 0,
})

const lastTime = <T>(track: Track<T>): number | null =>
   track.times.length > track.head ? track.times[track.times.length - 1] : null

/** Index of the first stored item with time >= t. */
const lowerBound = <T>(track: Track<T>, t: number) => {
   let lo = track.head
   let hi = track.times.length
   while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (track.times[mid] < t) lo = mid + 1
      else hi = mid
   }
   return lo
}

const push = <T>(track: Track<T>, time: number, value: T) => {
   const last = lastTime(track)
   // A clock that went backwards means a new audio context: start over.
   if (last !== null && time < last) {
      track.times = []
      track.values = []
      track.head = 0
   }
   track.times.push(time)
   track.values.push(value)
}

const dropBefore = <T>(track: Track<T>, t: number) => {
   track.head = lowerBound(track, t)
   if (track.head > 1024 && track.head > track.times.length / 2) {
      track.times = track.times.slice(track.head)
      track.values = track.values.slice(track.head)
      track.head = 0
   }
}

const median = (values: number[]) => {
   if (values.length === 0) return null
   const sorted = values.slice().sort((a, b) => a - b)
   const mid = sorted.length >> 1
   return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const clamp = (value: number, min: number, max: number) =>
   Math.min(max, Math.max(min, value))

export const createSession = ({ windowSeconds = 8 } = {}): Session => {
   const keepSeconds = windowSeconds + 1
   const tracks: Record<Source, Track<number | null>> = {
      voice: createTrack(),
      song: createTrack(),
   }
   const spectra: Record<Source, Track<SpectrumFrame>> = {
      voice: createTrack(),
      song: createTrack(),
   }
   const active: Record<Source, boolean> = { voice: false, song: false }
   /** Frames received since the source was last switched on. */
   const fresh: Record<Source, boolean> = { voice: false, song: false }
   let center = DEFAULT_CENTER
   let rangeEdge: number | null = null

   let scoredUpTo = -Infinity
   let voiced = 0
   let inTune = 0

   /** Midi of the source at time t, null when unvoiced or no frame. */
   const midiAt = (source: Source, t: number) => {
      const track = tracks[source]
      const i = lowerBound(track, t)
      let best = -1
      let bestGap = MAX_FRAME_GAP
      if (i < track.times.length && track.times[i] - t <= bestGap) {
         best = i
         bestGap = track.times[i] - t
      }
      if (i - 1 >= track.head && t - track.times[i - 1] <= bestGap) best = i - 1
      return best < 0 ? null : track.values[best]
   }

   const latest = (source: Source) => lastTime(tracks[source])

   const alignedEdge = () => {
      const lead: Source | null = active.voice
         ? "voice"
         : active.song
           ? "song"
           : null
      if (lead !== null) return fresh[lead] ? latest(lead) : null
      const times = (["voice", "song"] as Source[])
         .map(latest)
         .filter((t): t is number => t !== null)
      return times.length ? Math.max.apply(null, times) : null
   }

   /** The note nearest to the mic's pitch; the song line has no say in it. */
   const targetAt = (time: number) => {
      const voice = midiAt("voice", time)
      return voice === null ? null : Math.round(voice)
   }

   const advanceScore = () => {
      const edge = latest("voice")
      if (edge === null || edge <= scoredUpTo) return
      const track = tracks.voice
      let i = lowerBound(track, scoredUpTo)
      if (i < track.times.length && track.times[i] === scoredUpTo) i++
      for (; i < track.times.length && track.times[i] <= edge; i++) {
         const midi = track.values[i]
         if (midi === null) continue
         voiced++
         const target = targetAt(track.times[i])
         if (
            target !== null &&
            Math.abs(centsBetween(target, midi)) <= IN_TUNE_CENTS
         )
            inTune++
      }
      scoredUpTo = edge
   }

   const forEachIn = <T>(
      track: Track<T>,
      from: number,
      to: number,
      cb: (time: number, value: T) => void
   ) => {
      for (
         let i = lowerBound(track, from);
         i < track.times.length && track.times[i] <= to;
         i++
      )
         cb(track.times[i], track.values[i])
   }

   return {
      windowSeconds,

      addFrames: (frames) => {
         frames.forEach((frame) => {
            push(tracks[frame.source], frame.time, frame.midi)
            fresh[frame.source] = true
         })
         advanceScore()
         const sources: Source[] = ["voice", "song"]
         sources.forEach((source) => {
            const last = lastTime(tracks[source])
            if (last !== null) dropBefore(tracks[source], last - keepSeconds)
         })
      },

      addSpectrum: (frames) => {
         frames.forEach((frame) => push(spectra[frame.source], frame.time, frame))
         const sources: Source[] = ["voice", "song"]
         sources.forEach((source) => {
            const last = lastTime(spectra[source])
            if (last !== null) dropBefore(spectra[source], last - keepSeconds)
         })
      },

      setActive: (next) => {
         const sources: Source[] = ["voice", "song"]
         sources.forEach((source) => {
            if (next[source] && !active[source]) fresh[source] = false
            active[source] = next[source]
         })
      },

      alignedEdge,

      range: (edge, semitones = DEFAULT_RANGE_SEMITONES) => {
         const from = edge - RANGE_MEDIAN_SECONDS
         const midis: number[] = []
         forEachIn(tracks.voice, from, edge, (_, midi) => {
            if (midi !== null) midis.push(midi)
         })
         forEachIn(tracks.song, from, edge, (_, midi) => {
            if (midi !== null) midis.push(midi)
         })
         const goal = median(midis)
         const dt = rangeEdge === null ? 0 : clamp(edge - rangeEdge, 0, 0.5)
         rangeEdge = edge
         if (goal !== null)
            center += (goal - center) * (1 - Math.exp(-dt / RANGE_EASE_SECONDS))
         // Keep the view inside C2..C6, with half a row of margin.
         const half = semitones / 2
         center = clamp(
            center,
            RANGE_LOWEST - 0.5 + half,
            RANGE_HIGHEST + 0.5 - half
         )
         return { min: center - half, max: center + half }
      },

      targetAt,

      readout: () => {
         const empty: Readout = {
            midi: null,
            hz: null,
            cents: null,
            target: null,
            inTune: false,
         }
         const edge = latest("voice")
         if (edge === null || !active.voice) return empty
         const target = targetAt(edge)
         let sum = 0
         let count = 0
         forEachIn(tracks.voice, edge - READOUT_SECONDS, edge, (_, midi) => {
            if (midi === null) return
            sum += midi
            count++
         })
         if (count === 0) return { ...empty, target }
         const midi = sum / count
         const cents = target === null ? null : centsBetween(target, midi)
         return {
            midi,
            hz: midiToHz(midi),
            cents,
            target,
            inTune: cents !== null && Math.abs(cents) <= IN_TUNE_CENTS,
         }
      },

      score: () => {
         advanceScore()
         return {
            voiced,
            inTune,
            percent: voiced ? (100 * inTune) / voiced : null,
         }
      },

      resetScore: () => {
         voiced = 0
         inTune = 0
         const last = lastTime(tracks.voice)
         if (last !== null) scoredUpTo = Math.max(scoredUpTo, last)
      },

      forEachFrame: (source, from, to, cb) =>
         forEachIn(tracks[source], from, to, cb),

      forEachSpectrum: (source, from, to, cb) =>
         forEachIn(spectra[source], from, to, (_, frame) => cb(frame)),
   }
}
