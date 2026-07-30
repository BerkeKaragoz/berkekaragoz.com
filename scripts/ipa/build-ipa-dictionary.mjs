import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const [inputPath, outputPath] = process.argv.slice(2)

if (!inputPath || !outputPath) {
   throw new Error(
      "Usage: node scripts/ipa/build-ipa-dictionary.mjs <britfone.csv> <output-directory>"
   )
}

const VOWEL_PATTERN = /[iɪeɛæəɜʌuʊoɔɒaɑ]/
const ALLOWED_ONSETS = new Set([
   "p",
   "b",
   "t",
   "d",
   "k",
   "ɡ",
   "f",
   "v",
   "θ",
   "ð",
   "s",
   "z",
   "ʃ",
   "ʒ",
   "h",
   "tʃ",
   "dʒ",
   "m",
   "n",
   "ŋ",
   "l",
   "r",
   "j",
   "w",
   "pl",
   "pr",
   "bl",
   "br",
   "tr",
   "dr",
   "kl",
   "kr",
   "ɡl",
   "ɡr",
   "fl",
   "fr",
   "θr",
   "ʃr",
   "sp",
   "st",
   "sk",
   "sm",
   "sn",
   "sl",
   "sw",
   "tw",
   "dw",
   "kw",
   "ɡw",
   "pj",
   "bj",
   "tj",
   "dj",
   "kj",
   "ɡj",
   "fj",
   "vj",
   "mj",
   "nj",
   "lj",
   "hj",
   "spl",
   "spr",
   "str",
   "skr",
   "skw",
])

const normaliseToken = (token) =>
   token
      .replaceAll("ɹ", "r")
      .replaceAll("ɛ", "e")
      .replaceAll("ɐ", "ʌ")
      .replaceAll("g", "ɡ")

const normaliseIpa = (value) => {
   const rawTokens = value.trim().split(/\s+/).filter(Boolean)
   const tokens = rawTokens.map((token) =>
      normaliseToken(token.replace(/[ˈˌ]/g, ""))
   )
   const stressAt = new Map()
   let previousVowel = -1

   for (let index = 0; index < rawTokens.length; index++) {
      const token = rawTokens[index]
      const stress = token.includes("ˈ") ? "ˈ" : token.includes("ˌ") ? "ˌ" : ""
      const isVowel = VOWEL_PATTERN.test(tokens[index])

      if (stress) {
         let onsetStart = index

         if (previousVowel < 0) {
            onsetStart = 0
         } else {
            for (let candidate = previousVowel + 1; candidate < index; candidate++) {
               const onset = tokens.slice(candidate, index).join("")
               if (ALLOWED_ONSETS.has(onset)) {
                  onsetStart = candidate
                  break
               }
            }
         }

         stressAt.set(onsetStart, stress)
      }

      if (isVowel) previousVowel = index
   }

   return tokens
      .map((token, index) => `${stressAt.get(index) ?? ""}${token}`)
      .join("")
}

const normaliseHeadword = (value) =>
   value
      .trim()
      .replace(/\(\d+\)$/, "")
      .replaceAll("_", " ")
      .toLocaleLowerCase("en-GB")

const source = await readFile(inputPath, "utf8")
const chunks = Object.fromEntries(
   [..."abcdefghijklmnopqrstuvwxyz", "other"].map((letter) => [
      letter,
      Object.create(null),
   ])
)

for (const line of source.split(/\r?\n/)) {
   const separator = line.indexOf(",")

   if (separator < 1) continue

   const word = normaliseHeadword(line.slice(0, separator))
   const ipa = normaliseIpa(line.slice(separator + 1))
   if (!word || !ipa) continue

   const firstCharacter = word[0]
   const chunk = /[a-z]/.test(firstCharacter) ? firstCharacter : "other"
   const pronunciations = chunks[chunk][word] ?? []

   if (!pronunciations.includes(ipa)) pronunciations.push(ipa)
   chunks[chunk][word] = pronunciations
}

await mkdir(outputPath, { recursive: true })

await Promise.all(
   Object.entries(chunks).map(([letter, entries]) =>
      writeFile(
         path.join(outputPath, `${letter}.json`),
         JSON.stringify(entries),
         "utf8"
      )
   )
)

const entryCount = Object.values(chunks).reduce(
   (total, chunk) => total + Object.keys(chunk).length,
   0
)

console.log(`Built ${entryCount.toLocaleString("en-GB")} British IPA entries.`)
