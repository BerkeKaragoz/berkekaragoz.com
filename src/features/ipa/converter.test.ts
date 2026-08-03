import {
   dictionaryChunkFor,
   dictionaryChunksForPrediction,
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

   it("loads only the letter chunks that can contain compound parts", () => {
      expect(dictionaryChunksForPrediction("safeguard")).toEqual([
         "s",
         "a",
         "f",
         "e",
         "g",
         "u",
         "r",
         "d",
      ])
   })

   it("returns unique, normalised words while preserving contractions", () => {
      expect(wordsInText("Rain, rain—it’s fine.")).toEqual(["rain", "it's", "fine"])
   })

   it("preserves punctuation and predicts words missing from the dictionary", () => {
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
            predicted: false,
         },
         { type: "separator", source: ", " },
         {
            type: "word",
            source: "mystery",
            lookup: "mystery",
            pronunciations: ["ˈmistɜːi"],
            predicted: true,
         },
         { type: "separator", source: "!" },
      ])
   })

   it("derives common forms before falling back to spelling", () => {
      const dictionary = {
         safe: ["ˈseɪf"],
         guard: ["ˈɡɑːd"],
         i: ["ˈaɪ"],
         merge: ["ˈmɜːdʒ"],
         style: ["ˈstaɪl"],
         direct: ["daɪˈrekt"],
         local: ["ˈləʊkəl"],
         hero: ["ˈhɪərəʊ"],
      }
      const text = "safeguard I'd PR merged ipa styling redirect localization hero's"
      const tokens = tokeniseWithDictionary(text, dictionary).filter(
         (token) => token.type === "word"
      )

      expect(tokens.map((token) => token.pronunciations[0])).toEqual([
         "ˈseɪfˌɡɑːd",
         "ˈaɪd",
         "ˌpiːˈɑː",
         "ˈmɜːdʒd",
         "ˌaɪ.piːˈeɪ",
         "ˈstaɪlɪŋ",
         "ˌriːdaɪˈrekt",
         "ˌləʊkəlaɪˈzeɪʃən",
         "ˈhɪərəʊz",
      ])
      expect(tokens.every((token) => token.predicted)).toBe(true)
   })
})
