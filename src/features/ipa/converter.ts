export type DictionaryChunk = Record<string, string[]>

export type ConvertedToken =
   | {
        type: "word"
        source: string
        lookup: string
        pronunciations: string[]
     }
   | {
        type: "separator"
        source: string
     }

const TOKEN_PATTERN = /([A-Za-z]+(?:['’][A-Za-z]+)*)/g
const WORD_PATTERN = /^[A-Za-z]+(?:['’][A-Za-z]+)*$/

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

         return {
            type: "word",
            source,
            lookup,
            pronunciations: dictionary[lookup] ?? [],
         }
      })

export const mergeDictionaryChunks = (chunks: DictionaryChunk[]) =>
   Object.assign({}, ...chunks) as DictionaryChunk
