import { cn } from "@shortkit/cn"
import React, { useEffect, useRef, useState } from "react"

// The plus pattern (.bg-plus-pattern) puts a plus every 60px, starting 10px
// in. The glyphs sit on a finer grid of cells that shares those centres, and
// the cells that hold a plus are left empty, so the two never collide or
// drift apart.
const PLUS_PITCH = 60
const CELL_PITCH = 20
const GRID_OFFSET = 10
const GLYPH_TILE = 240
const FILL_CHANCE = 0.5
/** In px. A glyph's baseline sits this much below its cell's centre, about
 *  a third of the size, so the glyph is centred in the cell. */
const GLYPH_SIZE = 15
const GLYPH_BASELINE = Math.round(GLYPH_SIZE * 0.35)
const GLYPHS = ["0", "1", "&lt;", "&gt;", "/", "{", "}", "=", "*", ";", ":", "#", "$", "%", "|", "~", "^", "?"]

/** The share of glyphs that pulse rather than stay lit. Each pulsing glyph
 *  joins one group and is gone between its pulses. */
const PULSE_SHARE = 0.35
/** One beat per pulse group, in seconds: how long its cycle is and where in
 *  it the group starts. The cycles don't divide each other, so the groups
 *  never fall into step. */
const PULSE_BEATS = [
   { cycle: 2.3, offset: 0 },
   { cycle: 2.9, offset: -1.1 },
   { cycle: 3.7, offset: -2.3 },
   { cycle: 4.3, offset: -0.7 },
]

type GlyphMasks = { steady: string; pulses: string[] }

/** An SVG as a CSS url() for mask-image. Only the alpha matters; the colour is in CSS. */
const svgMask = (width: number, height: number, body: string) => {
   const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' ` +
      `font-family='ui-monospace,Consolas,monospace' font-size='${GLYPH_SIZE}' text-anchor='middle'>` +
      body +
      `</svg>`

   return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** One tile of the glyph sheet: a random scatter of small glyphs over the
 *  cells between the pluses. Most go in `steady`, always lit; the rest go in
 *  `pulses`, one group per beat. */
const makeGlyphMasks = (): GlyphMasks => {
   const steady: string[] = []
   const pulses: string[][] = PULSE_BEATS.map(() => [])
   const cells = GLYPH_TILE / CELL_PITCH
   const plusEvery = PLUS_PITCH / CELL_PITCH

   for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
         const x = GRID_OFFSET + col * CELL_PITCH
         const y = GRID_OFFSET + row * CELL_PITCH

         // The cells that hold a plus stay empty.
         if (row % plusEvery === 0 && col % plusEvery === 0) continue

         if (Math.random() < FILL_CHANCE) {
            const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            const group =
               Math.random() < PULSE_SHARE
                  ? pulses[Math.floor(Math.random() * pulses.length)]
                  : steady

            group.push(`<text x='${x}' y='${y + GLYPH_BASELINE}'>${char}</text>`)
         }
      }
   }

   return {
      steady: svgMask(GLYPH_TILE, GLYPH_TILE, steady.join("")),
      pulses: pulses.map((group) => svgMask(GLYPH_TILE, GLYPH_TILE, group.join(""))),
   }
}

// The masks are the same for every band, so they are made once.
let glyphMasks: GlyphMasks | undefined

const getGlyphMasks = () => (glyphMasks ??= makeGlyphMasks())

/**
 * A band with the plus-pattern backdrop and, behind the content, a small lens
 * under the mouse that lights tiny glyphs between the pluses, most of them
 * coming and going on their own beats (see plus-band.css).
 *
 * The glyph sheet is static tiled images, like the plus pattern; the pulses
 * only fade layers in and out. A mouse move costs one frame callback that
 * sets two transforms (the lens one way, the sheet back the other, so the
 * glyphs stay put). A still mouse runs no script at all, and touch devices
 * get no lens.
 */
const PlusBand: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
   const { className, children, ...rest } = props

   const bandRef = useRef<HTMLDivElement>(null)
   const fxRef = useRef<HTMLDivElement>(null)
   const lensRef = useRef<HTMLDivElement>(null)
   const sheetRef = useRef<HTMLDivElement>(null)
   // Set after mount, and only with a mouse; the lens renders once it is.
   const [masks, setMasks] = useState<GlyphMasks>()

   useEffect(() => {
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches)
         setMasks(getGlyphMasks())
   }, [])

   // Runs again once the lens has rendered.
   useEffect(() => {
      const band = bandRef.current
      const fx = fxRef.current
      const lens = lensRef.current
      const sheet = sheetRef.current

      if (!band || !fx || !lens || !sheet) return

      let clientX = 0
      let clientY = 0
      let frame = 0

      const place = () => {
         frame = 0

         const rect = fx.getBoundingClientRect()
         const half = lens.offsetWidth / 2
         // Whole pixels, and the same ones for both, so the sheet's net
         // offset is exactly zero and the glyphs stay sharp.
         const left = Math.round(clientX - rect.left - half)
         const top = Math.round(clientY - rect.top - half)

         lens.style.transform = `translate3d(${left}px, ${top}px, 0)`
         sheet.style.transform = `translate3d(${-left}px, ${-top}px, 0)`
         lens.toggleAttribute("data-shown", true)
      }

      const onMove = (event: PointerEvent) => {
         if (event.pointerType === "touch") return

         clientX = event.clientX
         clientY = event.clientY

         if (!frame) frame = requestAnimationFrame(place)
      }

      const onLeave = () => {
         lens.toggleAttribute("data-shown", false)
      }

      band.addEventListener("pointermove", onMove, { passive: true })
      band.addEventListener("pointerleave", onLeave)

      return () => {
         band.removeEventListener("pointermove", onMove)
         band.removeEventListener("pointerleave", onLeave)
         cancelAnimationFrame(frame)
      }
   }, [masks])

   return (
      <div
         ref={bandRef}
         className={cn(
            "relative isolate bg-plus-pattern dark:bg-primary-900 dark:bg-opacity-20",
            className
         )}
         {...rest}
      >
         <div ref={fxRef} className="plus-band-fx" aria-hidden="true">
            {masks && (
               <div ref={lensRef} className="plus-band-lens">
                  <div ref={sheetRef} className="plus-band-sheet">
                     <div
                        className="plus-band-steady"
                        style={{ maskImage: masks.steady }}
                     />
                     {PULSE_BEATS.map(({ cycle, offset }, i) => (
                        <div
                           key={i}
                           className="plus-band-pulse"
                           style={{
                              maskImage: masks.pulses[i],
                              animationDuration: `${cycle}s`,
                              animationDelay: `${offset}s`,
                           }}
                        />
                     ))}
                  </div>
               </div>
            )}
         </div>
         {children}
      </div>
   )
}

export default PlusBand
