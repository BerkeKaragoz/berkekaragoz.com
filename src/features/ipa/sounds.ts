export type SoundCategory = "consonant" | "monophthong" | "diphthong"

export type IpaSound = {
   id: string
   symbol: string
   name: string
   category: SoundCategory
   example: string
   exampleIpa: string
   instructions: [string, string, string]
   spellings: string[]
   confusedWith: string[]
   variationNote?: string
   soundAudio: string
   wordAudio: string
}

type SoundInput = Omit<IpaSound, "soundAudio" | "wordAudio">

const sound = (input: SoundInput): IpaSound =>
   Object.assign({}, input, {
      soundAudio: `/audio/ipa/en-GB/sounds/${input.id}.mp3`,
      wordAudio: `/audio/ipa/en-GB/words/${input.id}.mp3`,
   })

export const IPA_SOUNDS: IpaSound[] = [
   sound({
      id: "p",
      symbol: "p",
      name: "voiceless bilabial stop",
      category: "consonant",
      example: "pen",
      exampleIpa: "pen",
      instructions: [
         "Close both lips.",
         "Build a little air behind them.",
         "Release the air without using your voice.",
      ],
      spellings: ["p", "pp"],
      confusedWith: ["b"],
   }),
   sound({
      id: "b",
      symbol: "b",
      name: "voiced bilabial stop",
      category: "consonant",
      example: "bed",
      exampleIpa: "bed",
      instructions: [
         "Close both lips.",
         "Use your voice while holding the air.",
         "Open the lips with a short release.",
      ],
      spellings: ["b", "bb"],
      confusedWith: ["p"],
   }),
   sound({
      id: "t",
      symbol: "t",
      name: "voiceless alveolar stop",
      category: "consonant",
      example: "tea",
      exampleIpa: "tiː",
      instructions: [
         "Touch the tongue tip to the ridge behind your upper teeth.",
         "Hold the air briefly.",
         "Release without using your voice.",
      ],
      spellings: ["t", "tt", "-ed"],
      confusedWith: ["d"],
   }),
   sound({
      id: "d",
      symbol: "d",
      name: "voiced alveolar stop",
      category: "consonant",
      example: "day",
      exampleIpa: "deɪ",
      instructions: [
         "Touch the tongue tip to the ridge behind your upper teeth.",
         "Use your voice while holding the air.",
         "Release the tongue cleanly.",
      ],
      spellings: ["d", "dd", "-ed"],
      confusedWith: ["t"],
   }),
   sound({
      id: "k",
      symbol: "k",
      name: "voiceless velar stop",
      category: "consonant",
      example: "key",
      exampleIpa: "kiː",
      instructions: [
         "Lift the back of your tongue to the soft roof of your mouth.",
         "Hold the air briefly.",
         "Release without using your voice.",
      ],
      spellings: ["c", "k", "ck", "ch"],
      confusedWith: ["g"],
   }),
   sound({
      id: "g",
      symbol: "ɡ",
      name: "voiced velar stop",
      category: "consonant",
      example: "go",
      exampleIpa: "ɡəʊ",
      instructions: [
         "Lift the back of your tongue to the soft roof of your mouth.",
         "Use your voice while holding the air.",
         "Release the tongue cleanly.",
      ],
      spellings: ["g", "gg", "gh"],
      confusedWith: ["k"],
   }),
   sound({
      id: "f",
      symbol: "f",
      name: "voiceless labiodental fricative",
      category: "consonant",
      example: "fan",
      exampleIpa: "fæn",
      instructions: [
         "Rest your upper teeth lightly on your lower lip.",
         "Push air through the narrow gap.",
         "Keep your voice off.",
      ],
      spellings: ["f", "ff", "ph", "gh"],
      confusedWith: ["v"],
   }),
   sound({
      id: "v",
      symbol: "v",
      name: "voiced labiodental fricative",
      category: "consonant",
      example: "van",
      exampleIpa: "væn",
      instructions: [
         "Rest your upper teeth lightly on your lower lip.",
         "Push air through the narrow gap.",
         "Use your voice so your throat vibrates.",
      ],
      spellings: ["v", "ve", "f"],
      confusedWith: ["f"],
   }),
   sound({
      id: "theta",
      symbol: "θ",
      name: "voiceless dental fricative",
      category: "consonant",
      example: "thin",
      exampleIpa: "θɪn",
      instructions: [
         "Place the tongue tip lightly between or behind your teeth.",
         "Let a steady stream of air pass.",
         "Keep your voice off.",
      ],
      spellings: ["th"],
      confusedWith: ["eth", "s", "f"],
   }),
   sound({
      id: "eth",
      symbol: "ð",
      name: "voiced dental fricative",
      category: "consonant",
      example: "then",
      exampleIpa: "ðen",
      instructions: [
         "Place the tongue tip lightly between or behind your teeth.",
         "Let air pass through the gap.",
         "Use your voice so your throat vibrates.",
      ],
      spellings: ["th"],
      confusedWith: ["theta", "z", "v"],
   }),
   sound({
      id: "s",
      symbol: "s",
      name: "voiceless alveolar fricative",
      category: "consonant",
      example: "sip",
      exampleIpa: "sɪp",
      instructions: [
         "Bring the tongue close to the ridge behind your teeth.",
         "Send air through the narrow centre channel.",
         "Keep your voice off.",
      ],
      spellings: ["s", "ss", "c", "sc"],
      confusedWith: ["z", "theta"],
   }),
   sound({
      id: "z",
      symbol: "z",
      name: "voiced alveolar fricative",
      category: "consonant",
      example: "zip",
      exampleIpa: "zɪp",
      instructions: [
         "Bring the tongue close to the ridge behind your teeth.",
         "Send air through the narrow centre channel.",
         "Use your voice.",
      ],
      spellings: ["z", "zz", "s", "x"],
      confusedWith: ["s", "eth"],
   }),
   sound({
      id: "sh",
      symbol: "ʃ",
      name: "voiceless postalveolar fricative",
      category: "consonant",
      example: "ship",
      exampleIpa: "ʃɪp",
      instructions: [
         "Raise the front of your tongue just behind the tooth ridge.",
         "Round your lips slightly.",
         "Push air out without using your voice.",
      ],
      spellings: ["sh", "ti", "ci", "ssi", "ch"],
      confusedWith: ["zh", "s"],
   }),
   sound({
      id: "zh",
      symbol: "ʒ",
      name: "voiced postalveolar fricative",
      category: "consonant",
      example: "vision",
      exampleIpa: "ˈvɪʒ.ən",
      instructions: [
         "Raise the front of your tongue just behind the tooth ridge.",
         "Round your lips slightly.",
         "Push air out while using your voice.",
      ],
      spellings: ["s", "si", "ge"],
      confusedWith: ["sh", "dzh"],
   }),
   sound({
      id: "h",
      symbol: "h",
      name: "voiceless glottal fricative",
      category: "consonant",
      example: "hat",
      exampleIpa: "hæt",
      instructions: [
         "Keep your mouth ready for the next vowel.",
         "Let breath pass through the open throat.",
         "Do not vibrate your voice.",
      ],
      spellings: ["h", "wh"],
      confusedWith: [],
   }),
   sound({
      id: "tsh",
      symbol: "tʃ",
      name: "voiceless postalveolar affricate",
      category: "consonant",
      example: "chin",
      exampleIpa: "tʃɪn",
      instructions: [
         "Begin with the tongue in the /t/ position.",
         "Release directly into /ʃ/.",
         "Keep your voice off.",
      ],
      spellings: ["ch", "tch", "t"],
      confusedWith: ["dzh", "sh"],
   }),
   sound({
      id: "dzh",
      symbol: "dʒ",
      name: "voiced postalveolar affricate",
      category: "consonant",
      example: "jam",
      exampleIpa: "dʒæm",
      instructions: [
         "Begin with the tongue in the /d/ position.",
         "Release directly into /ʒ/.",
         "Use your voice throughout.",
      ],
      spellings: ["j", "g", "ge", "dge"],
      confusedWith: ["tsh", "zh"],
   }),
   sound({
      id: "m",
      symbol: "m",
      name: "bilabial nasal",
      category: "consonant",
      example: "map",
      exampleIpa: "mæp",
      instructions: [
         "Close both lips.",
         "Use your voice.",
         "Let the air leave through your nose.",
      ],
      spellings: ["m", "mm", "mb"],
      confusedWith: ["n"],
   }),
   sound({
      id: "n",
      symbol: "n",
      name: "alveolar nasal",
      category: "consonant",
      example: "nap",
      exampleIpa: "næp",
      instructions: [
         "Touch the tongue tip to the ridge behind your teeth.",
         "Use your voice.",
         "Let the air leave through your nose.",
      ],
      spellings: ["n", "nn", "kn", "gn"],
      confusedWith: ["m", "ng"],
   }),
   sound({
      id: "ng",
      symbol: "ŋ",
      name: "velar nasal",
      category: "consonant",
      example: "sing",
      exampleIpa: "sɪŋ",
      instructions: [
         "Lift the back of your tongue to the soft roof of your mouth.",
         "Use your voice.",
         "Let air leave through your nose without adding /ɡ/.",
      ],
      spellings: ["ng", "n"],
      confusedWith: ["n", "g"],
   }),
   sound({
      id: "l",
      symbol: "l",
      name: "alveolar lateral approximant",
      category: "consonant",
      example: "light",
      exampleIpa: "laɪt",
      instructions: [
         "Touch the tongue tip to the ridge behind your teeth.",
         "Use your voice.",
         "Let air pass around the sides of the tongue.",
      ],
      spellings: ["l", "ll"],
      confusedWith: ["r"],
   }),
   sound({
      id: "r",
      symbol: "r",
      name: "postalveolar approximant",
      category: "consonant",
      example: "red",
      exampleIpa: "red",
      instructions: [
         "Raise the tongue towards the area behind the tooth ridge.",
         "Do not let the tongue touch the roof.",
         "Use your voice with relaxed lips.",
      ],
      spellings: ["r", "rr", "wr"],
      confusedWith: ["l"],
      variationNote:
         "In this non-rhotic reference accent, /r/ is heard before a vowel but not normally at the end of car.",
   }),
   sound({
      id: "j",
      symbol: "j",
      name: "palatal approximant",
      category: "consonant",
      example: "yes",
      exampleIpa: "jes",
      instructions: [
         "Raise the middle of your tongue towards the hard roof.",
         "Keep a narrow but open passage.",
         "Use your voice and glide quickly into the vowel.",
      ],
      spellings: ["y", "i", "u"],
      confusedWith: ["i-long"],
   }),
   sound({
      id: "w",
      symbol: "w",
      name: "labial-velar approximant",
      category: "consonant",
      example: "wet",
      exampleIpa: "wet",
      instructions: [
         "Round your lips closely.",
         "Raise the back of your tongue slightly.",
         "Use your voice and glide into the next vowel.",
      ],
      spellings: ["w", "wh", "u"],
      confusedWith: ["v"],
   }),
   sound({
      id: "i-long",
      symbol: "iː",
      name: "FLEECE vowel",
      category: "monophthong",
      example: "see",
      exampleIpa: "siː",
      instructions: [
         "Spread your lips gently.",
         "Raise the front of your tongue high.",
         "Use your voice and hold the vowel steadily.",
      ],
      spellings: ["ee", "ea", "e", "ie", "ei"],
      confusedWith: ["i-short"],
   }),
   sound({
      id: "i-short",
      symbol: "ɪ",
      name: "KIT vowel",
      category: "monophthong",
      example: "sit",
      exampleIpa: "sɪt",
      instructions: [
         "Keep your lips relaxed.",
         "Raise the front of your tongue, but lower than /iː/.",
         "Make the sound short and relaxed.",
      ],
      spellings: ["i", "y", "e", "ui"],
      confusedWith: ["i-long", "schwa"],
   }),
   sound({
      id: "e",
      symbol: "e",
      name: "DRESS vowel",
      category: "monophthong",
      example: "bed",
      exampleIpa: "bed",
      instructions: [
         "Keep your lips loosely spread.",
         "Hold the front of your tongue at mid height.",
         "Use a short, steady voiced sound.",
      ],
      spellings: ["e", "ea", "a"],
      confusedWith: ["ash", "i-short"],
   }),
   sound({
      id: "ash",
      symbol: "æ",
      name: "TRAP vowel",
      category: "monophthong",
      example: "cat",
      exampleIpa: "kæt",
      instructions: [
         "Open your mouth widely.",
         "Keep the tongue low and towards the front.",
         "Use your voice without rounding your lips.",
      ],
      spellings: ["a"],
      confusedWith: ["e", "strut"],
   }),
   sound({
      id: "alpha-long",
      symbol: "ɑː",
      name: "PALM vowel",
      category: "monophthong",
      example: "father",
      exampleIpa: "ˈfɑː.ðə",
      instructions: [
         "Open your mouth.",
         "Keep the tongue low and towards the back.",
         "Use your voice and hold the vowel.",
      ],
      spellings: ["a", "ar", "al"],
      confusedWith: ["lot", "strut"],
   }),
   sound({
      id: "lot",
      symbol: "ɒ",
      name: "LOT vowel",
      category: "monophthong",
      example: "hot",
      exampleIpa: "hɒt",
      instructions: [
         "Open your mouth.",
         "Keep the tongue low and back.",
         "Round the lips lightly and keep the sound short.",
      ],
      spellings: ["o", "a"],
      confusedWith: ["thought", "alpha-long"],
   }),
   sound({
      id: "thought",
      symbol: "ɔː",
      name: "THOUGHT vowel",
      category: "monophthong",
      example: "thought",
      exampleIpa: "θɔːt",
      instructions: [
         "Round your lips.",
         "Keep the back of your tongue at mid-low height.",
         "Use your voice and hold the vowel.",
      ],
      spellings: ["or", "aw", "au", "ough", "oor"],
      confusedWith: ["lot", "cure"],
   }),
   sound({
      id: "foot",
      symbol: "ʊ",
      name: "FOOT vowel",
      category: "monophthong",
      example: "book",
      exampleIpa: "bʊk",
      instructions: [
         "Round your lips loosely.",
         "Raise the back of your tongue.",
         "Keep the vowel short and relaxed.",
      ],
      spellings: ["oo", "u", "ou", "o"],
      confusedWith: ["u-long", "strut"],
   }),
   sound({
      id: "u-long",
      symbol: "uː",
      name: "GOOSE vowel",
      category: "monophthong",
      example: "blue",
      exampleIpa: "bluː",
      instructions: [
         "Round your lips.",
         "Raise the back of your tongue high.",
         "Use your voice and hold the vowel steadily.",
      ],
      spellings: ["oo", "u", "ue", "ew", "ou"],
      confusedWith: ["foot"],
   }),
   sound({
      id: "strut",
      symbol: "ʌ",
      name: "STRUT vowel",
      category: "monophthong",
      example: "cup",
      exampleIpa: "kʌp",
      instructions: [
         "Keep your lips neutral.",
         "Hold the tongue low and central.",
         "Use a short, stressed voiced sound.",
      ],
      spellings: ["u", "o", "ou", "oo"],
      confusedWith: ["schwa", "ash", "foot"],
   }),
   sound({
      id: "nurse",
      symbol: "ɜː",
      name: "NURSE vowel",
      category: "monophthong",
      example: "bird",
      exampleIpa: "bɜːd",
      instructions: [
         "Keep your lips neutral.",
         "Hold the tongue in the middle of the mouth.",
         "Use your voice and hold the vowel without an /r/.",
      ],
      spellings: ["ir", "ur", "er", "ear", "or"],
      confusedWith: ["schwa"],
   }),
   sound({
      id: "schwa",
      symbol: "ə",
      name: "schwa",
      category: "monophthong",
      example: "about",
      exampleIpa: "əˈbaʊt",
      instructions: [
         "Relax your lips and jaw.",
         "Leave the tongue in the centre.",
         "Make a very short, unstressed voiced sound.",
      ],
      spellings: ["a", "e", "i", "o", "u"],
      confusedWith: ["strut", "nurse"],
   }),
   sound({
      id: "face",
      symbol: "eɪ",
      name: "FACE diphthong",
      category: "diphthong",
      example: "say",
      exampleIpa: "seɪ",
      instructions: [
         "Begin around the /e/ position.",
         "Glide upwards towards /ɪ/.",
         "Keep your voice on through one continuous vowel.",
      ],
      spellings: ["a", "ai", "ay", "ea", "ei"],
      confusedWith: ["e"],
   }),
   sound({
      id: "price",
      symbol: "aɪ",
      name: "PRICE diphthong",
      category: "diphthong",
      example: "my",
      exampleIpa: "maɪ",
      instructions: [
         "Begin with the mouth open and tongue low.",
         "Glide towards the high-front /ɪ/ position.",
         "Keep the movement smooth and voiced.",
      ],
      spellings: ["i", "y", "igh", "ie", "uy"],
      confusedWith: ["mouth"],
   }),
   sound({
      id: "choice",
      symbol: "ɔɪ",
      name: "CHOICE diphthong",
      category: "diphthong",
      example: "boy",
      exampleIpa: "bɔɪ",
      instructions: [
         "Begin with rounded lips near /ɔː/.",
         "Glide towards the high-front /ɪ/ position.",
         "Unround the lips during the glide.",
      ],
      spellings: ["oi", "oy"],
      confusedWith: ["thought"],
   }),
   sound({
      id: "goat",
      symbol: "əʊ",
      name: "GOAT diphthong",
      category: "diphthong",
      example: "go",
      exampleIpa: "ɡəʊ",
      instructions: [
         "Begin with a relaxed central vowel.",
         "Glide towards /ʊ/.",
         "Round your lips as the sound finishes.",
      ],
      spellings: ["o", "oa", "ow", "oe", "ough"],
      confusedWith: ["thought", "schwa"],
   }),
   sound({
      id: "mouth",
      symbol: "aʊ",
      name: "MOUTH diphthong",
      category: "diphthong",
      example: "now",
      exampleIpa: "naʊ",
      instructions: [
         "Begin with your mouth open and tongue low.",
         "Glide towards /ʊ/.",
         "Round your lips as the sound finishes.",
      ],
      spellings: ["ou", "ow"],
      confusedWith: ["price"],
   }),
   sound({
      id: "near",
      symbol: "ɪə",
      name: "NEAR diphthong",
      category: "diphthong",
      example: "near",
      exampleIpa: "nɪə",
      instructions: [
         "Begin near the short /ɪ/ position.",
         "Glide towards a relaxed schwa.",
         "Do not add a final /r/ in this reference accent.",
      ],
      spellings: ["ear", "eer", "ere", "ier"],
      confusedWith: ["i-short", "nurse"],
      variationNote:
         "Many contemporary English speakers use a smoother or more monophthongal vowel here.",
   }),
   sound({
      id: "square",
      symbol: "eə",
      name: "SQUARE diphthong",
      category: "diphthong",
      example: "square",
      exampleIpa: "skweə",
      instructions: [
         "Begin near the /e/ position.",
         "Glide towards a relaxed schwa.",
         "Do not add a final /r/ in this reference accent.",
      ],
      spellings: ["air", "are", "ear", "ere"],
      confusedWith: ["e", "nurse"],
      variationNote:
         "Many contemporary English speakers use a long monophthong rather than a clear glide.",
   }),
   sound({
      id: "cure",
      symbol: "ʊə",
      name: "CURE diphthong",
      category: "diphthong",
      example: "cure",
      exampleIpa: "kjʊə",
      instructions: [
         "Begin near the short /ʊ/ position.",
         "Glide towards a relaxed schwa.",
         "Keep the movement voiced and do not add a final /r/.",
      ],
      spellings: ["ure", "our", "oor"],
      confusedWith: ["foot", "thought"],
      variationNote:
         "This sound is increasingly merged with /ɔː/ in words such as cure and poor.",
   }),
]

