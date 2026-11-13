import {
   canShareTabAudio,
   openMic,
   openTab,
   stopStream,
   type MicCapture,
   type TabCapture,
} from "./capture"
import { createPitchWorker } from "./createWorker"
import type {
   EngineState,
   EngineWarning,
   MicState,
   PitchEngine,
   PitchFrame,
   Source,
   SpectrumFrame,
   TabState,
   WorkerIn,
   WorkerOut,
} from "./types"

const PITCH_TAP_URL = "/audio-worklets/pitch-tap.js"

const SOURCES: Source[] = ["voice", "song"]

interface Wired {
   stream: MediaStream
   input: MediaStreamAudioSourceNode
   node: AudioWorkletNode
}

const noop = () => {}

export const createPitchEngine = (): PitchEngine => {
   let state: EngineState = {
      mic: "off",
      tab: canShareTabAudio() ? "off" : "unsupported",
      latency: { voice: 0, song: 0 },
      warnings: [],
   }
   const warnings: Record<Source, EngineWarning[]> = { voice: [], song: [] }
   const wired: Partial<Record<Source, Wired>> = {}
   // Bumped by every start and stop: a start that finds it changed was cancelled.
   const attempt: Record<Source, number> = { voice: 0, song: 0 }

   // The AudioContext and its sink live until dispose(), so the clock never
   // restarts; the worker is replaced after a fatal error.
   let audio: AudioContext | null = null
   let sink: GainNode | null = null
   let worker: Worker | null = null
   let moduleReady: Promise<void> | null = null
   let disposed = false
   let lastNow = 0

   const frameListeners = new Set<(frames: PitchFrame[]) => void>()
   const spectrumListeners = new Set<(frames: SpectrumFrame[]) => void>()
   const stateListeners = new Set<(state: EngineState) => void>()

   const setState = (patch: Partial<EngineState>) => {
      state = { ...state, ...patch }
      stateListeners.forEach((cb) => cb(state))
   }

   const sourcePatch = (
      source: Source,
      value: MicState | TabState
   ): Partial<EngineState> =>
      source === "voice" ? { mic: value as MicState } : { tab: value as TabState }

   const sourceState = (source: Source) =>
      source === "voice" ? state.mic : state.tab

   const mergedWarnings = (): EngineWarning[] =>
      warnings.voice.concat(
         warnings.song.filter((warning) => warnings.voice.indexOf(warning) < 0)
      )

   const send = (msg: WorkerIn, transfer: Transferable[] = []) => {
      if (worker) worker.postMessage(msg, transfer)
   }

   const unwire = (source: Source) => {
      const w = wired[source]
      if (!w) return
      delete wired[source]
      w.input.disconnect()
      w.node.disconnect()
      w.node.port.postMessage({ type: "stop" })
      w.node.port.close()
      stopStream(w.stream)
   }

   const fail = (message: string) => {
      console.error(`pitch engine: ${message}`)
      const patch: Partial<EngineState> = {}
      SOURCES.forEach((source) => {
         attempt[source]++
         unwire(source)
         warnings[source] = []
         const current = sourceState(source)
         if (current === "on" || current === "starting") {
            Object.assign(patch, sourcePatch(source, "error"))
         }
      })
      if (worker) worker.terminate()
      worker = null
      setState({ ...patch, warnings: [] })
   }

   const startWorker = () => {
      if (!audio) return
      const own = createPitchWorker()
      worker = own
      own.onmessage = (event: MessageEvent<WorkerOut>) => {
         if (worker !== own) return
         const msg = event.data
         switch (msg.type) {
            case "ready":
               setState({ latency: msg.latency })
               return
            case "frames":
               frameListeners.forEach((cb) => cb(msg.frames))
               return
            case "spectrum":
               spectrumListeners.forEach((cb) => cb(msg.frames))
               return
            case "error":
               fail(msg.message)
               return
         }
      }
      own.onerror = (event: ErrorEvent) => {
         if (worker === own) fail(event.message || "worker failed to start")
      }
      send({ type: "init", sampleRate: audio.sampleRate })
   }

   // A start without a user gesture (the mic on page load) leaves the context
   // suspended. Chromium, Firefox and Safari let it run anyway once the page
   // is capturing, so start() resumes again after the capture opens; the
   // first click or key press is the fallback.
   const resumeAudio = () => {
      if (audio && audio.state === "suspended") audio.resume().catch(noop)
   }
   const GESTURES = ["pointerdown", "keydown"]

   // Runs its synchronous part inside the user gesture, if any: the
   // AudioContext is created and resumed before anything awaits.
   const ensureAudio = (): Promise<void> => {
      if (!audio) {
         audio = new AudioContext()
         sink = audio.createGain()
         sink.gain.value = 0
         sink.connect(audio.destination)
         GESTURES.forEach((g) => window.addEventListener(g, resumeAudio, true))
      }
      resumeAudio()
      if (!worker) startWorker()
      if (!moduleReady) {
         const loading = audio.audioWorklet.addModule(PITCH_TAP_URL)
         moduleReady = loading
         // Let a later start retry a failed load.
         loading.catch(() => {
            if (moduleReady === loading) moduleReady = null
         })
      }
      return moduleReady
   }

   const wire = (source: Source, stream: MediaStream) => {
      if (!audio || !sink || !worker) throw new Error("audio graph is not running")
      const node = new AudioWorkletNode(audio, "pitch-tap", {
         numberOfInputs: 1,
         numberOfOutputs: 1,
         outputChannelCount: [1],
         processorOptions: { source },
      })
      const channel = new MessageChannel()
      node.port.postMessage({ type: "connect", port: channel.port1 }, [
         channel.port1,
      ])
      send({ type: "connect", source, port: channel.port2 }, [channel.port2])
      const input = audio.createMediaStreamSource(stream)
      input.connect(node)
      // Through the zero gain to the destination so the node keeps being
      // processed; nothing is audible.
      node.connect(sink)
      wired[source] = { stream, input, node }
   }

   const stop = (source: Source) => {
      attempt[source]++
      if (wired[source]) {
         unwire(source)
         send({ type: "reset", source })
      }
      warnings[source] = []
      const next =
         source === "song" && state.tab === "unsupported" ? "unsupported" : "off"
      setState({ ...sourcePatch(source, next), warnings: mergedWarnings() })
   }

   const start = async (source: Source): Promise<void> => {
      if (disposed || wired[source] || sourceState(source) === "starting") return
      if (source === "song" && !canShareTabAudio()) {
         setState({ tab: "unsupported" })
         return
      }
      const token = ++attempt[source]
      const current = () => !disposed && attempt[source] === token
      setState(sourcePatch(source, "starting"))

      let ready: Promise<void>
      try {
         ready = ensureAudio()
      } catch (error) {
         console.error("pitch engine:", error)
         setState(sourcePatch(source, "error"))
         return
      }

      const onEnded = () => {
         if (current()) stop(source)
      }
      // Called before any await, so getDisplayMedia still has the user gesture.
      const capture: MicCapture | TabCapture =
         source === "voice" ? await openMic({ onEnded }) : await openTab({ onEnded })

      if (!current()) {
         if (capture.ok) stopStream(capture.stream)
         return
      }
      if (!capture.ok) {
         if (capture.state === "error") console.error("pitch engine:", capture.error)
         setState(sourcePatch(source, capture.state))
         return
      }
      // Now capturing, the page may run audio without a gesture.
      resumeAudio()

      try {
         await ready
         if (!current()) {
            stopStream(capture.stream)
            return
         }
         wire(source, capture.stream)
      } catch (error) {
         stopStream(capture.stream)
         if (!current()) return
         console.error("pitch engine:", error)
         setState(sourcePatch(source, "error"))
         return
      }

      warnings[source] = capture.warnings
      setState({ ...sourcePatch(source, "on"), warnings: mergedWarnings() })
   }

   const now = (): number => {
      if (!audio) return lastNow
      let time = audio.currentTime
      // Extrapolate between render quanta, but only while the clock is running:
      // a suspended context would otherwise run away with performance.now().
      if (
         audio.state === "running" &&
         typeof audio.getOutputTimestamp === "function"
      ) {
         const ts = audio.getOutputTimestamp()
         if (ts.contextTime !== undefined && ts.performanceTime) {
            time = ts.contextTime + (performance.now() - ts.performanceTime) / 1000
         }
      }
      // A fresh timestamp can land slightly behind the last extrapolation.
      if (time > lastNow) lastNow = time
      return lastNow
   }

   const subscribe =
      <T>(listeners: Set<(value: T) => void>) =>
      (cb: (value: T) => void) => {
         listeners.add(cb)
         return () => {
            listeners.delete(cb)
         }
      }

   const dispose = () => {
      if (disposed) return
      disposed = true
      SOURCES.forEach((source) => {
         attempt[source]++
         unwire(source)
      })
      if (worker) worker.terminate()
      worker = null
      GESTURES.forEach((g) => window.removeEventListener(g, resumeAudio, true))
      if (audio) audio.close().catch(noop)
      audio = null
      sink = null
      frameListeners.clear()
      spectrumListeners.clear()
      stateListeners.clear()
   }

   return {
      enableMic: () => start("voice"),
      disableMic: () => stop("voice"),
      shareTab: () => start("song"),
      stopTab: () => stop("song"),
      now,
      onFrames: subscribe(frameListeners),
      onSpectrum: subscribe(spectrumListeners),
      onState: subscribe(stateListeners),
      getState: () => state,
      dispose,
   }
}
