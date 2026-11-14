import { render, screen } from "@testing-library/react"
import React from "react"
import type { EngineState } from "@/features/pitch/types"
import { Controls } from "./Controls"

// Picks a variant the way i18next does: the key with its context if that
// exists, else the base key. Only the variants the tests use are listed.
jest.mock("next-i18next", () => ({
   useTranslation: () => ({
      t: (key: string, options?: { context?: string }) => {
         const variant = `${key}_${options?.context}`
         return ["errors.unsupported_android"].includes(variant) ? variant : key
      },
   }),
}))

const ANDROID_UA =
   "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
const WINDOWS_UA =
   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"

const state: EngineState = {
   mic: "off",
   tab: "unsupported",
   latency: { voice: 0, song: 0 },
   warnings: [],
}

const renderControls = (ua: string) => {
   jest.spyOn(navigator, "userAgent", "get").mockReturnValue(ua)
   render(<Controls state={state} onMic={() => {}} onTab={() => {}} />)
}

afterEach(() => jest.restoreAllMocks())

describe("Controls platform messages", () => {
   it("shows the Android tab message on Android", () => {
      renderControls(ANDROID_UA)
      expect(screen.getByText("errors.unsupported_android")).toBeInTheDocument()
   })

   it("shows the base tab message on a desktop", () => {
      renderControls(WINDOWS_UA)
      expect(screen.getByText("errors.unsupported")).toBeInTheDocument()
   })
})
