/**
 * Some recordings reach the browser with one channel's polarity inverted, so
 * whatever is in the middle, usually the voice, is in phase opposition between
 * left and right. Summing the channels then cancels it, and centre extraction
 * drops it as a side.
 *
 * This keeps the correlation of left and right over the last few seconds and,
 * while it is negative, hands on the right channel inverted. Normal stereo
 * mixes sit well above zero, so the threshold has room either side.
 */

/** Time constant of the running correlation, in seconds. */
const SECONDS = 2
/** Correlation below which the right channel is inverted, and above which it is not. */
const FLIP_BELOW = -0.1
const UNFLIP_ABOVE = 0.1

export interface Polarity {
   /** The right block as it should be used: inverted while the channels are. */
   fix(left: Float32Array, right: Float32Array): Float32Array
   reset(): void
}

export const createPolarity = (sampleRate: number): Polarity => {
   let ll = 0
   let rr = 0
   let lr = 0
   let flipped = false

   const reset = () => {
      ll = 0
      rr = 0
      lr = 0
      flipped = false
   }

   const fix = (left: Float32Array, right: Float32Array) => {
      const decay = Math.exp(-left.length / (SECONDS * sampleRate))
      let bl = 0
      let br = 0
      let blr = 0
      for (let i = 0; i < left.length; i++) {
         bl += left[i] * left[i]
         br += right[i] * right[i]
         blr += left[i] * right[i]
      }
      ll = ll * decay + bl
      rr = rr * decay + br
      lr = lr * decay + blr
      const correlation = lr / Math.sqrt(ll * rr + 1e-20)
      if (flipped ? correlation > UNFLIP_ABOVE : correlation < FLIP_BELOW)
         flipped = !flipped
      if (!flipped) return right
      const out = new Float32Array(right.length)
      for (let i = 0; i < right.length; i++) out[i] = -right[i]
      return out
   }

   return { fix, reset }
}
