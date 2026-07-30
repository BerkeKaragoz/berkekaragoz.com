# PRD: English IPA Sound Lab

**Status:** Draft  
**Product route:** `berkekaragoz.com/ipa`  
**Priority accent:** British English (`en-GB`)  
**Implementation:** Frontend-first, static Next.js application  
**Updated:** 29 July 2026

## 1. Product

English IPA Sound Lab teaches the IPA symbols used for British English and converts English text into broad IPA.

A learner can:

- hear each sound alone;
- hear the sound inside a familiar word;
- learn how to position the lips, tongue, and voice;
- compare commonly confused sounds;
- convert words or short text into IPA; and
- play a converted word or phrase when a British device voice is available.

The UI calls them **IPA symbols**, not “IPA letters.”

## 2. Accent

The MVP uses a standard non-rhotic British reference accent based on contemporary Standard Southern British English. It is labelled:

> British English — standard, non-rhotic

British English is not one uniform accent. The product must acknowledge regional UK variation and must not mark a different British accent as “wrong.”

American English is out of scope for the MVP.

## 3. MVP

### Included

- A short IPA introduction.
- A searchable British English sound chart.
- One lesson for each sound.
- Separate **Sound** and **In word** controls.
- Static, reviewed audio for every core sound and example word.
- A client-side English-to-IPA converter.
- Alternative pronunciations for ambiguous words.
- Copy IPA.
- Optional device playback for converted words and phrases.
- Responsive and keyboard-accessible UI.

### Not included

- User accounts or saved progress.
- A database.
- Runtime API routes.
- Server-side text conversion.
- Server-side text-to-speech.
- Microphone recording or pronunciation grading.
- Complete coverage of regional UK accents.
- Automatic transcription of every name or invented word.
- Analytics containing user text.

## 4. Main screens

### Learn

Explain:

- IPA symbols represent sounds, not spellings;
- `/slashes/` show broad phonemic transcription;
- `ˈ` marks primary stress;
- `ˌ` marks secondary stress;
- `ː` marks length in the chosen British convention; and
- pronunciation changes between accents.

The introduction should take no more than a few minutes and must be skippable.

### Sounds

Display the sound inventory in three groups:

- consonants;
- monophthongs; and
- diphthongs.

Each tile shows:

- the IPA symbol;
- a familiar example word;
- a play button; and
- a variation badge where needed.

Users can search by symbol, example, common spelling, or sound name.

### Sound lesson

Each lesson contains:

- a large IPA symbol;
- **Sound** audio;
- **In word** audio;
- one primary example and two secondary examples;
- broad IPA for each example;
- a short mouth-position explanation;
- common spellings, clearly presented as patterns rather than rules; and
- one commonly confused sound or minimal pair.

For stops such as `/p/` and `/t/`, the isolated clip should contain the release without teaching an added vowel such as “puh” or “tuh.”

### Converter

The user can enter up to 500 characters.

The result:

- preserves punctuation and word order;
- aligns each word with its IPA;
- shows stress marks;
- offers known pronunciation alternatives;
- marks uncertain or unknown words; and
- lets the user inspect the sounds inside a converted word.

Actions:

- **Play word**
- **Play all**
- **Copy IPA**
- **Clear**

## 5. British sound inventory

The content baseline is the familiar 44-sound British teaching inventory. A qualified British English phonetician must approve the final examples and transcriptions.

### Consonants

`/p/` pen, `/b/` bed, `/t/` tea, `/d/` day, `/k/` key, `/ɡ/` go

`/f/` fan, `/v/` van, `/θ/` thin, `/ð/` then, `/s/` sip, `/z/` zip

`/ʃ/` ship, `/ʒ/` vision, `/h/` hat, `/tʃ/` chin, `/dʒ/` jam

`/m/` map, `/n/` nap, `/ŋ/` sing

`/l/` light, `/r/` red, `/j/` yes, `/w/` wet

The `/r/` lesson explains that this reference accent pronounces `/r/` before a vowel but not normally at the end of “car.” The synthesis layer may map conventional phonemic `/r/` to phonetic `[ɹ]`.

### Monophthongs

`/iː/` see, `/ɪ/` sit, `/e/` bed, `/æ/` cat

`/ɑː/` father, `/ɒ/` hot, `/ɔː/` thought

`/ʊ/` book, `/uː/` blue, `/ʌ/` cup

`/ɜː/` bird, `/ə/` about

### Diphthongs

`/eɪ/` say, `/aɪ/` my, `/ɔɪ/` boy, `/əʊ/` go, `/aʊ/` now

`/ɪə/` near, `/eə/` square, `/ʊə/` cure

The lessons for `/ɪə/`, `/eə/`, and `/ʊə/` must explain that many contemporary British speakers merge or realise these vowels differently. Displayed IPA and audio must match the chosen reference voice.

## 6. Frontend-only architecture

The deployed product should be static. It requires no application server after the site is built.

