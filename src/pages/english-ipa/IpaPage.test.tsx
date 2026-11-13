import { render, screen } from "@testing-library/react"
import React from "react"
import IpaPage from "./text-to-ipa.page"

const mockRouter = { pathname: "", query: {}, push: jest.fn() }

jest.mock("next/router", () => ({ useRouter: () => mockRouter }))
jest.mock("@/components/organism/Header/Header", () => ({
   __esModule: true,
   default: () => null,
}))
jest.mock("@/components/organism/Footer/Footer", () => ({
   __esModule: true,
   default: () => null,
}))
jest.mock("@/components/molecular/AdSenseBanner/AdSenseBanner", () => ({
   __esModule: true,
   default: () => null,
}))
// jsdom has no matchMedia.
jest.mock("@/components/molecular/PlusBand/PlusBand", () => ({
   __esModule: true,
   default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
jest.mock("@/lib/i18n/useCanonicalUrl", () => ({
   useCanonicalUrl: (path: string) => path,
}))
jest.mock("@/features/ipa/randomText", () => ({
   checkRandomTextAvailable: () => Promise.resolve(false),
   fetchRandomText: jest.fn(),
}))

const renderAt = (pathname: string) => {
   mockRouter.pathname = pathname
   return render(<IpaPage />)
}

describe("English IPA routes", () => {
   beforeAll(() => {
      // The converter loads its dictionary in the background; never answer.
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock
   })

   it("leaves the sounds grid out of the converter page", () => {
      renderAt("/english-ipa/text-to-ipa")

      expect(screen.queryByText("soundsUi.title")).not.toBeInTheDocument()
      const headings = screen.getAllByRole("heading", { level: 1, hidden: true })
      expect(headings).toHaveLength(1)
      expect(headings[0]).toHaveClass("sr-only")
   })

   it("renders the sounds grid and one h1 on the sounds page", () => {
      renderAt("/english-ipa/sounds")

      const headings = screen.getAllByRole("heading", { level: 1, hidden: true })
      expect(headings).toHaveLength(1)
      expect(headings[0]).toHaveAttribute("id", "sounds-title")
      expect(
         screen.getByRole("region", { name: "soundsUi.title" })
      ).toBeInTheDocument()
      expect(screen.queryByLabelText("converter.englishText")).toBeNull()
   })

   it("mounts a view in the render that shows it, and keeps it", () => {
      const { rerender } = renderAt("/english-ipa/text-to-ipa")

      mockRouter.pathname = "/english-ipa/sounds"
      rerender(<IpaPage />)
      expect(screen.getByRole("region", { name: "soundsUi.title" })).toBeVisible()

      mockRouter.pathname = "/english-ipa/text-to-ipa"
      rerender(<IpaPage />)
      expect(
         screen.getByRole("region", { name: "soundsUi.title", hidden: true })
      ).not.toBeVisible()
      expect(screen.getByLabelText("converter.englishText")).toBeVisible()
   })
})
