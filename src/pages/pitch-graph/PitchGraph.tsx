import { isNatural, noteName } from "@/features/pitch/notes"
import { IN_TUNE_CENTS, type Session } from "@/features/pitch/session"
import {
   SPECTRUM_HIGHEST,
   SPECTRUM_ROWS,
   SPECTRUM_ROWS_PER_SEMITONE,
} from "@/features/pitch/spectrum"
import { DEFAULT_GATE_ON_DB } from "@/features/pitch/tracker"
import type { PitchEngine, Source, SpectrumFrame } from "@/features/pitch/types"
import React, { useEffect, useRef } from "react"
import styles from "./pitch.module.css"

/** One frame batch: how far the right edge may run ahead of the data. */
const BATCH_SECONDS = 0.016
const BAND_SNAP_SECONDS = 0.08
/** Gaps longer than this break a line. */
const LINE_GAP_SECONDS = 0.05
const DOT_MAX_AGE_SECONDS = 0.12
/** Width of the note-label column on each side of the plot, in px: fits two-letter names. */
const LABEL_GUTTER = 20
/** Gap between the plot and the right-hand labels, in px. */
const LABEL_INSET = 5
const RIGHT_PAD = 10

// Loudness styling of the lines. The level is the frame's RMS in dBFS, relative
// to the input, not a sound pressure.
/** Level at and below which a line counts as quiet (L = 0), in dBFS. */
const DB_QUIET = -60
/** Level at and above which a line counts as loud (L = 1), in dBFS. */
const DB_LOUD = -12
/** The level is smoothed over about this long before it styles the line. */
const DB_SMOOTH_SECONDS = 0.03
/** Voice line width at L = 0 and L = 1, in px. The line stays centred on the pitch. */
const VOICE_WIDTH_QUIET = 2.0
const VOICE_WIDTH_LOUD = 3.25
/** The song line's widths are the voice's times this. */
const SONG_WIDTH_SCALE = 0.8
/** The song line's whitening and glow are the voice's times these; mixes are noisier. */
const SONG_WHITEN_SCALE = 0.5
const SONG_GLOW_SCALE = 0.4
/** Most the line colour moves toward white (0..1). */
const WHITEN_MAX = 0.25
/** Whitening starts at this L and eases in to WHITEN_MAX at WHITEN_END_L. */
const WHITEN_START_L = 0.15
const WHITEN_END_L = 0.7
/** Glow follows the whitening's curve: blur radius in CSS px and peak opacity. */
const GLOW_BLUR = 6
const GLOW_ALPHA = 0.55
/** Opacity is 1 down to this level, in dBFS ... */
const FADE_START_DB = -34
/** ... then eases down to FADE_MIN_ALPHA at this level, and stays there below it. */
const FADE_END_DB = -48
const FADE_MIN_ALPHA = 0.9
/** The ribbon's colour stops are this far apart in time. */
const GRADIENT_STEP_SECONDS = 0.02
/** Points this many neighbours away give a ribbon point its direction. */
const NORMAL_REACH = 2

// Level meter at the right edge of the canvas, right of the mirrored note
// labels: one bar, the tab's level behind the mic's. Scale is linear in dBFS;
// the mic's number is in the readout.
/** Space reserved right of the right-hand labels for the bar, in px. */
const METER_STRIP = 16
const METER_WIDTH = 4
const METER_MARGIN = 2
/** Opacity of the tab's fill behind the mic's. */
const METER_SONG_FILL_ALPHA = 0.3
/** The mic's peak and the tab's level strips: height, and overhang each side of the bar, in px. */
const METER_STRIP_HEIGHT = 3
const METER_STRIP_OVERHANG = 2
/** Space above and below the bar, in px. */
const METER_PAD_Y = 4
/** Meter range, in dBFS. */
const METER_MIN_DB = -60
const METER_MAX_DB = 0
/** The mic's gate opens at this level, marked with a tick. */
const METER_GATE_DB = DEFAULT_GATE_ON_DB
/** The fill rises with this time constant and falls with METER_RELEASE_SECONDS. */
const METER_ATTACK_SECONDS = 0.02
const METER_RELEASE_SECONDS = 0.3
/** The peak tick holds this long, then falls this many dB per second. */
const METER_PEAK_HOLD_SECONDS = 1
const METER_PEAK_FALL_DB_PER_SECOND = 20
/**
 * Following one voice, the tab line moves less than this between 10 ms
 * frames; a bigger step is a switch to another line, so the line breaks there
 * rather than drawing a vertical stroke.
 */
const SONG_MAX_STEP_SEMITONES = 1
/** Each source's spectrum sits behind the lines in its own colour at this opacity. */
const SPECTRUM_OPACITY = 0.15

