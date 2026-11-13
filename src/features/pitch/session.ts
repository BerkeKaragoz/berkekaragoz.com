import { centsBetween, midiToHz } from "./notes"
import type { PitchFrame, Source, SpectrumFrame } from "./types"

/** Half-width of the target band and of the readout's check, in cents. */
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
   /** Mean mic level (dBFS, rounded) over the last 150 ms, null while off. */
   micDb: number | null
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
   /** Frames with time in [from, to], in time order. */
   forEachFrame(
      source: Source,
      from: number,
      to: number,
      cb: (time: number, midi: number | null, db: number) => void
   ): void
   /** The newest frame's level (dBFS), null until a frame arrives after the
    *  source was last switched on. */
   latestLevel(source: Source): number | null
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
   /** Frame level (dBFS), parallel to `tracks`: same times, same head. */
   const levels: Record<Source, Track<number>> = {
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
            push(levels[frame.source], frame.time, frame.db)
            fresh[frame.source] = true
         })
         const sources: Source[] = ["voice", "song"]
         sources.forEach((source) => {
            const last = lastTime(tracks[source])
            if (last === null) return
            dropBefore(tracks[source], last - keepSeconds)
            dropBefore(levels[source], last - keepSeconds)
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
         const micLevel = () => {
            const end = lastTime(levels.voice)
            if (end === null || !active.voice || !fresh.voice) return null
            // Mean power, not mean dB, so one quiet frame doesn't pull it down.
            let power = 0
            let count = 0
            forEachIn(levels.voice, end - READOUT_SECONDS, end, (_, db) => {
               power += 10 ** (db / 10)
               count++
            })
            return count === 0 ? null : Math.round(10 * Math.log10(power / count))
         }
         const empty: Readout = {
            midi: null,
            hz: null,
            cents: null,
            target: null,
            inTune: false,
            micDb: micLevel(),
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
            ...empty,
            midi,
            hz: midiToHz(midi),
            cents,
            target,
            inTune: cents !== null && Math.abs(cents) <= IN_TUNE_CENTS,
         }
      },

      latestLevel: (source) => {
         const track = levels[source]
         // Not the last run's level, before this run's first frame.
         if (!fresh[source] || lastTime(track) === null) return null
         return track.values[track.values.length - 1]
      },

      forEachFrame: (source, from, to, cb) => {
         const track = tracks[source]
         const level = levels[source]
         // Same times and head in both tracks, so one index serves both.
         for (
            let i = lowerBound(track, from);
            i < track.times.length && track.times[i] <= to;
            i++
         )
            cb(track.times[i], track.values[i], level.values[i])
      },

      forEachSpectrum: (source, from, to, cb) =>
         forEachIn(spectra[source], from, to, (_, frame) => cb(frame)),
   }
}
