import {
   dictionaryChunkFor,
   normaliseBritishIpa,
   tokeniseWithDictionary,
   wordsInText,
} from "./converter"

describe("British IPA converter helpers", () => {
   it("normalises common dictionary symbols for the teaching notation", () => {
      expect(normaliseBritishIpa("ɹ ɛ ɐ g")).toBe("reʌɡ")
   })

   it("chooses a small dictionary chunk from the first letter", () => {
      expect(dictionaryChunkFor("Rain")).toBe("r")
      expect(dictionaryChunkFor("42")).toBe("other")
   })

   it("returns unique, normalised words while preserving contractions", () => {
      expect(wordsInText("Rain, rain—it’s fine.")).toEqual(["rain", "it's", "fine"])
   })

   it("preserves punctuation and marks words missing from the dictionary", () => {
      expect(
         tokeniseWithDictionary("Rain, mystery!", {
            rain: ["reɪn"],
         })
      ).toEqual([
         {
            type: "word",
            source: "Rain",
            lookup: "rain",
            pronunciations: ["reɪn"],
         },
         { type: "separator", source: ", " },
         {
            type: "word",
            source: "mystery",
            lookup: "mystery",
            pronunciations: [],
         },
         { type: "separator", source: "!" },
      ])
   })
})
