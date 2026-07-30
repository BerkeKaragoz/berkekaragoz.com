import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const SAMPLE_RATE = 24_000
const OUTPUT = path.resolve("public/audio/ipa/en-GB/isolated")

const PROFILES = {
   p: { kind: "stop", centre: 900, voiced: false },
   b: { kind: "stop", centre: 900, voiced: true },
   t: { kind: "stop", centre: 5200, voiced: false },
   d: { kind: "stop", centre: 4200, voiced: true },
   k: { kind: "stop", centre: 2200, voiced: false },
   g: { kind: "stop", centre: 1800, voiced: true },
   f: { kind: "fricative", centre: 4200, bandwidth: 2600, voiced: false },
   v: { kind: "fricative", centre: 3600, bandwidth: 2400, voiced: true },
   theta: {
      kind: "fricative",
      centre: 5000,
      bandwidth: 3600,
      voiced: false,
   },
   eth: { kind: "fricative", centre: 4300, bandwidth: 3200, voiced: true },
   s: { kind: "fricative", centre: 7800, bandwidth: 1700, voiced: false },
   z: { kind: "fricative", centre: 6800, bandwidth: 1900, voiced: true },
   sh: { kind: "fricative", centre: 3400, bandwidth: 1500, voiced: false },
   zh: { kind: "fricative", centre: 3000, bandwidth: 1500, voiced: true },
   h: { kind: "fricative", centre: 1700, bandwidth: 4200, voiced: false },
   tsh: { kind: "affricate", centre: 3600, bandwidth: 1600, voiced: false },
   dzh: { kind: "affricate", centre: 3100, bandwidth: 1600, voiced: true },
   m: { kind: "sonorant", formants: [250, 950, 2100], f0: 112 },
   n: { kind: "sonorant", formants: [280, 1600, 2700], f0: 112 },
   ng: { kind: "sonorant", formants: [300, 2200, 3000], f0: 112 },
   l: { kind: "sonorant", formants: [360, 900, 2550], f0: 116 },
   r: { kind: "sonorant", formants: [330, 1050, 1550], f0: 108 },
   j: { kind: "sonorant", formants: [300, 2300, 3100], f0: 116 },
   w: { kind: "sonorant", formants: [300, 650, 2200], f0: 112 },
}

const seededNoise = (length, seed = 0x9e3779b9) => {
   const output = new Float32Array(length)
   let state = seed >>> 0

   for (let index = 0; index < length; index += 1) {
      state ^= state << 13
      state ^= state >>> 17
      state ^= state << 5
      output[index] = ((state >>> 0) / 0xffffffff) * 2 - 1
   }

   return output
}

const resonator = (input, frequency, bandwidth) => {
   const output = new Float32Array(input.length)
   const radius = Math.exp((-Math.PI * bandwidth) / SAMPLE_RATE)
   const coefficient = 2 * radius * Math.cos((2 * Math.PI * frequency) / SAMPLE_RATE)
   const radiusSquared = radius * radius

   for (let index = 2; index < input.length; index += 1) {
      output[index] =
         input[index] +
         coefficient * output[index - 1] -
         radiusSquared * output[index - 2]
   }

   return output
}

const glottalSource = (length, f0) => {
   const output = new Float32Array(length)

   for (let index = 0; index < length; index += 1) {
      const time = index / SAMPLE_RATE
      let value = 0

      for (let harmonic = 1; harmonic <= 18; harmonic += 1) {
         value += Math.sin(2 * Math.PI * f0 * harmonic * time) / harmonic
      }

      output[index] = value
   }

   return output
}

const voicedFormants = (length, formants, f0, gain = 1) => {
   const source = glottalSource(length, f0)
   const bands = formants.map((frequency, index) =>
      resonator(source, frequency, 90 + index * 35)
   )
   const weights = [1, 0.55, 0.3]
   const output = new Float32Array(length)

   for (let index = 0; index < length; index += 1) {
      output[index] =
         bands.reduce(
            (sum, band, bandIndex) => sum + band[index] * weights[bandIndex],
            0
         ) * gain
   }

   return output
}

const mixInto = (target, source, gain = 1, offset = 0) => {
   for (
      let index = 0;
      index < source.length && index + offset < target.length;
      index += 1
   ) {
      target[index + offset] += source[index] * gain
   }
}

