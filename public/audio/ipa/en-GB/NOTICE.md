# IPA audio sources

## Isolated consonants and monophthongs

The files in `sounds/` identified in
`scripts/ipa/ipa-audio-sources.json` are MP3 derivatives of phonetic samples from
[Wikimedia Commons](https://commons.wikimedia.org/). The source filename is also
the Wikimedia Commons file-page title. The individual source pages provide the
creator, history, and exact licence.

Most of these samples are available under CC BY-SA 3.0 and/or GFDL. No editorial
change was made; the MP3 transcodes were provided by Wikimedia Commons.

- CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/
- GFDL 1.2 or later: https://www.gnu.org/licenses/old-licenses/fdl-1.2.html

## British word and diphthong samples

The files in `words/`, plus the eight diphthongs in `sounds/`, are synthetic
British English speech generated during the site build with the
`en-GB-SoniaNeural` voice. They are not recordings made by the site owner.

## Isolated consonant teaching cues

The WAV files in `isolated/` are generated signal-based teaching cues created
by `scripts/ipa/generate-isolated-consonants.mjs`. They contain no spoken letter
names or carrier vowels. The natural British example word remains available
beside every generated isolated cue.
