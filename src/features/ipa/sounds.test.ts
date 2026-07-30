import { IPA_SOUNDS, sortSoundsForGuide, splitIpaIntoSounds } from "./sounds"

describe("British English IPA inventory", () => {
   it("contains the expected 44 sounds", () => {
      expect(IPA_SOUNDS).toHaveLength(44)
      expect(
         IPA_SOUNDS.filter((sound) => sound.category === "consonant")
      ).toHaveLength(24)
      expect(
         IPA_SOUNDS.filter((sound) => sound.category === "monophthong")
      ).toHaveLength(12)
      expect(
         IPA_SOUNDS.filter((sound) => sound.category === "diphthong")
      ).toHaveLength(8)
   })

   it("uses unique ids and valid comparison references", () => {
      const ids = IPA_SOUNDS.map((sound) => sound.id)
      expect(new Set(ids).size).toBe(IPA_SOUNDS.length)

      for (const sound of IPA_SOUNDS) {
         for (const comparison of sound.confusedWith) {
            expect(ids).toContain(comparison)
         }
      }
   })

   it("maps every entry to static sound and word audio", () => {
      for (const sound of IPA_SOUNDS) {
         expect(sound.soundAudio).toBe(`/audio/ipa/en-GB/sounds/${sound.id}.mp3`)
         expect(sound.wordAudio).toBe(`/audio/ipa/en-GB/words/${sound.id}.mp3`)
      }
   })

   it("splits a British transcription into sound entries", () => {
      expect(splitIpaIntoSounds("reɪn").map((sound) => sound.symbol)).toEqual([
         "r",
         "eɪ",
         "n",
      ])
   })

   it("sorts categories by their closest familiar English sound cue", () => {
      expect(sortSoundsForGuide(IPA_SOUNDS).map((sound) => sound.id)).toEqual([
         "b",
         "tsh",
         "d",
         "f",
         "g",
         "h",
         "dzh",
         "k",
         "l",
         "m",
         "n",
         "ng",
         "p",
         "r",
         "s",
         "sh",
         "t",
         "eth",
         "theta",
         "v",
         "w",
         "j",
         "z",
         "zh",
         "ash",
         "alpha-long",
         "e",
         "i-long",
         "nurse",
         "i-short",
         "lot",
         "u-long",
         "foot",
         "thought",
         "strut",
         "schwa",
         "face",
         "square",
         "near",
         "price",
         "goat",
         "mouth",
         "choice",
         "cure",
      ])
   })
})