const applyEnvelope = (samples, attack = 0.025, release = 0.08) => {
   const attackSamples = Math.max(1, Math.floor(attack * SAMPLE_RATE))
   const releaseSamples = Math.max(1, Math.floor(release * SAMPLE_RATE))

   for (let index = 0; index < samples.length; index += 1) {
      const attackGain = Math.min(1, index / attackSamples)
      const releaseGain = Math.min(1, (samples.length - index - 1) / releaseSamples)
      samples[index] *= Math.max(0, Math.min(attackGain, releaseGain))
   }
}

const normalise = (samples) => {
   let peak = 0
   for (const value of samples) peak = Math.max(peak, Math.abs(value))
   if (!peak) return samples

   const gain = 0.86 / peak
   for (let index = 0; index < samples.length; index += 1) samples[index] *= gain

   return samples
}

const makeFricative = (profile, duration = 0.68) => {
   const length = Math.floor(duration * SAMPLE_RATE)
   const noise = seededNoise(length, Math.floor(profile.centre * 13))
   const output = resonator(noise, profile.centre, profile.bandwidth)

   if (profile.voiced) {
      const voice = voicedFormants(length, [280, 1050, 2400], 112, 0.22)
      mixInto(output, voice)
   }

   applyEnvelope(output)
   return normalise(output)
}

const makeStop = (profile) => {
   const length = Math.floor(0.34 * SAMPLE_RATE)
   const output = new Float32Array(length)
   const burstLength = Math.floor(0.11 * SAMPLE_RATE)
   const burst = resonator(
      seededNoise(burstLength, Math.floor(profile.centre * 19)),
      profile.centre,
      Math.max(900, profile.centre * 0.55)
   )

   for (let index = 0; index < burst.length; index += 1) {
      burst[index] *= Math.exp(-index / (SAMPLE_RATE * 0.028))
   }

   const offset = Math.floor(0.045 * SAMPLE_RATE)
   mixInto(output, burst, 1, offset)

   if (profile.voiced) {
      const voice = voicedFormants(length, [240, 900, 2200], 108, 0.28)
      mixInto(output, voice)
   }

   applyEnvelope(output, 0.008, 0.1)
   return normalise(output)
}

const makeAffricate = (profile) => {
   const length = Math.floor(0.56 * SAMPLE_RATE)
   const output = new Float32Array(length)
   const frication = makeFricative(profile, 0.43)
   const offset = Math.floor(0.07 * SAMPLE_RATE)

   mixInto(output, frication, 1, offset)
   if (profile.voiced) {
      const voice = voicedFormants(length, [260, 1050, 2450], 110, 0.16)
      mixInto(output, voice)
   }

   applyEnvelope(output, 0.008, 0.08)
   return normalise(output)
}

const makeSonorant = (profile) => {
   const length = Math.floor(0.72 * SAMPLE_RATE)
   const output = voicedFormants(length, profile.formants, profile.f0)
   applyEnvelope(output, 0.04, 0.1)
   return normalise(output)
}

const wavBuffer = (samples) => {
   const bytesPerSample = 2
   const dataSize = samples.length * bytesPerSample
   const buffer = Buffer.alloc(44 + dataSize)

   buffer.write("RIFF", 0)
   buffer.writeUInt32LE(36 + dataSize, 4)
   buffer.write("WAVE", 8)
   buffer.write("fmt ", 12)
   buffer.writeUInt32LE(16, 16)
   buffer.writeUInt16LE(1, 20)
   buffer.writeUInt16LE(1, 22)
   buffer.writeUInt32LE(SAMPLE_RATE, 24)
   buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28)
   buffer.writeUInt16LE(bytesPerSample, 32)
   buffer.writeUInt16LE(16, 34)
   buffer.write("data", 36)
   buffer.writeUInt32LE(dataSize, 40)

   for (let index = 0; index < samples.length; index += 1) {
      const value = Math.max(-1, Math.min(1, samples[index]))
      buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2)
   }

   return buffer
}

await mkdir(OUTPUT, { recursive: true })

for (const [id, profile] of Object.entries(PROFILES)) {
   const samples =
      profile.kind === "stop"
         ? makeStop(profile)
         : profile.kind === "fricative"
           ? makeFricative(profile)
           : profile.kind === "affricate"
             ? makeAffricate(profile)
             : makeSonorant(profile)

   await writeFile(path.join(OUTPUT, `${id}.wav`), wavBuffer(samples))
   console.log(`Generated ${id}.wav`)
}
