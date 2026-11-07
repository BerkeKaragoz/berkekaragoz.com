/**
 * In-place radix-2 real FFT with a reusable plan.
 *
 * A real signal of `size` samples is transformed as a complex FFT of size / 2
 * (even samples as the real part, odd samples as the imaginary part) and then
 * split into the spectrum of the real signal.
 *
 * Packed layout (as in FFTPACK / Numerical Recipes):
 * - data[0] = Re X[0] (DC), data[1] = Re X[size / 2] (Nyquist), both real;
 * - data[2k], data[2k + 1] = Re X[k], Im X[k] for 0 < k < size / 2.
 *
 * X[k] = sum_n x[n] e^(-2 pi i k n / size). inverse(forward(x)) = x.
 */
export interface RealFft {
   readonly size: number
   forward(data: Float64Array): void
   inverse(data: Float64Array): void
}

export const isPowerOfTwo = (n: number) => n >= 1 && (n & (n - 1)) === 0

export const createRealFft = (size: number): RealFft => {
   if (!isPowerOfTwo(size) || size < 4) {
      throw new Error(`FFT size must be a power of two >= 4, got ${size}`)
   }
   const half = size / 2 // complex FFT size

   // Bit reversal permutation of the complex FFT, as index pairs to swap.
   const bits = Math.round(Math.log2(half))
   const swaps: number[] = []
   for (let i = 0; i < half; i++) {
      let r = 0
      for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b)
      if (r > i) swaps.push(i, r)
   }
   const swapTable = Int32Array.from(swaps)

   // Twiddles of the complex FFT: e^(-2 pi i j / half), j < half / 2.
   const cosC = new Float64Array(Math.max(1, half / 2))
   const sinC = new Float64Array(Math.max(1, half / 2))
   for (let j = 0; j < half / 2; j++) {
      cosC[j] = Math.cos((2 * Math.PI * j) / half)
      sinC[j] = -Math.sin((2 * Math.PI * j) / half)
   }
   // Twiddles of the real split: e^(-2 pi i k / size), k <= half / 2.
   const cosR = new Float64Array(half / 2 + 1)
   const sinR = new Float64Array(half / 2 + 1)
   for (let k = 0; k <= half / 2; k++) {
      cosR[k] = Math.cos((2 * Math.PI * k) / size)
      sinR[k] = -Math.sin((2 * Math.PI * k) / size)
   }

   /** Complex FFT of `half` interleaved points; sign -1 forward, +1 inverse (unscaled). */
   const complexFft = (d: Float64Array, sign: number) => {
      for (let s = 0; s < swapTable.length; s += 2) {
         const a = 2 * swapTable[s]
         const b = 2 * swapTable[s + 1]
         let t = d[a]
         d[a] = d[b]
         d[b] = t
         t = d[a + 1]
         d[a + 1] = d[b + 1]
         d[b + 1] = t
      }
      for (let len = 2; len <= half; len <<= 1) {
         const halfLen = len >> 1
         const step = half / len
         for (let start = 0; start < half; start += len) {
            for (let j = 0; j < halfLen; j++) {
               const wr = cosC[j * step]
               const wi = sign < 0 ? sinC[j * step] : -sinC[j * step]
               const a = 2 * (start + j)
               const b = a + 2 * halfLen
               const br = d[b]
               const bi = d[b + 1]
               const tr = wr * br - wi * bi
               const ti = wr * bi + wi * br
               d[b] = d[a] - tr
               d[b + 1] = d[a + 1] - ti
               d[a] += tr
               d[a + 1] += ti
            }
         }
      }
   }

   const forward = (d: Float64Array) => {
      complexFft(d, -1)
      // Z = FFT of z[n] = x[2n] + i x[2n + 1]. Even part Fe, odd part Fo:
      // Fe[k] = (Z[k] + conj Z[half - k]) / 2, Fo[k] = (Z[k] - conj Z[half - k]) / 2i,
      // X[k] = Fe[k] + W^k Fo[k], X[half - k] = conj Fe[k] - conj(W^k Fo[k]).
      const z0r = d[0]
      const z0i = d[1]
      d[0] = z0r + z0i
      d[1] = z0r - z0i
      for (let k = 1; k <= half / 2; k++) {
         const m = half - k
         const zr = d[2 * k]
         const zi = d[2 * k + 1]
         const wr = d[2 * m]
         const wi = d[2 * m + 1]
         const er = (zr + wr) / 2
         const ei = (zi - wi) / 2
         const or = (zi + wi) / 2
         const oi = -(zr - wr) / 2
         const c = cosR[k]
         const s = sinR[k]
         const tr = c * or - s * oi
         const ti = c * oi + s * or
         d[2 * k] = er + tr
         d[2 * k + 1] = ei + ti
         if (m !== k) {
            d[2 * m] = er - tr
            d[2 * m + 1] = ti - ei
         }
      }
   }

   const inverse = (d: Float64Array) => {
      // Undo the split: Fe = (X[k] + conj X[half - k]) / 2,
      // W^k Fo = (X[k] - conj X[half - k]) / 2, Z[k] = Fe + i Fo.
      const x0 = d[0]
      const xn = d[1]
      d[0] = (x0 + xn) / 2
      d[1] = (x0 - xn) / 2
      for (let k = 1; k <= half / 2; k++) {
         const m = half - k
         const xr = d[2 * k]
         const xi = d[2 * k + 1]
         const yr = d[2 * m]
         const yi = d[2 * m + 1]
         const er = (xr + yr) / 2
         const ei = (xi - yi) / 2
         const pr = (xr - yr) / 2
         const pi = (xi + yi) / 2
         // Fo = conj(W^k) * p
         const c = cosR[k]
         const s = sinR[k]
         const or = c * pr + s * pi
         const oi = c * pi - s * pr
         // Z[k] = Fe + i Fo; Z[half - k] = conj Fe + i conj Fo.
         d[2 * k] = er - oi
         d[2 * k + 1] = ei + or
         if (m !== k) {
            d[2 * m] = er + oi
            d[2 * m + 1] = or - ei
         }
      }
      complexFft(d, 1)
      const scale = 1 / half
      for (let i = 0; i < size; i++) d[i] *= scale
   }

   return { size, forward, inverse }
}
