import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import PitchPage from "./index.page"

// A factory, so Jest never parses createWorker.ts (import.meta).
jest.mock("@/features/pitch/createWorker", () => ({ createPitchWorker: jest.fn() }))
jest.mock("@/components/organism/Header/Header", () => ({
   __esModule: true,
   default: () => null,
}))
jest.mock("@/components/organism/Footer/Footer", () => ({
   __esModule: true,
   default: () => null,
}))
// It reads the pages router, which this test doesn't mount.
jest.mock("@/components/molecular/AdSenseBanner/AdSenseBanner", () => ({
   __esModule: true,
   default: () => null,
}))
// So does the canonical URL.
jest.mock("@/lib/i18n/useCanonicalUrl", () => ({
   useCanonicalUrl: (path: string) => path,
}))

describe("pitch page with the simulated engine", () => {
   beforeAll(() => {
      window.history.replaceState({}, "", "/pitch-graph?simulate")
      // jsdom has no canvas; the graph must cope with a null context.
      jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
   })

   afterAll(() => {
      jest.restoreAllMocks()
      window.history.replaceState({}, "", "/")
   })

   it("mounts, runs the mic and the tab, and unmounts cleanly", async () => {
      const errors = jest.spyOn(console, "error")
      const { unmount } = render(<PitchPage />)

      expect(
         screen.getByRole("img", { name: "graph.ariaLabel", hidden: true })
      ).toBeInTheDocument()
      expect(
         screen.getByRole("heading", { name: "intro.title" })
      ).toBeInTheDocument()

      // Nothing has run yet: the buttons wait on the overlay.
      fireEvent.click(screen.getByRole("button", { name: "controls.mic.off" }))
      await screen.findByRole(
         "button",
         { name: "controls.mic.on" },
         { timeout: 2000 }
      )

      // The simulated singer starts within a second; the readout shows a note.
      await waitFor(
         () => expect(screen.getByText("readout.centsValue")).toBeInTheDocument(),
         {
            timeout: 3000,
         }
      )

      fireEvent.click(screen.getByRole("button", { name: "controls.tab.off" }))
      await screen.findByRole(
         "button",
         { name: "controls.tab.on" },
         { timeout: 2000 }
      )

      fireEvent.click(screen.getByRole("button", { name: "controls.tab.on" }))
      await screen.findByRole("button", { name: "controls.tab.off" })

      // Stopped just now: the panel stays in reach, no overlay.
      fireEvent.click(screen.getByRole("button", { name: "controls.mic.on" }))
      await screen.findByRole("button", { name: "controls.mic.off" })
      expect(
         screen.getByRole("img", { name: "graph.ariaLabel" })
      ).toBeInTheDocument()

      act(() => unmount())
      expect(errors).not.toHaveBeenCalled()
      errors.mockRestore()
   }, 10000)

   it("starts the mic by itself if it was on in the last two hours", async () => {
      window.localStorage.setItem("pitch.micOnAt", String(Date.now() - 60 * 1000))
      const { unmount } = render(<PitchPage />)
      await screen.findByRole(
         "button",
         { name: "controls.mic.on" },
         { timeout: 2000 }
      )
      act(() => unmount())
      window.localStorage.clear()
   })
})
