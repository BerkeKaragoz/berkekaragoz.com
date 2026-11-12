import { cn } from "@shortkit/cn"
import React, { useEffect, useRef, useState } from "react"

// The plus pattern (.bg-plus-pattern) puts a plus every 60px, starting 10px
// in. The glyphs sit on a finer grid of cells that shares those centres, and
// the cells that hold a plus get that same plus, so the two never collide or
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

/** The share of glyphs that pulse rather than stay lit; the pluses always
 *  stay. Each pulsing glyph joins one group and is gone between its pulses. */
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

/** One tile of the glyph sheet: the pluses themselves and a random scatter
 *  of small glyphs over the cells between them. The pluses and most glyphs
 *  go in `steady`, always lit; the rest go in `pulses`, one group per beat. */
const makeGlyphMasks = (): GlyphMasks => {
   const steady: string[] = []
   const pulses: string[][] = PULSE_BEATS.map(() => [])
   const cells = GLYPH_TILE / CELL_PITCH
   const plusEvery = PLUS_PITCH / CELL_PITCH

   for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
         const x = GRID_OFFSET + col * CELL_PITCH
         const y = GRID_OFFSET + row * CELL_PITCH

         if (row % plusEvery === 0 && col % plusEvery === 0) {
            // Same shape and size as the plus in .bg-plus-pattern.
            steady.push(
               `<path d='M${x - 2} ${y - 10}h4v8h8v4h-8v8h-4v-8h-8v-4h8z'/>`
            )
         } else if (Math.random() < FILL_CHANCE) {
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

// One observer for all bands: marks the ones in view so only their clouds run.
let inViewObserver: IntersectionObserver | undefined

const getInViewObserver = () => {
   inViewObserver ??= new IntersectionObserver((entries) => {
      for (const entry of entries) {
         entry.target.toggleAttribute("data-in-view", entry.isIntersecting)
      }
   })

   return inViewObserver
}

/**
 * A band with the plus-pattern backdrop and its effects, behind the content:
 * the button gradient drifting through a cloud mask and tinting the pluses
 * under it (pure CSS, see plus-band.css), and a small lens under the mouse
 * that lights some pluses and tiny glyphs between them, most of them coming
 * and going on their own beats.
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
      const fx = fxRef.current

      if (!fx) return

      const observer = getInViewObserver()
      observer.observe(fx)

      return () => observer.unobserve(fx)
   }, [])

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
            <div className="plus-band-cloud-a">
               <div className="plus-band-cloud-b">
                  <div className="plus-band-tint" />
               </div>
            </div>
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
