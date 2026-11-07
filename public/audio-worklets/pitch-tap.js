// AudioWorklet processor "pitch-tap" for the pitch page. Plain JS, not bundled:
// loaded with audioWorklet.addModule("/audio-worklets/pitch-tap.js").
//
// Taps its input only: batches BLOCK frames and posts each full block as a
// TapMessage (src/features/pitch/types.ts), transferring the buffers, over the
// MessagePort the engine hands it with { type: "connect", port }. The "song"
// source keeps stereo input as left (samples) and right; everything else is
// downmixed to mono.
// { type: "stop" } lets the processor end. Outputs silence.

/* global AudioWorkletProcessor, registerProcessor, currentFrame */

const BLOCK = 512

class PitchTapProcessor extends AudioWorkletProcessor {
   constructor(options) {
      super()
      const processorOptions = (options && options.processorOptions) || {}
      this.source = processorOptions.source
      this.out = null
      this.stopped = false
      this.buffer = new Float32Array(BLOCK)
      this.right = null // the right channel while the block is stereo
      this.filled = 0
      this.startFrame = 0

      this.port.onmessage = (event) => {
         const data = event.data
         if (!data) return
         if (data.type === "connect" && data.port) {
            if (this.out) this.out.close()
            this.out = data.port
            this.filled = 0
         } else if (data.type === "stop") {
            if (this.out) this.out.close()
            this.out = null
            this.stopped = true
         }
      }
   }

   process(inputs, outputs) {
      const output = outputs[0]
      if (output) {
         for (let c = 0; c < output.length; c++) output[c].fill(0)
      }
      if (this.stopped) return false

      const input = inputs[0]
      if (!this.out || !input || input.length === 0) {
         this.filled = 0
         return true
      }

      // A gap since the last call breaks the block's timeline: drop the partial
      // block rather than post samples under a wrong startFrame.
      if (this.filled > 0 && this.startFrame + this.filled !== currentFrame) {
         this.filled = 0
      }

      const channels = input.length
      const frames = input[0].length
      const stereo = channels === 2 && this.source === "song"
      // A block is all stereo or all mono: a change drops the partial block.
      if (stereo !== (this.right !== null)) {
         this.filled = 0
         this.right = stereo ? new Float32Array(BLOCK) : null
      }
      if (stereo) {
         const left = input[0]
         const right = input[1]
         for (let i = 0; i < frames; i++) {
            if (this.filled === 0) this.startFrame = currentFrame + i
            this.buffer[this.filled] = left[i]
            this.right[this.filled] = right[i]
            this.filled++
            if (this.filled === BLOCK) this.flush()
         }
         return true
      }
      const scale = 1 / channels
      for (let i = 0; i < frames; i++) {
         if (this.filled === 0) this.startFrame = currentFrame + i
         let sum = 0
         for (let c = 0; c < channels; c++) sum += input[c][i]
         this.buffer[this.filled] = sum * scale
         this.filled++
         if (this.filled === BLOCK) this.flush()
      }
      return true
   }

   flush() {
      const samples = this.buffer
      const right = this.right
      const message = {
         type: "block",
         source: this.source,
         startFrame: this.startFrame,
         samples,
      }
      if (right) {
         message.right = right
         this.out.postMessage(message, [samples.buffer, right.buffer])
         this.right = new Float32Array(BLOCK)
      } else this.out.postMessage(message, [samples.buffer])
      this.buffer = new Float32Array(BLOCK)
      this.filled = 0
   }
}

registerProcessor("pitch-tap", PitchTapProcessor)
