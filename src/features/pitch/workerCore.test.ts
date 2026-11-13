/** @jest-environment node */
import { createSongAnalyzer } from "./song"
import type { Analyzer, PitchFrame, Source, WorkerOut } from "./types"
import { createVoiceAnalyzer } from "./voice"
import { BATCH_MS, createWorkerCore } from "./workerCore"

jest.mock("./voice", () => ({ createVoiceAnalyzer: jest.fn() }))
jest.mock("./song", () => ({ createSongAnalyzer: jest.fn() }))

const mockedVoice = createVoiceAnalyzer as jest.MockedFunction<
   typeof createVoiceAnalyzer
>
const mockedSong = createSongAnalyzer as jest.MockedFunction<
   typeof createSongAnalyzer
>

interface FakeAnalyzer extends Analyzer {
   push: jest.Mock<PitchFrame[], [Float32Array, number]>
   reset: jest.Mock<void, []>
}

const frameAt = (source: Source, startFrame: number): PitchFrame => ({
   source,
   time: startFrame / 48000,
   midi: 60,
   confidence: 1,
   db: -20,
})

/** One frame per block, timed at the block's first sample. */
const fakeAnalyzer = (source: Source, latency: number): FakeAnalyzer => ({
   latency,
   push: jest.fn((samples: Float32Array, startFrame: number) => [
      frameAt(source, startFrame),
   ]),
   reset: jest.fn(),
})

interface FakePort {
   onmessage: ((event: { data: unknown }) => void) | null
   close: jest.Mock
}

const fakePort = (): FakePort => ({ onmessage: null, close: jest.fn() })

const block = (source: Source, startFrame: number) => ({
   data: { type: "block", source, startFrame, samples: new Float32Array(512) },
})

const setup = () => {
   const voice = fakeAnalyzer("voice", 0.07)
   const song = fakeAnalyzer("song", 0.12)
   mockedVoice.mockImplementation(() => voice)
   mockedSong.mockImplementation(() => song)
   const posted: { msg: WorkerOut; transfer?: Transferable[] }[] = []
   const core = createWorkerCore((msg, transfer) => posted.push({ msg, transfer }))
   core.handle({ type: "init", sampleRate: 48000 })

   const connect = (source: Source) => {
      const port = fakePort()
      core.handle({ type: "connect", source, port: port as unknown as MessagePort })
      return port
   }
   const framesPosted = () =>
      posted
         .map((p) => p.msg)
         .filter(
            (msg): msg is Extract<WorkerOut, { type: "frames" }> =>
               msg.type === "frames"
         )
   return {
      core,
      voice,
      song,
      connect,
      framesPosted,
      posted,
   }
}

beforeEach(() => {
   jest.useFakeTimers()
   jest.setSystemTime(1_000_000)
   mockedVoice.mockReset()
   mockedSong.mockReset()
})

afterEach(() => {
   jest.useRealTimers()
})

describe("createWorkerCore", () => {
   it("routes each port's blocks to the analyzer of its source", () => {
      const { connect, voice, song, framesPosted } = setup()
      const voicePort = connect("voice")
      const songPort = connect("song")

      voicePort.onmessage?.(block("voice", 512))
      songPort.onmessage?.(block("song", 1024))
      jest.advanceTimersByTime(BATCH_MS)

      expect(voice.push).toHaveBeenCalledTimes(1)
      expect(voice.push.mock.calls[0][1]).toBe(512)
      expect(song.push).toHaveBeenCalledTimes(1)
      expect(song.push.mock.calls[0][1]).toBe(1024)
      const sources = framesPosted()
         .flatMap((msg) => msg.frames)
         .map((frame) => frame.source)
      expect(sources).toEqual(["voice", "song"])
   })

   it("resets one analyzer, drops its pending frames and closes its port", () => {
      const { core, connect, voice, song, framesPosted } = setup()
      const voicePort = connect("voice")
      const songPort = connect("song")

      voicePort.onmessage?.(block("voice", 0)) // flushed at once
      voicePort.onmessage?.(block("voice", 512)) // pending
      songPort.onmessage?.(block("song", 512)) // pending
      const handler = voicePort.onmessage
      core.handle({ type: "reset", source: "voice" })

      expect(voice.reset).toHaveBeenCalledTimes(1)
      expect(song.reset).not.toHaveBeenCalled()
      expect(voicePort.close).toHaveBeenCalled()
      expect(voicePort.onmessage).toBeNull()

      // A block still in flight on the closed port does not reach the analyzer.
      handler?.(block("voice", 1024))
      expect(voice.push).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(BATCH_MS)
      const later = framesPosted().slice(1)
      expect(later.flatMap((msg) => msg.frames).map((f) => f.source)).toEqual([
         "song",
      ])
   })
})
