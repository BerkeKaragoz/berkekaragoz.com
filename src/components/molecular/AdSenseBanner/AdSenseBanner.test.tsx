import { render } from "@testing-library/react"
import React from "react"
import AdSenseBanner from "./AdSenseBanner"

const grants = { ads: true }
jest.mock("@/features/consent/config", () => ({ ADSENSE_CLIENT: "ca-pub-test" }))
jest.mock("@/features/consent/consent", () => ({
   useConsentMachine: () => ({ data: { grants } }),
}))
jest.mock("next/router", () => ({ useRouter: () => ({ asPath: "/" }) }))

// How much room the slot takes is AdSpace's job; see AdSpace.test.tsx.
describe("AdSenseBanner", () => {
   beforeEach(() => {
      grants.ads = true
      window.adsbygoogle = []
   })

   it("asks AdSense for an ad once the visitor allowed ads", () => {
      const { container } = render(<AdSenseBanner slot="1" className="mb-8" />)
      const ins = container.querySelector("ins.adsbygoogle")
      expect(ins).toHaveAttribute("data-ad-client", "ca-pub-test")
      expect(ins).toHaveAttribute("data-ad-slot", "1")
      expect(window.adsbygoogle).toHaveLength(1)
   })

   it("gives a fixed ad its size", () => {
      const { container } = render(<AdSenseBanner slot="1" size={[300, 250]} />)
      expect(container.querySelector("ins")).toHaveStyle({ width: "300px", height: "250px" })
   })

   it("renders nothing and asks for nothing without consent", () => {
      grants.ads = false
      const { container } = render(<AdSenseBanner slot="1" />)
      expect(container).toBeEmptyDOMElement()
      expect(window.adsbygoogle).toHaveLength(0)
   })
})
