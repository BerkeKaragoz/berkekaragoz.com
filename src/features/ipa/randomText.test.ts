import { selectRandomExcerpt } from "./randomText"

const excerpts = [
   {
      gutenbergId: 11,
      title: "First",
      text: "A complete public-domain passage with enough natural English prose to be useful for practising pronunciation. ".repeat(
         3
      ),
   },
   {
      gutenbergId: 84,
      title: "Second",
      text: "A different public-domain passage with enough natural English prose to make the random choice observable in a focused test. ".repeat(
         3
      ),
   },
]

describe("IPA random practice text", () => {
   it("selects a valid Gutenberg passage", () => {
      expect(selectRandomExcerpt(excerpts, "", () => 0)).toBe(
         excerpts[0].text.trim()
      )
      expect(selectRandomExcerpt(excerpts, "", () => 0.99)).toBe(
         excerpts[1].text.trim()
      )
   })

   it("avoids immediately repeating the active passage", () => {
      expect(selectRandomExcerpt(excerpts, excerpts[0].text, () => 0)).toBe(
         excerpts[1].text.trim()
      )
   })

   it("rejects an invalid or empty excerpt pack", () => {
      expect(() => selectRandomExcerpt([], "", () => 0)).toThrow()
      expect(() =>
         selectRandomExcerpt([{ text: "Too short" }], "", () => 0)
      ).toThrow()
   })
})