interface Colors {
   voice: string
   song: string
   band: string
   bandLabel: string
   grid: string
   gridC: string
   label: string
   meterTrack: string
   gate: string
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smoothstep = (from: number, to: number, v: number) => {
   const c = clamp01((v - from) / (to - from))
   return c * c * (3 - 2 * c)
}

/** Loudness L (0..1), whitening and opacity for a smoothed level. */
const levelStyle = (db: number) => {
   const loud = clamp01((db - DB_QUIET) / (DB_LOUD - DB_QUIET))
   const glow = smoothstep(WHITEN_START_L, WHITEN_END_L, loud)
   return {
      loud,
      glow,
      whiten: WHITEN_MAX * glow,
      alpha: 1 - (1 - FADE_MIN_ALPHA) * smoothstep(FADE_START_DB, FADE_END_DB, db),
   }
}

const lineColor = (rgb: [number, number, number], whiten: number, alpha: number) => {
   const mix = (c: number) => Math.round(c + (255 - c) * whiten)
   return (
      "rgba(" +
      mix(rgb[0]) +
      "," +
      mix(rgb[1]) +
      "," +
      mix(rgb[2]) +
      "," +
      alpha.toFixed(3) +
      ")"
   )
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
      meterTrack: get("--pitch-meter-track", "rgba(137,135,129,0.25)"),
      gate: get("--pitch-gate", "#898781"),
   }
}

type PitchGraphProps = {
   session: Session
   engine: PitchEngine | null
   /** Semitones of vertical space. */
   semitones: number
   /** In CSS pixels; the stylesheet's height when left out. */
   height?: number
   ariaLabel: string
}

