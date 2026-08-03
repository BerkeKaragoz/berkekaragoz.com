export type DictionaryChunk = Record<string, string[]>

export type ConvertedToken =
   | {
        type: "word"
        source: string
        lookup: string
        pronunciations: string[]
        predicted: boolean
     }
   | {
        type: "separator"
        source: string
     }

const TOKEN_PATTERN = /([A-Za-z]+(?:['’][A-Za-z]+)*)/g
const WORD_PATTERN = /^[A-Za-z]+(?:['’][A-Za-z]+)*$/
const STRESS_MARKS = /[ˈˌ.]/g
const VOICELESS_ENDINGS = ["p", "t", "k", "f", "θ", "s", "ʃ", "tʃ"]
const SIBILANT_ENDINGS = ["s", "z", "ʃ", "ʒ", "tʃ", "dʒ"]

const LETTER_NAMES: Record<string, string> = {
   a: "eɪ",
   b: "biː",
   c: "siː",
   d: "diː",
   e: "iː",
   f: "ef",
   g: "dʒiː",
   h: "eɪtʃ",
   i: "aɪ",
   j: "dʒeɪ",
   k: "keɪ",
   l: "el",
   m: "em",
   n: "en",
   o: "əʊ",
   p: "piː",
   q: "kjuː",
   r: "ɑː",
   s: "es",
   t: "tiː",
   u: "juː",
   v: "viː",
   w: "dʌbəljuː",
   x: "eks",
   y: "waɪ",
   z: "zed",
}

const LOWERCASE_INITIALISMS = new Set(["ipa"])

const SPELLING_GROUPS: [string, string][] = [
   ["eigh", "eɪ"],
   ["ough", "əʊ"],
   ["tion", "ʃən"],
   ["sion", "ʒən"],
   ["ture", "tʃə"],
   ["igh", "aɪ"],
   ["dge", "dʒ"],
   ["air", "eə"],
   ["ear", "ɪə"],
   ["ure", "ʊə"],
   ["ph", "f"],
   ["th", "θ"],
   ["sh", "ʃ"],
   ["ch", "tʃ"],
   ["ng", "ŋ"],
   ["qu", "kw"],
   ["ck", "k"],
   ["wh", "w"],
   ["ee", "iː"],
   ["ea", "iː"],
   ["oo", "uː"],
   ["oa", "əʊ"],
   ["oi", "ɔɪ"],
   ["oy", "ɔɪ"],
   ["ai", "eɪ"],
   ["ay", "eɪ"],
   ["au", "ɔː"],
   ["aw", "ɔː"],
   ["ou", "aʊ"],
   ["ar", "ɑː"],
   ["or", "ɔː"],
   ["er", "ɜː"],
   ["ir", "ɜː"],
   ["ur", "ɜː"],
]

const trimStress = (ipa: string) => ipa.replace(STRESS_MARKS, "")

const demotePrimaryStress = (ipa: string) => ipa.replace("ˈ", "ˌ")

const unique = (pronunciations: string[]) =>
   Array.from(new Set(pronunciations)).slice(0, 6)

const combine = (first: string[], second: string[], joiner = "") =>
   unique(
      first.flatMap((firstIpa) =>
         second.map((secondIpa) => `${firstIpa}${joiner}${secondIpa}`)
      )
   )

const endsWithSound = (ipa: string, endings: string[]) => {
   const pronunciation = trimStress(ipa)
   return endings.some((ending) => pronunciation.endsWith(ending))
}

const pluralSuffix = (ipa: string) => {
   if (endsWithSound(ipa, SIBILANT_ENDINGS)) return "ɪz"
   if (endsWithSound(ipa, VOICELESS_ENDINGS)) return "s"
   return "z"
}

const pastSuffix = (ipa: string) => {
   if (endsWithSound(ipa, ["t", "d"])) return "ɪd"
   if (endsWithSound(ipa, VOICELESS_ENDINGS)) return "t"
   return "d"
}

const pronounceInitialism = (word: string) => {
   const names = Array.from(word).map((letter) => LETTER_NAMES[letter])
   if (names.some((name) => !name)) return []
   if (names.length === 1) return [`ˈ${names[0]}`]

   return [`ˌ${names.slice(0, -1).join(".")}ˈ${names.at(-1)}`]
}

const predictInflection = (word: string, dictionary: DictionaryChunk) => {
   const candidates: { base: string; suffix: (ipa: string) => string }[] = []

   if (word.endsWith("'s"))
      candidates.push({ base: word.slice(0, -2), suffix: pluralSuffix })
   if (word.endsWith("'d"))
      candidates.push({ base: word.slice(0, -2), suffix: () => "d" })
   if (word.endsWith("'ll"))
      candidates.push({ base: word.slice(0, -3), suffix: () => "l" })
   if (word.endsWith("'ve"))
      candidates.push({ base: word.slice(0, -3), suffix: () => "v" })
   if (word.endsWith("'re"))
      candidates.push({ base: word.slice(0, -3), suffix: () => "ə" })
   if (word.endsWith("'m"))
      candidates.push({ base: word.slice(0, -2), suffix: () => "m" })

   if (word.endsWith("ied"))
      candidates.push({ base: `${word.slice(0, -3)}y`, suffix: pastSuffix })
   if (word.endsWith("ed")) {
      candidates.push({ base: word.slice(0, -1), suffix: pastSuffix })
      candidates.push({ base: word.slice(0, -2), suffix: pastSuffix })
   }

   if (word.endsWith("ing")) {
      const withoutIng = word.slice(0, -3)
      candidates.push({ base: withoutIng, suffix: () => "ɪŋ" })
      candidates.push({ base: `${withoutIng}e`, suffix: () => "ɪŋ" })
      if (withoutIng.at(-1) === withoutIng.at(-2))
         candidates.push({ base: withoutIng.slice(0, -1), suffix: () => "ɪŋ" })
   }

   if (word.endsWith("ies"))
      candidates.push({ base: `${word.slice(0, -3)}y`, suffix: pluralSuffix })
   if (word.endsWith("es"))
      candidates.push({ base: word.slice(0, -2), suffix: pluralSuffix })
   if (word.endsWith("s"))
      candidates.push({ base: word.slice(0, -1), suffix: pluralSuffix })

   for (const candidate of candidates) {
      const basePronunciations = dictionary[candidate.base]
      if (!basePronunciations?.length) continue

      return unique(
         basePronunciations.map(
            (pronunciation) => `${pronunciation}${candidate.suffix(pronunciation)}`
         )
      )
   }

   return []
}

const predictDerivation = (word: string, dictionary: DictionaryChunk) => {
   const suffixes = [
      { spelling: "ization", ipa: "aɪˈzeɪʃən" },
      { spelling: "isation", ipa: "aɪˈzeɪʃən" },
   ]

   for (const suffix of suffixes) {
      if (!word.endsWith(suffix.spelling)) continue
      const base = word.slice(0, -suffix.spelling.length)
      const basePronunciations = dictionary[base]
      if (!basePronunciations?.length) continue

      return basePronunciations.map(
         (pronunciation) => `${demotePrimaryStress(pronunciation)}${suffix.ipa}`
      )
   }

   if (word.startsWith("re") && word.length > 4) {
      const basePronunciations = dictionary[word.slice(2)]
      if (basePronunciations?.length)
         return basePronunciations.map((pronunciation) => `ˌriː${pronunciation}`)
   }

   return []
}

const predictCompound = (word: string, dictionary: DictionaryChunk) => {
   const candidates: { score: number; pronunciations: string[] }[] = []

   for (let split = 2; split <= word.length - 2; split += 1) {
      const first = dictionary[word.slice(0, split)]
      const second = dictionary[word.slice(split)]
      if (!first?.length || !second?.length) continue

      candidates.push({
         score: Math.min(split, word.length - split),
         pronunciations: combine(first, second.map(demotePrimaryStress)),
      })
   }

   return candidates.sort((a, b) => b.score - a.score)[0]?.pronunciations ?? []
}

const predictFromSpelling = (word: string) => {
   const plainWord = word.replaceAll("'", "")
   if (!plainWord || !/^[a-z]+$/.test(plainWord)) return []

   const magicE = /([aeiou])([^aeiou])e$/.exec(plainWord)
   const magicEIndex = magicE ? plainWord.length - 3 : -1
   const magicEVowels: Record<string, string> = {
      a: "eɪ",
      e: "iː",
      i: "aɪ",
      o: "əʊ",
      u: "juː",
   }
   const letters: Record<string, string> = {
      a: "æ",
      b: "b",
      d: "d",
      e: "e",
      f: "f",
      h: "h",
      i: "ɪ",
      j: "dʒ",
      k: "k",
      l: "l",
      m: "m",
      n: "n",
      o: "ɒ",
      p: "p",
      q: "k",
      r: "r",
      s: "s",
      t: "t",
      u: "ʌ",
      v: "v",
      w: "w",
      x: "ks",
      z: "z",
   }
   let pronunciation = ""

   for (let index = 0; index < plainWord.length; ) {
      if (index === magicEIndex && magicE) {
         pronunciation += magicEVowels[magicE[1]]
         index += 1
         continue
      }
      if (magicE && index === plainWord.length - 1) break

      const remaining = plainWord.slice(index)
      const group = SPELLING_GROUPS.find(([spelling]) =>
         remaining.startsWith(spelling)
      )
      if (group) {
         pronunciation += group[1]
         index += group[0].length
         continue
      }

      const letter = plainWord[index]
      const next = plainWord[index + 1] ?? ""
      if (letter === "c") pronunciation += /[eiy]/.test(next) ? "s" : "k"
      else if (letter === "g") pronunciation += /[eiy]/.test(next) ? "dʒ" : "ɡ"
      else if (letter === "y") pronunciation += index === 0 ? "j" : "i"
      else pronunciation += letters[letter] ?? ""
      index += 1
   }

   return pronunciation ? [`ˈ${pronunciation}`] : []
}

const predictPronunciations = (
   source: string,
   word: string,
   dictionary: DictionaryChunk
) => {
   const inflection = predictInflection(word, dictionary)
   if (inflection.length) return inflection

   const isInitialism =
      (/^[A-Z]{2,5}$/.test(source) || LOWERCASE_INITIALISMS.has(word)) &&
      /^[a-z]+$/.test(word)
   if (isInitialism) return pronounceInitialism(word)

   const derivation = predictDerivation(word, dictionary)
   if (derivation.length) return derivation

   const compound = predictCompound(word, dictionary)
   if (compound.length) return compound

   return predictFromSpelling(word)
}

export const normaliseWord = (word: string) =>
   word.toLocaleLowerCase("en-GB").replaceAll("’", "'").normalize("NFC")

export const normaliseBritishIpa = (ipa: string) =>
   ipa
      .replaceAll(" ", "")
      .replaceAll("ɹ", "r")
      .replaceAll("ɛ", "e")
      .replaceAll("ɐ", "ʌ")
      .replaceAll("g", "ɡ")

export const dictionaryChunkFor = (word: string) => {
   const firstCharacter = normaliseWord(word)[0]

   return firstCharacter && /[a-z]/.test(firstCharacter) ? firstCharacter : "other"
}

export const dictionaryChunksForPrediction = (word: string) => {
   const letters = Array.from(normaliseWord(word)).filter((letter) =>
      /[a-z]/.test(letter)
   )

   return Array.from(new Set(letters.length ? letters : ["other"]))
}

export const wordsInText = (text: string) => {
   const words = text.match(TOKEN_PATTERN) ?? []

   return Array.from(new Set(words.map(normaliseWord)))
}

export const tokeniseWithDictionary = (
   text: string,
   dictionary: DictionaryChunk
): ConvertedToken[] =>
   text
      .split(TOKEN_PATTERN)
      .filter(Boolean)
      .map((source): ConvertedToken => {
         if (!WORD_PATTERN.test(source)) {
            return { type: "separator", source }
         }

         const lookup = normaliseWord(source)
         const dictionaryPronunciations = dictionary[lookup] ?? []
         const pronunciations = dictionaryPronunciations.length
            ? dictionaryPronunciations
            : predictPronunciations(source, lookup, dictionary)

         return {
            type: "word",
            source,
            lookup,
            pronunciations,
            predicted:
               dictionaryPronunciations.length === 0 && pronunciations.length > 0,
         }
      })

export const mergeDictionaryChunks = (chunks: DictionaryChunk[]) =>
   Object.assign({}, ...chunks) as DictionaryChunk
