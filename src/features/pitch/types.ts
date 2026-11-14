export type Source = "voice" | "song"

/** One analysis frame. midi is fractional (69 = A4 = 440 Hz); null = unvoiced. */
export interface PitchFrame {
   source: Source
   time: number // AudioContext seconds the pitch belongs to (within the analysis window)
   midi: number | null
   confidence: number // 0..1
   db: number // frame level, dBFS (RMS), for unvoiced frames too
}

/** A source's spectrum over one short stretch, on the graph's pitch scale. */
export interface SpectrumFrame {
   source: Source
   time: number // AudioContext seconds at the middle of the stretch
   duration: number // seconds between frames
   values: Uint8Array // level per note from C2 upward (spectrum.ts), 0..255
}

export interface PitchCandidate {
   midi: number
   probability: number // 0..1, candidates of one frame sum to <= 1
}

/** Streaming analyzer. push() returns frames committed by this call, in time order. */
export interface Analyzer {
   readonly latency: number // seconds from a sample entering to its frame being returned
   /** `right` (song only): samples is then the left channel of a stereo block. */
   push(
      samples: Float32Array,
      startFrame: number,
      right?: Float32Array
   ): PitchFrame[]
   reset(): void
}

export type TapMessage = {
   type: "block"
   source: Source
   startFrame: number
   samples: Float32Array // mono, or the left channel when right is set
   right?: Float32Array // song taps with stereo input only
}

export type WorkerIn =
   | { type: "init"; sampleRate: number }
   | { type: "connect"; source: Source; port: MessagePort }
   | { type: "reset"; source: Source }

export type WorkerOut =
   | { type: "ready"; latency: Record<Source, number> }
   | { type: "frames"; frames: PitchFrame[] }
   | { type: "spectrum"; frames: SpectrumFrame[] }
   | { type: "error"; message: string }

/** Keys, not text: the page maps each to a translated `warnings.*` string. */
export type EngineWarning =
   | "echoCancellation" // still on after asking for it off
   | "noiseSuppression"
   | "autoGainControl"
   | "monoTab" // tab audio arrived with one channel

/**
 * "denied": the browser refused it for this site.
 * "systemDenied": the OS refused it to the browser (e.g. Android app permissions).
 * "busy": allowed, but the system couldn't open the device (in use, blocked by the OS).
 */
export type MicState =
   | "off"
   | "starting"
   | "on"
   | "denied"
   | "systemDenied"
   | "busy"
   | "error"

/** "unreadable": shared with audio, but the browser couldn't open it (seen with app windows on Windows). */
export type TabState =
   | "off"
   | "starting"
   | "on"
   | "noAudio"
   | "unreadable"
   | "unsupported"
   | "error"

export interface EngineState {
   mic: MicState
   tab: TabState
   latency: Record<Source, number>
   warnings: EngineWarning[]
}

export interface PitchEngine {
   enableMic(): Promise<void> // creates/resumes the AudioContext on first call
   disableMic(): void
   shareTab(): Promise<void>
   stopTab(): void
   now(): number
   onFrames(cb: (frames: PitchFrame[]) => void): () => void
   onSpectrum(cb: (frames: SpectrumFrame[]) => void): () => void
   onState(cb: (state: EngineState) => void): () => void
   getState(): EngineState
   dispose(): void
}