export const PitchGraph = (props: PitchGraphProps) => {
   const { session, engine, semitones, height, ariaLabel } = props
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

      // Level meter state per source, on the wall clock. null while that input is off.
      interface Meter {
         level: number
         peak: number
         peakAt: number
         at: number
      }
      const meters: Record<Source, Meter | null> = { voice: null, song: null }

      /** Advances a source's meter to now, or drops it when the input is off. */
      const stepMeter = (source: Source, on: boolean, now: number) => {
         const db = on ? session.latestLevel(source) : null
         if (db === null) {
            meters[source] = null
            return null
         }
         const level = Math.min(METER_MAX_DB, Math.max(METER_MIN_DB, db))
         let m = meters[source]
         if (m === null) {
            m = { level, peak: level, peakAt: now, at: now }
            meters[source] = m
            return m
         }
         const dt = Math.min(0.25, Math.max(0, now - m.at))
         const tau = level > m.level ? METER_ATTACK_SECONDS : METER_RELEASE_SECONDS
         m.level += (level - m.level) * (1 - Math.exp(-dt / tau))
         if (level >= m.peak) {
            m.peak = level
            m.peakAt = now
         } else if (now - m.peakAt > METER_PEAK_HOLD_SECONDS) {
            m.peak = Math.max(level, m.peak - METER_PEAK_FALL_DB_PER_SECOND * dt)
         }
         m.at = now
         return m
      }

      /**
       * One bar. The tab sits behind: a faint orange fill the mic's blue fill
       * covers, and an orange strip at its level. The mic adds its peak tick.
       */
      const drawMeters = () => {
         const state = engine ? engine.getState() : null
         const now = performance.now() / 1000
         const voice = stepMeter("voice", state?.mic === "on", now)
         const song = stepMeter("song", state?.tab === "on", now)
         if (!voice && !song) return

         const left = width - METER_MARGIN - METER_WIDTH
         const top = METER_PAD_Y
         const barHeight = Math.max(1, height - 2 * METER_PAD_Y)
         const bottom = top + barHeight
         const yOf = (db: number) =>
            top +
            barHeight * (1 - (db - METER_MIN_DB) / (METER_MAX_DB - METER_MIN_DB))
         /** A marker wider and thicker than the bar, so it reads over the fills. */
         const drawStrip = (db: number) =>
            ctx.fillRect(
               left - METER_STRIP_OVERHANG,
               Math.round(yOf(db)) - METER_STRIP_HEIGHT / 2,
               METER_WIDTH + 2 * METER_STRIP_OVERHANG,
               METER_STRIP_HEIGHT
            )
         ctx.fillStyle = colors.meterTrack
         ctx.fillRect(left, top, METER_WIDTH, barHeight)
         if (song) {
            ctx.fillStyle = lineColor(rgbOf(colors.song), 0, METER_SONG_FILL_ALPHA)
            const songTop = yOf(song.level)
            ctx.fillRect(left, songTop, METER_WIDTH, bottom - songTop)
         }
         if (voice) {
            ctx.fillStyle = colors.voice
            const voiceTop = yOf(voice.level)
            ctx.fillRect(left, voiceTop, METER_WIDTH, bottom - voiceTop)
            drawStrip(voice.peak)
         }
         if (song) {
            ctx.fillStyle = colors.song
            drawStrip(song.level)
         }
         // The mic's gate-open tick, left of the bar. The tab gets none: its
         // gate reads the extracted centre, not the mix the bar shows.
         if (voice) {
            ctx.fillStyle = colors.gate
            ctx.fillRect(left - 3, Math.round(yOf(METER_GATE_DB)), 3, 1)
         }
      }

      const draw = () => {
         const win = session.windowSeconds
         const edge = nextEdge()
         const range = session.range(edge === null ? 0 : edge, semitonesRef.current)
         const plotLeft = LABEL_GUTTER
         const plotWidth = Math.max(
            1,
            width - 2 * LABEL_GUTTER - RIGHT_PAD - METER_STRIP
         )
         const labelRight = plotLeft + plotWidth + RIGHT_PAD + LABEL_INSET
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
         // Same labels on both sides, left aligned: the left ones line up with
         // the readout above; three-letter names may overflow.
         ctx.textAlign = "left"
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
            ctx.lineTo(plotLeft + plotWidth + RIGHT_PAD, yy)
            ctx.stroke()
            ctx.globalAlpha = 1
            if (labelled(n) || n === target) {
               const isTarget = n === target
               ctx.fillStyle = isTarget ? colors.bandLabel : colors.label
               ctx.font = `${isTarget ? "600 " : ""}11px system-ui, -apple-system, Segoe UI, sans-serif`
               ctx.fillText(noteName(n), 0, yy)
               ctx.fillText(noteName(n), labelRight, yy)
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
                  // The highest row is the top of the image.
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
            // A row's pixel centre sits on its pitch.
            const top =
               (SPECTRUM_HIGHEST - range.max) * SPECTRUM_ROWS_PER_SEMITONE + 0.5
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

         /** Smoothed level and time of the voice line's newest frame, for the dot. */
         const head = { time: -Infinity, db: DB_QUIET }

         const xs: number[] = []
         const ys: number[] = []
         const ts: number[] = []
         const dbs: number[] = []

         const drawLine = (source: Source) => {
            const rgb = rgbOf(source === "voice" ? colors.voice : colors.song)
            const scale = source === "voice" ? 1 : SONG_WIDTH_SCALE
            // The tab is usually a dense mix, so its loud styling is toned down.
            const whitenScale = source === "voice" ? 1 : SONG_WHITEN_SCALE
            const glowScale = source === "voice" ? 1 : SONG_GLOW_SCALE
            const styleOf = (db: number) => {
               const st = levelStyle(db)
               st.whiten *= whitenScale
               st.glow *= glowScale
               return st
            }
            const halfWidth = (db: number) =>
               (scale / 2) *
               (VOICE_WIDTH_QUIET +
                  (VOICE_WIDTH_LOUD - VOICE_WIDTH_QUIET) * levelStyle(db).loud)
            const maxStep = source === "song" ? SONG_MAX_STEP_SEMITONES : Infinity

            // One filled ribbon per run: offset along the local normal, round
            // ends, one horizontal gradient for the whitening and opacity.
            const flushRun = () => {
               const n = xs.length
               if (n === 0) return
               if (n === 1) {
                  const st = styleOf(dbs[0])
                  ctx.fillStyle = lineColor(rgb, st.whiten, st.alpha)
                  ctx.beginPath()
                  ctx.arc(xs[0], ys[0], halfWidth(dbs[0]), 0, Math.PI * 2)
                  ctx.fill()
                  xs.length = ys.length = ts.length = dbs.length = 0
                  return
               }
               const nx: number[] = []
               const ny: number[] = []
               for (let i = 0; i < n; i++) {
                  const a = Math.max(0, i - NORMAL_REACH)
                  const b = Math.min(n - 1, i + NORMAL_REACH)
                  const dx = xs[b] - xs[a]
                  const dy = ys[b] - ys[a]
                  const len = Math.hypot(dx, dy)
                  // The tangent turned a quarter; flat when there is no direction.
                  nx.push(len > 0 ? -dy / len : 0)
                  ny.push(len > 0 ? dx / len : 1)
               }
               const h0 = halfWidth(dbs[0])
               const h1 = halfWidth(dbs[n - 1])
               const gx0 = xs[0] - h0
               const gx1 = xs[n - 1] + h1
               const gradient = ctx.createLinearGradient(gx0, 0, gx1, 0)
               // Same stops, opacity from the glow; its shadow is the glow.
               const glowGradient = ctx.createLinearGradient(gx0, 0, gx1, 0)
               let maxGlow = 0
               let lastStop = -Infinity
               let lastOffset = 0
               for (let i = 0; i < n; i++) {
                  if (i !== n - 1 && ts[i] - lastStop < GRADIENT_STEP_SECONDS)
                     continue
                  lastStop = ts[i]
                  const st = styleOf(dbs[i])
                  lastOffset = Math.max(
                     lastOffset,
                     clamp01((xs[i] - gx0) / (gx1 - gx0))
                  )
                  gradient.addColorStop(
                     lastOffset,
                     lineColor(rgb, st.whiten, st.alpha)
                  )
                  glowGradient.addColorStop(
                     lastOffset,
                     lineColor(rgb, st.whiten, GLOW_ALPHA * st.glow)
                  )
                  maxGlow = Math.max(maxGlow, st.glow)
               }
               const tracePath = () => {
                  ctx.beginPath()
                  for (let i = 0; i < n; i++) {
                     const h = halfWidth(dbs[i])
                     const px = xs[i] + nx[i] * h
                     const py = ys[i] + ny[i] * h
                     if (i === 0) ctx.moveTo(px, py)
                     else ctx.lineTo(px, py)
                  }
                  const endAngle = Math.atan2(ny[n - 1], nx[n - 1])
                  ctx.arc(
                     xs[n - 1],
                     ys[n - 1],
                     h1,
                     endAngle,
                     endAngle - Math.PI,
                     true
                  )
                  for (let i = n - 1; i >= 0; i--) {
                     const h = halfWidth(dbs[i])
                     ctx.lineTo(xs[i] - nx[i] * h, ys[i] - ny[i] * h)
                  }
                  const startAngle = Math.atan2(-ny[0], -nx[0])
                  ctx.arc(xs[0], ys[0], h0, startAngle, startAngle - Math.PI, true)
                  ctx.closePath()
               }
               if (maxGlow > 0.01) {
                  ctx.shadowColor = lineColor(rgb, WHITEN_MAX * whitenScale, 1)
                  ctx.shadowBlur = GLOW_BLUR * dpr
                  ctx.fillStyle = glowGradient
                  tracePath()
                  ctx.fill()
                  ctx.shadowBlur = 0
                  ctx.shadowColor = "transparent"
               }
               ctx.fillStyle = gradient
               tracePath()
               ctx.fill()
               xs.length = ys.length = ts.length = dbs.length = 0
            }

            let prevTime = 0
            let prevBucket = 0
            let hasPrev = false
            // Pitch of the previous frame, drawn or thinned out.
            let lastMidi: number | null = null
            // Level smoothed over DB_SMOOTH_SECONDS, fed by every frame.
            let smooth = 0
            let smoothTime = -Infinity
            session.forEachFrame(source, start - 0.1, edge, (time, midi, db) => {
               const dt = time - smoothTime
               smooth =
                  dt > 0.1 || dt <= 0
                     ? db
                     : smooth +
                       (db - smooth) * (1 - Math.exp(-dt / DB_SMOOTH_SECONDS))
               smoothTime = time
               if (source === "voice") {
                  head.time = time
                  head.db = smooth
               }
               if (
                  midi === null ||
                  (lastMidi !== null && Math.abs(midi - lastMidi) > maxStep)
               ) {
                  flushRun()
                  hasPrev = false
               }
               lastMidi = midi
               if (midi === null) return
               // Thin points along time, not screen x, so the line moves with
               // the graph instead of shimmering as it scrolls.
               const bucket = Math.floor(time * pxPerSecond)
               const joins = hasPrev && time - prevTime <= LINE_GAP_SECONDS
               if (!joins) flushRun()
               else if (bucket === prevBucket) return
               xs.push(x(time))
               ys.push(y(midi))
               ts.push(time)
               dbs.push(smooth)
               hasPrev = true
               prevTime = time
               prevBucket = bucket
            })
            flushRun()
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
            const st = levelStyle(head.time === last.time ? head.db : DB_LOUD)
            const rgb = rgbOf(colors.voice)
            if (st.glow > 0.01) {
               ctx.shadowColor = lineColor(rgb, WHITEN_MAX, GLOW_ALPHA * st.glow)
               ctx.shadowBlur = GLOW_BLUR * dpr
            }
            ctx.fillStyle = lineColor(rgb, st.whiten, st.alpha)
            ctx.beginPath()
            ctx.arc(x(last.time), y(last.midi), 4.5, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0
            ctx.shadowColor = "transparent"
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
         drawMeters()
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
      <div ref={wrapRef} className={styles.graph} style={{ height }}>
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
