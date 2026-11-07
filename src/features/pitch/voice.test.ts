/** @jest-environment node */
import { midiToHz } from "./notes"
import { glideCurve, harmonicAmplitudes, melodyLine, tone } from "./testSignals"
import type { PitchFrame } from "./types"
import { createVoiceAnalyzer } from "./voice"

const SR = 48000
const EIGHT = harmonicAmplitudes(8)
/** Fundamental 20 dB under the second harmonic, the rest falling as 1/h from it. */
const WEAK_FUNDAMENTAL = [0.1, 1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7]

const run = (signal: Float32Array, block = 512, startFrame = 0) => {
   const analyzer = createVoiceAnalyzer(SR)
   const frames: PitchFrame[] = []
   for (let i = 0; i < signal.length; i += block) {
      const end = Math.min(signal.length, i + block)
      const out = analyzer.push(signal.subarray(i, end), startFrame + i)
      for (let k = 0; k < out.length; k++) frames.push(out[k])
   }
   return frames
}

const median = (values: number[]) => {
   const sorted = values.slice().sort((a, b) => a - b)
   const mid = sorted.length >> 1
   return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const cents = (midi: number | null, truth: number) =>
   Math.abs((midi as number) - truth) * 100

const voicedOnly = (frames: PitchFrame[]) => frames.filter((f) => f.midi !== null)

describe("createVoiceAnalyzer", () => {
   it("tracks steady tones E2..A5 to a median error of 5 cents", () => {
      const errors: number[] = []
      for (let note = 40; note <= 81; note++) {
         const midi = note + ((note * 0.37) % 1) - 0.5 // off the semitone grid
         const frames = run(
            tone({ hz: midiToHz(midi), harmonics: EIGHT, seconds: 0.6 })
         )
         const settled = frames.filter((f) => f.time >= 0.1)
         const voiced = voicedOnly(settled)
         expect(voiced.length).toBeGreaterThanOrEqual(0.95 * settled.length)
         const error = median(voiced.map((f) => cents(f.midi, midi)))
         errors.push(error)
         expect(error).toBeLessThanOrEqual(5)
      }
      // Measured: every median under 0.2 cents.
      expect(Math.max(...errors)).toBeLessThan(1)
   })

   it("makes octave errors in under 1% of frames with a weak fundamental", () => {
      let voiced = 0
      let octaveErrors = 0
      let frames = 0
      for (let note = 40; note <= 81; note += 1) {
         const out = run(
            tone({ hz: midiToHz(note), harmonics: WEAK_FUNDAMENTAL, seconds: 0.5 })
         )
         frames += out.length
         const v = voicedOnly(out)
         voiced += v.length
         octaveErrors += v.filter((f) => cents(f.midi, note) > 600).length
      }
      const melody = melodyLine(
         [
            { midi: 45, seconds: 0.6 },
            { midi: 52, seconds: 0.5 },
            { midi: 57, seconds: 0.7 },
            { midi: null, seconds: 0.3 },
            { midi: 64, seconds: 0.6 },
            { midi: 59, seconds: 0.8 },
         ],
         { harmonics: WEAK_FUNDAMENTAL }
      )
      const out = run(melody.signal)
      for (let i = 0; i < out.length; i++) {
         const truth = melody.midiAt(out[i].time)
         if (truth === null) continue
         frames++
         if (out[i].midi === null) continue
         voiced++
         if (cents(out[i].midi, truth) > 600) octaveErrors++
      }
      expect(voiced).toBeGreaterThan(0.9 * frames)
      expect(octaveErrors / voiced).toBeLessThan(0.01)
   })

   it("follows a one-octave glide in 200 ms within 100 cents", () => {
      for (const [fromMidi, toMidi] of [
         [40, 52],
         [52, 40],
         [57, 69],
         [69, 57],
         [69, 81],
         [81, 69],
      ]) {
         const curve = glideCurve({
            fromMidi,
            toMidi,
            startSeconds: 0.4,
            glideSeconds: 0.2,
         })
         const frames = run(tone({ midiCurve: curve, harmonics: EIGHT, seconds: 1 }))
         const settled = frames.filter((f) => f.time >= 0.1)
         const during = frames.filter((f) => f.time >= 0.4 && f.time <= 0.6)
         expect(voicedOnly(during).length).toBeGreaterThanOrEqual(
            0.9 * during.length
         )
         const worst = Math.max(
            ...voicedOnly(settled).map((f) => cents(f.midi, curve(f.time) as number))
         )
         // Measured: 14 to 22 cents.
         expect(worst).toBeLessThanOrEqual(100)
      }
   })
})
