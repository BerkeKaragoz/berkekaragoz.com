import { isNatural, noteName } from "@/features/pitch/notes"
import { IN_TUNE_CENTS, type Session } from "@/features/pitch/session"
import {
   SPECTRUM_LOWEST,
   SPECTRUM_ROWS,
   SPECTRUM_ROWS_PER_SEMITONE,
} from "@/features/pitch/spectrum"
import type { PitchEngine, Source, SpectrumFrame } from "@/features/pitch/types"
import React, { useEffect, useRef } from "react"
import styles from "./pitch.module.css"

/** One frame batch: how far the right edge may run ahead of the data. */
const BATCH_SECONDS = 0.016
const BAND_SNAP_SECONDS = 0.08
/** Gaps longer than this break a line. */
const LINE_GAP_SECONDS = 0.05
const DOT_MAX_AGE_SECONDS = 0.12
const LABEL_GUTTER = 40
const RIGHT_PAD = 10
/**
 * Following one voice, the tab line moves less than this between 10 ms
 * frames; a bigger step is a switch to another line, so the line breaks there
 * rather than drawing a vertical stroke.
 */
const SONG_MAX_STEP_SEMITONES = 1
/** Each source's spectrum sits behind the lines in its own colour at this opacity. */
const SPECTRUM_OPACITY = 0.1

interface Colors {
   voice: string
   song: string
   band: string
   bandLabel: string
   grid: string
   gridC: string
   label: string
}

