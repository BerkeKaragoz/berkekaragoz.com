import {
   GUTENBERG_RANGE_SIZE,
   calculateGutenbergRange,
   extractGutenbergPassage,
   parseGutendexBooks,
   rotateBooks,
} from "./gutenberg"

const prose = (subject: string) =>
   `${subject} moved carefully through the quiet house while the rain struck every window. `.repeat(
      6
   )

describe("Project Gutenberg practice passages", () => {
   it("extracts an interior prose paragraph instead of a partial edge", () => {
      const source = [
         "partial text from the previous paragraph",
         "CHAPTER TWELVE",
         prose("Alice"),
         prose("The traveller"),
         "partial text from the next paragraph",
      ].join("\n\n")

      expect(extractGutenbergPassage(source, () => 0)).toContain("Alice")
      expect(extractGutenbergPassage(source, () => 0.99)).toContain("The traveller")
   })

   it("chooses a bounded byte range from inside the book", () => {
      expect(calculateGutenbergRange(1_000_000, () => 0)).toEqual({
         start: 150_000,
         end: 150_000 + GUTENBERG_RANGE_SIZE - 1,
      })
      expect(calculateGutenbergRange(100_000, () => 1)).toEqual({
         start: 70_000,
         end: 99_999,
      })
   })

   it("validates and rotates Gutendex results", () => {
      const books = parseGutendexBooks({
         results: [
            { id: 11, title: "Alice's Adventures in Wonderland" },
            { id: "invalid", title: "Invalid" },
            { id: 84, title: "Frankenstein" },
         ],
      })

      expect(books).toHaveLength(2)
      expect(rotateBooks(books, () => 0.99)[0].id).toBe(84)
   })
})
