import { sendAnalyticsEvent } from "@/features/consent/google"
import { act, renderHook } from "@testing-library/react"
import { IPA_EVENTS, useIpaEvents } from "./analytics"

jest.mock("@/features/consent/google", () => ({
   sendAnalyticsEvent: jest.fn(() => true),
}))

const send = jest.mocked(sendAnalyticsEvent)
const SECOND = 1000

const sentNames = () => send.mock.calls.map(([name]) => name)

/** Advances `seconds`, clicking every `clickEvery` seconds (never if 0). */
const spend = (seconds: number, clickEvery = 0) => {
   for (let i = 1; i <= seconds; i++) {
      act(() => {
         jest.advanceTimersByTime(SECOND)
      })
      if (clickEvery && i % clickEvery === 0)
         window.dispatchEvent(new Event("pointerdown"))
   }
}

beforeEach(() => {
   jest.useFakeTimers()
   send.mockClear()
   send.mockImplementation(() => true)
   Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
   })
})

afterEach(() => {
   jest.useRealTimers()
})

describe("useIpaEvents", () => {
   it("sends an event once, retrying while analytics is off", () => {
      send.mockImplementationOnce(() => false)
      const { result } = renderHook(() => useIpaEvents(false))

      result.current.trackConvert()
      result.current.trackConvert()
      result.current.trackConvert()

      expect(sentNames()).toEqual([IPA_EVENTS.convert, IPA_EVENTS.convert])
   })

   it("counts speech starting as listening, once", () => {
      const { rerender } = renderHook(({ speaking }) => useIpaEvents(speaking), {
         initialProps: { speaking: false },
      })
      expect(sentNames()).toEqual([])

      rerender({ speaking: true })
      rerender({ speaking: false })
      rerender({ speaking: true })

      expect(sentNames()).toEqual([IPA_EVENTS.listen])
   })

   it("sends the active event after two minutes of use", () => {
      renderHook(() => useIpaEvents(false))
      window.dispatchEvent(new Event("keydown"))

      spend(118, 20)
      expect(sentNames()).not.toContain(IPA_EVENTS.activeUse)

      spend(5, 20)
      expect(sentNames()).toEqual([IPA_EVENTS.activeUse])

      spend(300, 20)
      expect(sentNames()).toEqual([IPA_EVENTS.activeUse])
   })

   it("stops counting once the visitor goes idle", () => {
      renderHook(() => useIpaEvents(false))
      window.dispatchEvent(new Event("pointerdown"))

      spend(600)

      expect(sentNames()).toEqual([])
   })

   it("counts listening to speech as use without input", () => {
      renderHook(() => useIpaEvents(true))
      send.mockClear()

      spend(125)

      expect(sentNames()).toEqual([IPA_EVENTS.activeUse])
   })

   it("does not count time while the page is hidden", () => {
      Object.defineProperty(document, "visibilityState", {
         configurable: true,
         value: "hidden",
      })
      renderHook(() => useIpaEvents(false))

      spend(600, 10)

      expect(sentNames()).toEqual([])
   })
})
