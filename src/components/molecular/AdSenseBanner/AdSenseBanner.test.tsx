import { act, render } from "@testing-library/react"
import React from "react"
import AdSenseBanner from "./AdSenseBanner"

jest.mock("@/features/consent/config", () => ({ ADSENSE_CLIENT: "ca-pub-test" }))
jest.mock("@/features/consent/consent", () => ({
   useConsentMachine: () => ({ data: { grants: { ads: true } } }),
}))
jest.mock("next/router", () => ({ useRouter: () => ({ asPath: "/" }) }))

const setStatus = (container: HTMLElement, status: string) =>
   act(async () => {
      container.querySelector("ins")?.setAttribute("data-ad-status", status)
   })

describe("AdSenseBanner", () => {
   it("adds its spacing only once an ad fills it", async () => {
      const { container } = render(<AdSenseBanner slot="1" className="mb-8" />)
      expect(container.firstElementChild).not.toHaveClass("mb-8")
      await setStatus(container, "filled")
      expect(container.firstElementChild).toHaveClass("mb-8")
   })

   it("takes no space when AdSense leaves it unfilled", async () => {
      const { container } = render(<AdSenseBanner slot="1" size={[300, 250]} />)
      await setStatus(container, "unfilled")
      expect(container).toBeEmptyDOMElement()
   })

   // Last: a failed script is remembered for every later slot.
   it("takes no space when the ad script is blocked", () => {
      const script = document.createElement("script")
      script.id = "consent-adsbygoogle"
      document.head.appendChild(script)
      const { container } = render(<AdSenseBanner slot="1" size={[300, 250]} />)
      act(() => {
         script.dispatchEvent(new Event("error"))
      })
      expect(container).toBeEmptyDOMElement()
      expect(render(<AdSenseBanner slot="2" />).container).toBeEmptyDOMElement()
   })
})
