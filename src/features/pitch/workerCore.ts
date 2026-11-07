import { createPolarity, type Polarity } from "./polarity"
import { createSongAnalyzer, type SongAnalyzer } from "./song"
import { createSpectrum, type Spectrum } from "./spectrum"
import type {
   Analyzer,
   PitchFrame,
   Source,
   SpectrumFrame,
   TapMessage,
   WorkerIn,
   WorkerOut,
} from "./types"
import { createVoiceAnalyzer } from "./voice"

/** Frames go to the main thread at most this often. */
export const BATCH_MS = 16

export type WorkerPost = (msg: WorkerOut, transfer?: Transferable[]) => void

export interface WorkerCore {
   handle(msg: WorkerIn): void
}

const messageOf = (error: unknown): string =>
   error instanceof Error ? error.message : String(error)

/** The worker's logic, free of worker globals so it runs in Node tests. */
export const createWorkerCore = (post: WorkerPost): WorkerCore => {
   const analyzers: { voice?: Analyzer; song?: SongAnalyzer } = {}
   const ports: Partial<Record<Source, MessagePort>> = {}
   const spectra: Partial<Record<Source, Spectrum>> = {}
   let polarity: Polarity | null = null

   let frames: PitchFrame[] = []
   let spectrum: SpectrumFrame[] = []
   let timer: ReturnType<typeof setTimeout> | null = null
   let lastFlush = -Infinity

   const flush = () => {
      timer = null
      lastFlush = Date.now()
      if (frames.length > 0) {
         post({ type: "frames", frames })
         frames = []
      }
      if (spectrum.length > 0) {
         post({ type: "spectrum", frames: spectrum })
         spectrum = []
      }
   }

   // Leading edge: a batch goes out at once if the last one left >= BATCH_MS ago,
   // otherwise when that interval is up.
   const schedule = () => {
      if (timer !== null) return
      const wait = lastFlush + BATCH_MS - Date.now()
      if (wait <= 0) flush()
      else timer = setTimeout(flush, wait)
   }

   const emit = (out: PitchFrame[]) => {
      for (let i = 0; i < out.length; i++) frames.push(out[i])
      if (frames.length > 0) schedule()
   }

   const onBlock = (source: Source, msg: TapMessage) => {
      if (!msg || msg.type !== "block") return
      try {
         // The tab's right channel, inverted back if the recording has it inverted.
         const right =
            msg.right && polarity ? polarity.fix(msg.samples, msg.right) : msg.right
         if (source === "voice") {
            const analyzer = analyzers.voice
            if (analyzer) emit(analyzer.push(msg.samples, msg.startFrame))
         } else {
            const analyzer = analyzers.song
            if (analyzer) emit(analyzer.push(msg.samples, msg.startFrame, right))
         }
         const spec = spectra[source]
         if (spec) {
            const out = spec.push(msg.samples, msg.startFrame, right)
            for (let i = 0; i < out.length; i++) spectrum.push(out[i])
            if (out.length > 0) schedule()
         }
      } catch (error) {
         analyzers[source]?.reset()
         spectra[source]?.reset()
         post({ type: "error", message: `${source} analyzer: ${messageOf(error)}` })
      }
   }

   const closePort = (source: Source) => {
      const port = ports[source]
      if (!port) return
      port.onmessage = null
      port.close()
      delete ports[source]
   }

   const handle = (msg: WorkerIn) => {
      switch (msg.type) {
         case "init": {
            let voice: Analyzer
            let song: SongAnalyzer
            try {
               voice = createVoiceAnalyzer(msg.sampleRate)
               song = createSongAnalyzer(msg.sampleRate)
               spectra.voice = createSpectrum("voice", msg.sampleRate)
               spectra.song = createSpectrum("song", msg.sampleRate)
               polarity = createPolarity(msg.sampleRate)
            } catch (error) {
               post({ type: "error", message: `init: ${messageOf(error)}` })
               return
            }
            analyzers.voice = voice
            analyzers.song = song
            post({
               type: "ready",
               latency: { voice: voice.latency, song: song.latency },
            })
            return
         }
         case "connect": {
            const { source, port } = msg
            closePort(source)
            ports[source] = port
            // Setting onmessage also starts the port.
            port.onmessage = (event: MessageEvent<TapMessage>) => {
               if (ports[source] === port) onBlock(source, event.data)
            }
            return
         }
         case "reset": {
            const { source } = msg
            // Blocks still in flight on the old port must not reach the fresh analyzer.
            closePort(source)
            const analyzer = analyzers[source]
            if (analyzer) analyzer.reset()
            spectra[source]?.reset()
            if (source === "song") polarity?.reset()
            frames = frames.filter((frame) => frame.source !== source)
            spectrum = spectrum.filter((frame) => frame.source !== source)
            return
         }
      }
   }

   return { handle }
}