export const SOUND_BY_ID = new Map(IPA_SOUNDS.map((item) => [item.id, item]))

export const CATEGORY_LABELS: Record<SoundCategory, string> = {
   consonant: "Consonants",
   monophthong: "Monophthongs",
   diphthong: "Diphthongs",
}

const GUIDE_CATEGORY_ORDER: Record<SoundCategory, number> = {
   consonant: 0,
   monophthong: 1,
   diphthong: 2,
}

const GUIDE_SOUND_CUES: Record<string, string> = {
   p: "p",
   b: "b",
   t: "t",
   d: "d",
   k: "k",
   g: "g",
   f: "f",
   v: "v",
   theta: "th",
   eth: "th",
   s: "s",
   z: "z",
   sh: "sh",
   zh: "zh",
   h: "h",
   tsh: "ch",
   dzh: "j",
   m: "m",
   n: "n",
   ng: "ng",
   l: "l",
   r: "r",
   j: "y",
   w: "w",
   "i-long": "ee",
   "i-short": "i",
   e: "e",
   ash: "a",
   "alpha-long": "ar",
   lot: "o",
   thought: "or",
   foot: "oo",
   "u-long": "oo",
   strut: "u",
   nurse: "er",
   schwa: "uh",
   face: "a",
   price: "i",
   choice: "oy",
   goat: "o",
   mouth: "ow",
   near: "ear",
   square: "air",
   cure: "ure",
}

