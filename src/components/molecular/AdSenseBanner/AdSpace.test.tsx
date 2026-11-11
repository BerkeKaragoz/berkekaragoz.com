import { act, render } from "@testing-library/react"
import React from "react"
import AdSpace from "./AdSpace"

const Slot = (props: { className?: string; height?: number }) => {
   const ins = React.useRef<HTMLModElement>(null)
   return (
      <AdSpace ins={ins} {...props}>
         <ins ref={ins} />
      </AdSpace>
   )
}

const outer = (container: HTMLElement) => container.firstElementChild as HTMLElement
const inner = (container: HTMLElement) => container.querySelector("ins")?.parentElement

/** What AdSense does to the ins; the observer hears of it in a microtask. */
const mark = (container: HTMLElement, attribute: string, value: string) =>
   act(async () => {
      container.querySelector("ins")?.setAttribute(attribute, value)
   })
const pickUp = (container: HTMLElement) => mark(container, "data-adsbygoogle-status", "done")
const answer = (container: HTMLElement, status: string) =>
   mark(container, "data-ad-status", status)
const wait = (ms: number) => act(() => void jest.advanceTimersByTime(ms))

const FOLDED = ["absolute", "h-0", "overflow-clip"]

describe("AdSpace", () => {
   beforeEach(() => {
      window.localStorage.clear()
      // The observer runs on microtasks, which must stay real.
      jest.useFakeTimers({ doNotFake: ["queueMicrotask", "nextTick"] })
   })
   afterEach(() => {
      jest.useRealTimers()
   })

   it("holds a responsive ad's room and spacing while the ad is on the way", () => {
      const { container } = render(<Slot className="mb-8" />)
      expect(outer(container)).toHaveClass("ad-slot", "mb-8", "ad-hold")
      expect(inner(container)).not.toHaveClass(...FOLDED)
   })

   it("holds a fixed ad's height", () => {
      const { container } = render(<Slot height={250} />)
      expect(outer(container)).toHaveStyle({ minHeight: "250px" })
      expect(outer(container)).not.toHaveClass("ad-hold")
   })

   it("keeps the spacing and lets the ad set the height once it fills", async () => {
      const { container } = render(<Slot className="mb-8" height={250} />)
      await pickUp(container)
      await answer(container, "filled")
      expect(outer(container)).toHaveClass("mb-8")
      expect(outer(container).style.minHeight).toBe("")
      expect(outer(container)).not.toHaveClass("ad-hold")
      expect(inner(container)).not.toHaveClass(...FOLDED)
      expect(window.localStorage.getItem("ads.serving")).toBe("1")
   })

   it("takes no space when AdSense leaves it unfilled", async () => {
      const { container } = render(<Slot height={250} />)
      await pickUp(container)
      await answer(container, "unfilled")
      expect(container).toBeEmptyDOMElement()
   })

   // An account that isn't approved: AdSense sizes the ins and marks it done,
   // then never asks for an ad.
   it("folds when AdSense picks the slot up and never asks for an ad", async () => {
      const { container } = render(<Slot className="mb-8" />)
      const ins = container.querySelector("ins")
      await pickUp(container)
      wait(2999)
      expect(outer(container)).toHaveClass("mb-8")
      wait(1)
      // Out of the flow, so the margins around the slot still collapse.
      expect(outer(container)).not.toHaveClass("mb-8")
      expect(outer(container)).not.toHaveClass("ad-hold")
      expect(inner(container)).toHaveClass(...FOLDED)
      expect(container.querySelector("ins")).toBe(ins)
      expect(window.localStorage.getItem("ads.serving")).toBe("0")
   })

   it("starts folded where AdSense wasn't serving, and opens when an ad fills", async () => {
      window.localStorage.setItem("ads.serving", "0")
      const { container } = render(<Slot className="mb-8" />)
      expect(outer(container)).not.toHaveClass("mb-8")
      expect(inner(container)).toHaveClass(...FOLDED)
      await pickUp(container)
      await answer(container, "filled")
      expect(outer(container)).toHaveClass("mb-8")
      expect(inner(container)).not.toHaveClass(...FOLDED)
      expect(window.localStorage.getItem("ads.serving")).toBe("1")
   })

   it("waits longer for an ad that was asked for, then folds", async () => {
      const { container } = render(<Slot className="mb-8" />)
      container.querySelector("ins")?.appendChild(document.createElement("iframe"))
      await pickUp(container)
      wait(3000)
      expect(outer(container)).toHaveClass("mb-8")
      wait(5000)
      expect(inner(container)).toHaveClass(...FOLDED)
      // An unanswered request says nothing about whether AdSense serves.
      expect(window.localStorage.getItem("ads.serving")).toBeNull()
   })

   it("shows an ad that arrives after it folded", async () => {
      const { container } = render(<Slot className="mb-8" />)
      await pickUp(container)
      wait(3000)
      expect(inner(container)).toHaveClass(...FOLDED)
      await answer(container, "filled")
      expect(outer(container)).toHaveClass("mb-8")
      expect(inner(container)).not.toHaveClass(...FOLDED)
   })

   it("takes no space when AdSense never picks the slot up", () => {
      const { container } = render(<Slot height={250} />)
      wait(8000)
      expect(container).toBeEmptyDOMElement()
   })

   // Last: a failed script is remembered for every later slot.
   it("takes no space when the ad script is blocked", () => {
      const script = document.createElement("script")
      script.id = "consent-adsbygoogle"
      document.head.appendChild(script)
      const { container } = render(<Slot height={250} />)
      act(() => {
         script.dispatchEvent(new Event("error"))
      })
      expect(container).toBeEmptyDOMElement()
      expect(render(<Slot />).container).toBeEmptyDOMElement()
   })
})
