import type { EngineWarning } from "./types"

/** TS 5.9's DisplayMediaStreamOptions lacks these Chromium options (TS2353). */
type DisplayOptions = DisplayMediaStreamOptions & {
   selfBrowserSurface?: "include" | "exclude"
   surfaceSwitching?: "include" | "exclude"
   systemAudio?: "include" | "exclude"
}

// Plain booleans, not `exact`: a browser that cannot turn a feature off still
// returns a stream, and the warnings below tell the user what stayed on.
export const MIC_CONSTRAINTS: MediaStreamConstraints = {
   audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
   },
}

const TAB_OPTIONS: DisplayOptions = {
   // `video: false` is not allowed by getDisplayMedia.
   video: true,
   audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 2,
   },
   selfBrowserSurface: "exclude",
   surfaceSwitching: "include",
   systemAudio: "exclude",
}

export type MicCapture =
   | { ok: true; stream: MediaStream; warnings: EngineWarning[] }
   | { ok: false; state: "denied" | "error"; error?: unknown }

export type TabCapture =
   | { ok: true; stream: MediaStream; warnings: EngineWarning[] }
   | {
        ok: false
        // "off": the user closed the picker without sharing.
        state: "off" | "noAudio" | "unsupported" | "error"
        error?: unknown
     }

export interface CaptureOptions {
   /** The captured audio track ended by itself ("Stop sharing", device unplugged). */
   onEnded?: () => void
}

interface UserAgentDataLike {
   brands?: { brand: string }[]
   mobile?: boolean
}

const errorName = (error: unknown): string =>
   error && typeof error === "object" && "name" in error ? String(error.name) : ""

export const stopStream = (stream: MediaStream) => {
   stream.getTracks().forEach((track) => track.stop())
}

const processingWarnings = (settings: MediaTrackSettings): EngineWarning[] => {
   const warnings: EngineWarning[] = []
   if (settings.echoCancellation === true) warnings.push("echoCancellation")
   if (settings.noiseSuppression === true) warnings.push("noiseSuppression")
   if (settings.autoGainControl === true) warnings.push("autoGainControl")
   return warnings
}

// "ended" fires only when the track ends from outside, not on our own stop().
const watchEnded = (track: MediaStreamTrack, onEnded?: () => void) => {
   if (onEnded) track.addEventListener("ended", onEnded, { once: true })
}

/** Tab audio capture exists only in Chromium on desktop (Chrome, Edge, ...). */
export const canShareTabAudio = (): boolean => {
   if (typeof navigator === "undefined") return false
   const devices = navigator.mediaDevices
   if (!devices || typeof devices.getDisplayMedia !== "function") return false

   const uaData = (navigator as Navigator & { userAgentData?: UserAgentDataLike })
      .userAgentData
   if (uaData && Array.isArray(uaData.brands) && uaData.brands.length > 0) {
      return (
         uaData.mobile !== true &&
         uaData.brands.some((entry) => entry.brand === "Chromium")
      )
   }
   const ua = navigator.userAgent
   return /(Chrome|Chromium)\//.test(ua) && !/Mobile|Android/.test(ua)
}

export const openMic = async ({
   onEnded,
}: CaptureOptions = {}): Promise<MicCapture> => {
   let stream: MediaStream
   try {
      stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
   } catch (error) {
      const state = errorName(error) === "NotAllowedError" ? "denied" : "error"
      return { ok: false, state, error }
   }

   const track = stream.getAudioTracks()[0]
   if (!track) {
      stopStream(stream)
      return { ok: false, state: "error", error: new Error("no audio track") }
   }
   watchEnded(track, onEnded)
   return { ok: true, stream, warnings: processingWarnings(track.getSettings()) }
}

/** Call from the user gesture: getDisplayMedia runs before the first await. */
export const openTab = async ({
   onEnded,
}: CaptureOptions = {}): Promise<TabCapture> => {
   if (!canShareTabAudio()) return { ok: false, state: "unsupported" }

   let stream: MediaStream
   try {
      stream = await navigator.mediaDevices.getDisplayMedia(TAB_OPTIONS)
   } catch (error) {
      const name = errorName(error)
      // Chrome rejects a cancelled picker with NotAllowedError; that is not an error.
      if (name === "NotAllowedError" || name === "AbortError") {
         return { ok: false, state: "off", error }
      }
      if (name === "NotSupportedError")
         return { ok: false, state: "unsupported", error }
      return { ok: false, state: "error", error }
   }

   const track = stream.getAudioTracks()[0]
   if (!track) {
      // The user did not tick "Share tab audio".
      stopStream(stream)
      return { ok: false, state: "noAudio" }
   }

   // The video track is only the price of getDisplayMedia. Stop it so Chrome
   // stops capturing frames: verified in Chrome 155 that the tab audio track
   // stays live and unmuted after the video track is stopped.
   stream.getVideoTracks().forEach((video) => video.stop())

   watchEnded(track, onEnded)
   const settings = track.getSettings()
   const warnings = processingWarnings(settings)
   if (settings.channelCount === 1) warnings.push("monoTab")
   return { ok: true, stream, warnings }
}