const GUIDE_COLLATOR = new Intl.Collator("en-GB", {
   sensitivity: "base",
})

export const sortSoundsForGuide = (sounds: IpaSound[]): IpaSound[] =>
   [...sounds].sort((first, second) => {
      const categoryDifference =
         GUIDE_CATEGORY_ORDER[first.category] - GUIDE_CATEGORY_ORDER[second.category]

      if (categoryDifference) return categoryDifference

      const cueDifference = GUIDE_COLLATOR.compare(
         GUIDE_SOUND_CUES[first.id] ?? first.example,
         GUIDE_SOUND_CUES[second.id] ?? second.example
      )

      return cueDifference || GUIDE_COLLATOR.compare(first.example, second.example)
   })

const IPA_MARKS = new Set(["ˈ", "ˌ", ".", " ", "/"])

export const splitIpaIntoSounds = (ipa: string): IpaSound[] => {
   const matches: IpaSound[] = []
   const candidates = [...IPA_SOUNDS].sort(
      (first, second) => second.symbol.length - first.symbol.length
   )
   let remaining = ipa

   while (remaining.length > 0) {
      const mark = remaining[0]

      if (IPA_MARKS.has(mark)) {
         remaining = remaining.slice(1)
         continue
      }

      const match = candidates.find((item) => remaining.startsWith(item.symbol))

      if (match) {
         matches.push(match)
         remaining = remaining.slice(match.symbol.length)
         continue
      }

      // Britfone uses strict phonetic symbols for a few conventional British
      // teaching symbols. Normalise them only when breaking down a word.
      const alias: Record<string, string> = {
         ɹ: "r",
         ɛ: "e",
         ɐ: "ʌ",
      }
      const normalised = alias[mark]
      const aliasMatch = normalised
         ? candidates.find((item) => item.symbol === normalised)
         : undefined

      if (aliasMatch) matches.push(aliasMatch)
      remaining = remaining.slice(1)
   }

   return matches
}
