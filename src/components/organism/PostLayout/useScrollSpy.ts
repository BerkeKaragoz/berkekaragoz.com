import { TocItem } from "@/lib/api/blog-common"
import { useEffect, useMemo, useState } from "react"

/**
 * Id of the heading the reader is currently under.
 *
 * Measures positions rather than observing intersections. A heading only
 * crosses an observer band during a smooth scroll; anchor jumps skip it.
 */
export const useScrollSpy = (toc: TocItem[], topOffset = 96) => {
   const ids = useMemo(() => toc.map((item) => item.id), [toc])
   const [activeId, setActiveId] = useState<string | null>(ids[0] ?? null)

   useEffect(() => {
      if (ids.length === 0) return

      const update = () => {
         const isAtBottom =
            window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - 2

         // The last section is often too short to reach the offset line.
         if (isAtBottom) return setActiveId(ids[ids.length - 1])

         let current = ids[0]

         for (const id of ids) {
            const element = document.getElementById(id)

            if (!element) continue
            if (element.getBoundingClientRect().top > topOffset) break

            current = id
         }

         setActiveId(current)
      }

      update()

      let frame = 0

      const onScroll = () => {
         if (frame) return

         frame = window.requestAnimationFrame(() => {
            frame = 0
            update()
         })
      }

      window.addEventListener("scroll", onScroll, { passive: true })
      window.addEventListener("resize", onScroll)

      return () => {
         if (frame) window.cancelAnimationFrame(frame)
         window.removeEventListener("scroll", onScroll)
         window.removeEventListener("resize", onScroll)
      }
   }, [ids, topOffset])

   return activeId
}

export default useScrollSpy