const rgbOf = (hex: string): [number, number, number] => {
   const match = /^#([0-9a-f]{6})$/i.exec(hex)
   const n = match ? parseInt(match[1], 16) : 0x898781
   return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const readColors = (el: Element): Colors => {
   const style = getComputedStyle(el)
   const get = (name: string, fallback: string) =>
      style.getPropertyValue(name).trim() || fallback
   return {
      voice: get("--pitch-voice", "#2a78d6"),
      song: get("--pitch-song", "#eb6834"),
      band: get("--pitch-band", "rgba(27,175,122,0.22)"),
      bandLabel: get("--pitch-band-label", "#1baf7a"),
      grid: get("--pitch-grid", "#e1e0d9"),
      gridC: get("--pitch-grid-c", "#c3c2b7"),
      label: get("--pitch-label", "#898781"),
   }
}

type PitchGraphProps = {
   session: Session
   engine: PitchEngine | null
   /** Semitones of vertical space. */
   semitones: number
   ariaLabel: string
}

export const PitchGraph = (props: PitchGraphProps) => {
   const { session, engine, semitones, ariaLabel } = props
   const wrapRef = useRef<HTMLDivElement>(null)
   const canvasRef = useRef<HTMLCanvasElement>(null)
   // Read by the draw loop each frame, so zooming doesn't restart it.
   const semitonesRef = useRef(semitones)
   semitonesRef.current = semitones

   useEffect(() => {
      const wrap = wrapRef.current
      const canvas = canvasRef.current
      if (!wrap || !canvas) return
      const context = canvas.getContext("2d")
      if (!context) return
      const ctx = context

      let colors = readColors(canvas)
      // Scratch image for the spectra, redrawn every frame.
      const spectrumCanvas = document.createElement("canvas")
      const spectrumCtx = spectrumCanvas.getContext("2d")
      let spectrumImage: ImageData | null = null
      let width = 0
      let height = 0
      let dpr = 1

      const resize = () => {
         const rect = wrap.getBoundingClientRect()
         dpr = window.devicePixelRatio || 1
         width = Math.max(1, Math.round(rect.width))
         height = Math.max(1, Math.round(rect.height))
         canvas.width = Math.round(width * dpr)
         canvas.height = Math.round(height * dpr)
      }
      resize()

      const resizeObserver =
         typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize)
      if (resizeObserver) resizeObserver.observe(wrap)
      else window.addEventListener("resize", resize)

      // next-themes toggles the "dark" class on <html>.
      const themeObserver = new MutationObserver(() => {
         colors = readColors(canvas)
      })
      themeObserver.observe(document.documentElement, {
         attributes: true,
         attributeFilter: ["class", "style"],
      })

      // Right edge state: follows the aligned edge, eased by the engine clock.
      let display: number | null = null
      let anchorEdge = 0
      let anchorNow = 0
      let lastAligned: number | null = null

      const nextEdge = () => {
         const aligned = session.alignedEdge()
         const now = engine ? engine.now() : 0
         if (aligned === null) return display
         if (aligned !== lastAligned) {
            lastAligned = aligned
            anchorEdge = aligned
            anchorNow = now
         }
         let edge = Math.min(
            anchorEdge + Math.max(0, now - anchorNow),
            aligned + BATCH_SECONDS
         )
         // Hold still rather than step back a little (a source switching on).
         if (display !== null && edge < display && display - edge < 1) edge = display
         display = edge
         return edge
      }

      const draw = () => {
         const win = session.windowSeconds
         const edge = nextEdge()
         const range = session.range(edge === null ? 0 : edge, semitonesRef.current)
         const plotLeft = LABEL_GUTTER
         const plotWidth = Math.max(1, width - LABEL_GUTTER - RIGHT_PAD)
         const span = range.max - range.min
         const start = edge === null ? 0 : edge - win
         const pxPerSecond = plotWidth / win
         const x = (time: number) => plotLeft + (time - start) * pxPerSecond
         const y = (midi: number) => ((range.max - midi) / span) * height
         const target = edge === null ? null : session.targetAt(edge)

         ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
         ctx.clearRect(0, 0, width, height)

         // Semitone grid and labels.
         ctx.font = "11px system-ui, -apple-system, Segoe UI, sans-serif"
         ctx.textAlign = "right"
         ctx.textBaseline = "middle"
         ctx.lineWidth = 1
         // Zoomed out, label fewer notes so the labels don't overlap.
         const rowPx = height / span
         const labelled = (n: number) => {
            const pc = ((n % 12) + 12) % 12
            if (rowPx >= 13) return isNatural(n)
            if (rowPx >= 6) return pc === 0 || pc === 4 || pc === 7
            return pc === 0
         }
         for (let n = Math.ceil(range.min); n <= Math.floor(range.max); n++) {
            const yy = Math.round(y(n)) + 0.5
            const natural = isNatural(n)
            const isC = n % 12 === 0
            ctx.globalAlpha = natural ? 1 : 0.5
            ctx.strokeStyle = isC ? colors.gridC : colors.grid
            ctx.beginPath()
            ctx.moveTo(plotLeft, yy)
            ctx.lineTo(width, yy)
            ctx.stroke()
            ctx.globalAlpha = 1
            if (labelled(n) || n === target) {
               const isTarget = n === target
               ctx.fillStyle = isTarget ? colors.bandLabel : colors.label
               ctx.font = `${isTarget ? "600 " : ""}11px system-ui, -apple-system, Segoe UI, sans-serif`
               ctx.fillText(noteName(n), plotLeft - 8, yy)
            }
         }

         if (edge === null) return

         const drawBand = () => {
            const half = IN_TUNE_CENTS / 100
            const step = win / Math.max(60, Math.floor(plotWidth / 2))
            // Samples sit on a fixed time grid so the history doesn't shimmer.
            let t = Math.floor(start / step) * step
            let shown: number | null = null
            let from = 0
            let to: number | null = null
            let changedAt = 0
            let top: [number, number][] = []
            let bottom: [number, number][] = []
            const flush = () => {
               if (top.length > 1) {
                  ctx.beginPath()
                  ctx.moveTo(top[0][0], top[0][1])
                  for (let i = 1; i < top.length; i++)
                     ctx.lineTo(top[i][0], top[i][1])
                  for (let i = bottom.length - 1; i >= 0; i--)
                     ctx.lineTo(bottom[i][0], bottom[i][1])
                  ctx.closePath()
                  ctx.fill()
               }
               top = []
               bottom = []
            }
            ctx.fillStyle = colors.band
            for (; t <= edge + step; t += step) {
               const time = Math.min(t, edge)
               const raw = session.targetAt(time)
               if (raw === null) {
                  flush()
                  shown = null
                  to = null
                  continue
               }
               if (to === null || shown === null) {
                  shown = raw
                  from = raw
                  to = raw
                  changedAt = time - BAND_SNAP_SECONDS
               } else if (raw !== to) {
                  from = shown
                  to = raw
                  changedAt = time
               }
               const p = Math.min(1, (time - changedAt) / BAND_SNAP_SECONDS)
               shown = from + (to - from) * (p * p * (3 - 2 * p))
               const xx = x(time)
               top.push([xx, y(shown + half)])
               bottom.push([xx, y(shown - half)])
               if (time >= edge) break
            }
            flush()
         }

         // One frame per column of an image, stretched over its time span.
         const drawSpectrumRun = (
            frames: SpectrumFrame[],
            from: number,
            to: number,
            rgb: [number, number, number]
         ) => {
            if (!spectrumCtx) return
            const columns = to - from
            if (!spectrumImage || spectrumImage.width < columns) {
               spectrumCanvas.width = columns + 64
               spectrumCanvas.height = SPECTRUM_ROWS
               spectrumImage = spectrumCtx.createImageData(
                  columns + 64,
                  SPECTRUM_ROWS
               )
            }
            const data = spectrumImage.data
            const stride = spectrumImage.width
            for (let c = 0; c < columns; c++) {
               const values = frames[from + c].values
               for (let row = 0; row < SPECTRUM_ROWS; row++) {
                  const p = ((SPECTRUM_ROWS - 1 - row) * stride + c) * 4
                  data[p] = rgb[0]
                  data[p + 1] = rgb[1]
                  data[p + 2] = rgb[2]
                  data[p + 3] = values[row]
               }
            }
            spectrumCtx.putImageData(
               spectrumImage,
               0,
               0,
               0,
               0,
               columns,
               SPECTRUM_ROWS
            )
            const first = frames[from]
            const last = frames[to - 1]
            const left = x(first.time - first.duration / 2)
            const right = x(last.time + last.duration / 2)
            const top =
               SPECTRUM_ROWS -
               0.5 -
               (range.max - SPECTRUM_LOWEST) * SPECTRUM_ROWS_PER_SEMITONE
            ctx.drawImage(
               spectrumCanvas,
               0,
               top,
               columns,
               span * SPECTRUM_ROWS_PER_SEMITONE,
               left,
               0,
               right - left,
               height
            )
         }

         const drawSpectrum = (source: Source) => {
            const frames: SpectrumFrame[] = []
            session.forEachSpectrum(source, start - 0.2, edge, (frame) => {
               frames.push(frame)
            })
            const rgb = rgbOf(source === "voice" ? colors.voice : colors.song)
            ctx.globalAlpha = SPECTRUM_OPACITY
            // Evenly spaced runs; a gap (the source restarted) starts a new one.
            let from = 0
            for (let i = 1; i <= frames.length; i++) {
               if (
                  i === frames.length ||
                  frames[i].time - frames[i - 1].time > 1.5 * frames[i - 1].duration
               ) {
                  drawSpectrumRun(frames, from, i, rgb)
                  from = i
               }
            }
            ctx.globalAlpha = 1
         }

         const drawLine = (source: Source) => {
            ctx.strokeStyle = source === "voice" ? colors.voice : colors.song
            ctx.lineWidth = source === "voice" ? 2.5 : 2
            ctx.lineJoin = "round"
            ctx.lineCap = "round"
            const maxStep = source === "song" ? SONG_MAX_STEP_SEMITONES : Infinity
            ctx.beginPath()
            let hasPrev = false
            let prevTime = 0
            let prevBucket = 0
            // Pitch of the previous frame, drawn or thinned out.
            let lastMidi: number | null = null
            session.forEachFrame(source, start - 0.1, edge, (time, midi) => {
               if (
                  midi === null ||
                  (lastMidi !== null && Math.abs(midi - lastMidi) > maxStep)
               )
                  hasPrev = false
               lastMidi = midi
               if (midi === null) return
               // Thin points along time, not screen x, so the line moves with
               // the graph instead of shimmering as it scrolls.
               const bucket = Math.floor(time * pxPerSecond)
               const joins = hasPrev && time - prevTime <= LINE_GAP_SECONDS
               if (joins && bucket === prevBucket) return
               if (joins) ctx.lineTo(x(time), y(midi))
               else ctx.moveTo(x(time), y(midi))
               hasPrev = true
               prevTime = time
               prevBucket = bucket
            })
            ctx.stroke()
         }

         const drawDot = () => {
            const last = { time: 0, midi: null as number | null }
            session.forEachFrame(
               "voice",
               edge - DOT_MAX_AGE_SECONDS,
               edge,
               (time, midi) => {
                  last.time = time
                  last.midi = midi
               }
            )
            if (last.midi === null) return
            ctx.fillStyle = colors.voice
            ctx.beginPath()
            ctx.arc(x(last.time), y(last.midi), 4.5, 0, Math.PI * 2)
            ctx.fill()
         }

         ctx.save()
         ctx.beginPath()
         ctx.rect(plotLeft, 0, plotWidth + RIGHT_PAD, height)
         ctx.clip()

         drawSpectrum("song")
         drawSpectrum("voice")
         drawBand()
         drawLine("song")
         drawLine("voice")
         drawDot()

         ctx.restore()
      }

      let frame = 0
      const loop = () => {
         draw()
         frame = requestAnimationFrame(loop)
      }
      frame = requestAnimationFrame(loop)

      return () => {
         cancelAnimationFrame(frame)
         themeObserver.disconnect()
         if (resizeObserver) resizeObserver.disconnect()
         else window.removeEventListener("resize", resize)
      }
   }, [session, engine])

   return (
      <div ref={wrapRef} className={styles.graph}>
         <canvas
            ref={canvasRef}
            className={styles.canvas}
            role="img"
            aria-label={ariaLabel}
         />
      </div>
   )
}

export default PitchGraph
