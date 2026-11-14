import { detectPlatform } from "./platform"

const ANDROID_UA =
   "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
const IPHONE_UA =
   "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
const IPAD_DESKTOP_UA =
   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
const MAC_UA = IPAD_DESKTOP_UA
const WINDOWS_UA =
   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const LINUX_UA =
   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

const setNavigator = (
   ua: string,
   { platform, touch = 0 }: { platform?: string; touch?: number } = {}
) => {
   jest.spyOn(navigator, "userAgent", "get").mockReturnValue(ua)
   Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      value: platform === undefined ? undefined : { platform },
   })
   Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: touch,
   })
}

afterEach(() => {
   jest.restoreAllMocks()
})

describe("detectPlatform", () => {
   it("finds Android before Linux", () => {
      setNavigator(ANDROID_UA)
      expect(detectPlatform()).toBe("android")
      setNavigator(LINUX_UA, { platform: "Android" })
      expect(detectPlatform()).toBe("android")
   })

   it("finds iPhone, and iPadOS posing as a Mac", () => {
      setNavigator(IPHONE_UA)
      expect(detectPlatform()).toBe("ios")
      setNavigator(IPAD_DESKTOP_UA, { touch: 5 })
      expect(detectPlatform()).toBe("ios")
   })

   it("finds a Mac without a touch screen", () => {
      setNavigator(MAC_UA)
      expect(detectPlatform()).toBe("mac")
      setNavigator(LINUX_UA, { platform: "macOS" })
      expect(detectPlatform()).toBe("mac")
   })

   it("finds Windows", () => {
      setNavigator(WINDOWS_UA)
      expect(detectPlatform()).toBe("windows")
      setNavigator(LINUX_UA, { platform: "Windows" })
      expect(detectPlatform()).toBe("windows")
   })

   it("calls anything else other", () => {
      setNavigator(LINUX_UA)
      expect(detectPlatform()).toBe("other")
      setNavigator(LINUX_UA, { platform: "Chrome OS" })
      expect(detectPlatform()).toBe("other")
   })
})