```text
Static Next.js page
  ├─ IPA lesson data
  ├─ reviewed MP3 audio
  ├─ British IPA dictionary chunks
  ├─ client-side converter
  └─ browser/OS speech synthesis
```

### Static content

Store lesson content in typed data:

```text
src/data/ipa/en-GB/sounds.ts
src/data/ipa/en-GB/examples.ts
```

Store approved audio under:

```text
public/audio/ipa/en-GB/
```

Store the converter dictionary as lazy-loaded static files:

```text
public/data/ipa/en-GB/a.json
public/data/ipa/en-GB/b.json
...
```

Splitting by first character prevents the browser from downloading the complete dictionary on first load.

### Client-side converter

The browser:

1. normalises input and punctuation;
2. tokenises the text;
3. loads the required dictionary chunks;
4. looks up each word;
5. applies a small set of tested rules for common inflections;
6. presents alternatives for heteronyms such as “read,” “lead,” and “record”;
7. marks missing words as **Unknown**; and
8. assembles the display transcription.

The converter must not invent a confident transcription for an unknown word.

A WebAssembly `en-GB` phonemizer may be added later for unknown words. Its output must be labelled **Estimated**, and its licence and download size must be reviewed first.

### Device speech

Use the Web Speech API only for arbitrary converted words and phrases:

```ts
const utterance = new SpeechSynthesisUtterance(text)
utterance.lang = "en-GB"
```

Select an available voice whose language begins with `en-GB`. Never silently fall back to an American voice.

Device voices differ between browsers and operating systems. Therefore:

- device playback is supplementary;
- core lessons always use reviewed static audio;
- the UI labels it **Device voice**;
- the user can choose among available British voices; and
- if no British voice exists, arbitrary-text playback is disabled with a clear explanation.

The application has no speech API key. The browser or operating system may process device speech according to its own terms, so the UI must not promise that device playback is always offline.

## 7. Audio production

The creator does not need to record anything.

Before deployment:

1. Generate candidate clips with an IPA-aware British speech voice, or locate a correctly licensed web recording.
2. Review every clip for accent, target sound, unwanted vowels, stress, noise, and clipping.
3. Export approved clips as static MP3 files.
4. Record source, voice or speaker, licence, and review status in `audio-manifest.json`.

Generated audio is preferred because it keeps the voice consistent. Wikimedia Commons is a fallback, but every file has its own licence and attribution requirements.

The International Phonetic Association chart may be used for comparison. Its audio must not be copied unless the exact reuse terms permit it.

## 8. Minimal data model

```ts
type Sound = {
   id: string
   symbol: string
   category: "consonant" | "monophthong" | "diphthong"
   example: string
   exampleIpa: string
   instructions: string[]
   commonSpellings: string[]
   confusedWith: string[]
   soundAudio: string
   wordAudio: string
   variationNote?: string
}

type DictionaryEntry = {
   word: string
   pronunciations: Array<{
      ipa: string
      label?: string
   }>
}
```

## 9. Accessibility and privacy

- Nothing autoplays.
- All controls work with keyboard, touch, and pointer.
- Play buttons include the symbol, example, and accent in their accessible name.
- Playback state is announced to screen readers.
- IPA uses a font that supports all required symbols and combining marks.
- Instructions accompany every sound; audio is never the only explanation.
- Meaning does not depend on colour alone.
- User input stays in browser memory and is not saved by the application.
- `localStorage` may store only preferences such as the selected device voice.

## 10. Acceptance criteria

The MVP is ready when:

- all 44 sound lessons are present;
- every lesson has reviewed Sound and In word audio;
- every lesson identifies the British reference accent;
- the converter runs entirely in the browser;
- dictionary data loads only when required;
- punctuation, stress, alternatives, and unknown words display correctly;
- no runtime API or database is required;
- core sound playback works even when device speech is unavailable;
- no American voice is selected as a silent fallback; and
- keyboard and screen-reader review passes.

## 11. Build order

1. Approve the British sound inventory and five sample audio clips.
2. Build the Sounds grid and sound lesson.
3. Complete and review the 44 lessons.
4. Prepare the static British IPA dictionary.
5. Build the client-side converter.
6. Add optional `en-GB` device speech.
7. Complete accessibility, licence, and content review.

## 12. References

- [Wiktionary English pronunciation guide](https://en.wiktionary.org/wiki/Appendix:English_pronunciation)
- [Wiktextract](https://github.com/tatuylonen/wiktextract)
- [Wiktionary reuse terms](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)
- [Web Speech API specification](https://webaudio.github.io/web-speech-api/)
- [eSpeak NG WebAssembly phonemizer](https://espeak-ng.com/)
- [Azure IPA SSML support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-pronunciation)
- [Amazon Polly IPA support](https://docs.aws.amazon.com/polly/latest/dg/phoneme-tag.html)
- [International Phonetic Association interactive chart](https://www.internationalphoneticassociation.org/IPAcharts/IPA_charts_TI/IPA_charts_TI.html)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
