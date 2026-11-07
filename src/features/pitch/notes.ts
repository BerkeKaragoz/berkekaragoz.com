const A4_MIDI = 69
const A4_HZ = 440

const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
const NATURALS = [
   true,
   false,
   true,
   false,
   true,
   true,
   false,
   true,
   false,
   true,
   false,
   true,
]

/** Fractional midi number of a frequency (69 = A4 = 440 Hz). */
export const hzToMidi = (hz: number) => A4_MIDI + 12 * Math.log2(hz / A4_HZ)

export const midiToHz = (midi: number) => A4_HZ * 2 ** ((midi - A4_MIDI) / 12)

/** The equal-tempered note nearest to a fractional midi number. */
export const nearestNote = (midi: number) => Math.round(midi)

const pitchClass = (note: number) => ((note % 12) + 12) % 12

/** Name of the note nearest to `midi`, with octave: 61 → "C♯4". */
export const noteName = (midi: number) => {
   const note = nearestNote(midi)
   return `${NOTE_NAMES[pitchClass(note)]}${Math.floor(note / 12) - 1}`
}

/** Cents from `from` to `to` (positive when `to` is higher). */
export const centsBetween = (from: number, to: number) => (to - from) * 100

/** Whether the note nearest to `midi` is a natural (white-key) note. */
export const isNatural = (midi: number) => NATURALS[pitchClass(nearestNote(midi))]
