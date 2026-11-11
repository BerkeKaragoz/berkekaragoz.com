import { MIC_CONSTRAINTS, openMic, openTab } from "./capture"

interface FakeTrack {
   kind: "audio" | "video"
   enabled: boolean
   stop: jest.Mock
   getSettings: () => MediaTrackSettings
   addEventListener: jest.Mock
}

const fakeTrack = (
   kind: "audio" | "video",
   settings: MediaTrackSettings = {}
): FakeTrack => ({
   kind,
   enabled: true,
   stop: jest.fn(),
   getSettings: () => settings,
   addEventListener: jest.fn(),
})

const fakeStream = (tracks: FakeTrack[]) =>
   ({
      getTracks: () => tracks,
      getAudioTracks: () => tracks.filter((t) => t.kind === "audio"),
      getVideoTracks: () => tracks.filter((t) => t.kind === "video"),
   }) as unknown as MediaStream

const CHROME_UA =
   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

let getUserMedia: jest.Mock
let getDisplayMedia: jest.Mock

const setNavigator = () => {
   getUserMedia = jest.fn()
   getDisplayMedia = jest.fn()
   Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia, getDisplayMedia },
   })
   Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      value: undefined,
   })
   jest.spyOn(navigator, "userAgent", "get").mockReturnValue(CHROME_UA)
}

afterEach(() => {
   jest.restoreAllMocks()
})

describe("openMic", () => {
   it("asks for raw mono audio with plain booleans", async () => {
      setNavigator()
      getUserMedia.mockResolvedValue(fakeStream([fakeTrack("audio")]))
      await openMic()
      expect(getUserMedia).toHaveBeenCalledWith(MIC_CONSTRAINTS)
      expect(MIC_CONSTRAINTS).toEqual({
         audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
         },
      })
   })
})

describe("openMic on a busy device", () => {
   it("retries once, then reports the mic busy", async () => {
      setNavigator()
      const busy = Object.assign(new Error("Could not start audio source"), {
         name: "NotReadableError",
      })
      getUserMedia.mockRejectedValue(busy)
      const result = await openMic()
      expect(getUserMedia).toHaveBeenCalledTimes(2)
      expect(result).toMatchObject({ ok: false, state: "busy" })
   })
})

describe("openTab", () => {
   it("stops the share and returns noAudio without an audio track", async () => {
      setNavigator()
      const video = fakeTrack("video")
      getDisplayMedia.mockResolvedValue(fakeStream([video]))
      expect(await openTab()).toEqual({ ok: false, state: "noAudio" })
      expect(video.stop).toHaveBeenCalled()
   })
})
