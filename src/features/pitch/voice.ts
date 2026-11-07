import { hzToMidi, midiToHz } from "./notes"
import { createTracker, type TrackedFrame } from "./tracker"
import type { Analyzer, PitchFrame, Source } from "./types"
import { createYin, VOICE_MAX_HZ, VOICE_MIN_HZ, voiceFraming } from "./yin"

/**
 * Voice pitch: YIN candidates per hop, a fixed-lag Viterbi tracker, a median.
 *
 * Frame times: YIN compares x[j] with x[j + T] for j in [0, W), so its estimate
 * belongs to sample (W - 1) / 2 + T / 2 of the frame, which moves with the period
 * T. Frames are reported on a fixed grid at the position for the shortest period,
 * and each frame's pitch is interpolated from the estimates around that time, so
 * fast glides stay in place whatever the pitch.
 */
/** `source` tags the frames: the tab line runs this tracker on the mix's centre. */
export const createVoiceAnalyzer = (
   sampleRate: number,
   source: Source = "voice"
): Analyzer => {
   const { window, hop } = voiceFraming(sampleRate)
   const yin = createYin({ sampleRate, window })
   const tracker = createTracker({
      minMidi: hzToMidi(VOICE_MIN_HZ),
      maxMidi: hzToMidi(VOICE_MAX_HZ),
   })
   const half = (yin.integration - 1) / 2
   const offset = half + sampleRate / VOICE_MAX_HZ / 2
   const latency = (tracker.delay * hop + yin.span - offset) / sampleRate

   let buffer = new Float32Array(Math.max(4096, yin.span * 2))
   let length = 0
   /** Absolute sample of buffer[0]; null until the first block after a reset. */
   let bufferStart: number | null = null
   /** Absolute sample where analysis frame 0 starts. */
   let origin = 0
   let analysed = 0
   const recent: TrackedFrame[] = [] // the last few tracked frames, for interpolation

   const reset = () => {
      length = 0
      bufferStart = null
      analysed = 0
      recent.length = 0
      tracker.reset()
   }

   /** Where frame `index`'s estimate sits, in samples after the grid time of `at`. */
   const estimateAt = (frame: TrackedFrame, at: number) =>
      (frame.index - at) * hop +
      half +
      sampleRate / midiToHz(frame.midi as number) / 2 -
      offset

   const place = (frame: TrackedFrame): PitchFrame => {
      const time = (origin + frame.index * hop + offset) / sampleRate
      recent.push(frame)
      if (recent.length > 4) recent.shift()
      if (frame.midi === null)
         return { source, time, midi: null, confidence: frame.confidence }

      // Walk back to the estimates either side of this frame's grid time.
      let later = frame
      let laterAt = estimateAt(frame, frame.index)
      let midi = frame.midi
      for (let k = recent.length - 2; k >= 0 && laterAt > 0; k--) {
         const earlier = recent[k]
         if (earlier.midi === null || earlier.index !== later.index - 1) break
         const earlierAt = estimateAt(earlier, frame.index)
         if (earlierAt <= 0) {
            const u = -earlierAt / (laterAt - earlierAt)
            midi = earlier.midi + u * ((later.midi as number) - earlier.midi)
         } else midi = earlier.midi
         later = earlier
         laterAt = earlierAt
      }
      return { source, time, midi, confidence: frame.confidence }
   }

   const push = (samples: Float32Array, startFrame: number): PitchFrame[] => {
      if (bufferStart !== null && startFrame !== bufferStart + length) reset()
      if (bufferStart === null) {
         bufferStart = startFrame
         origin = startFrame
      }
      if (length + samples.length > buffer.length) {
         const grown = new Float32Array(
            Math.max(buffer.length * 2, length + samples.length)
         )
         grown.set(buffer.subarray(0, length))
         buffer = grown
      }
      buffer.set(samples, length)
      length += samples.length

      const out: PitchFrame[] = []
      let read = origin + analysed * hop - bufferStart
      while (read + yin.span <= length) {
         const result = yin.analyze(buffer, read)
         const tracked = tracker.push(result)
         for (let i = 0; i < tracked.length; i++) out.push(place(tracked[i]))
         analysed++
         read += hop
      }
      // Drop samples no later frame reads.
      if (read > 0) {
         const keep = Math.min(read, length)
         buffer.copyWithin(0, keep, length)
         length -= keep
         bufferStart += keep
      }
      return out
   }

   return { latency, push, reset }
}
