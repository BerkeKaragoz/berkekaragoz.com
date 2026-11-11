import { PITCH_TNS } from "@/features/pitch/i18n"
import { ArrowsExpandIcon } from "@heroicons/react/solid"
import type { EngineState } from "@/features/pitch/types"
import { useTranslation } from "next-i18next"
import React from "react"
import styles from "./pitch.module.css"

type ControlsProps = {
   state: EngineState
   /** The engine could not be created; nothing can start. */
   failed?: boolean
   /** Opened over plain http on another host: the browser blocks mic and tab. */
   insecure?: boolean
   /** Draws the eye to the mic button. */
   nudgeMic?: boolean
   /** Prefix of the ids the buttons' notes use; distinct per copy on the page. */
   idPrefix?: string
   onMic: () => void
   onTab: () => void
}

export const Controls = (props: ControlsProps) => {
   const {
      state,
      failed,
      insecure,
      nudgeMic,
      idPrefix = "pitch",
      onMic,
      onTab,
   } = props
   const { t } = useTranslation(PITCH_TNS)

   const micError =
      state.mic === "denied"
         ? t("errors.micDenied")
         : state.mic === "error"
           ? t("errors.generic")
           : null
   const tabError =
      state.tab === "noAudio"
         ? t("errors.noTabAudio")
         : state.tab === "error"
           ? t("errors.generic")
           : null
   const unsupported = !insecure && state.tab === "unsupported"

   return (
      <div>
         <div
            className={styles.controls}
            role="group"
            aria-label={t("controls.label")}
         >
            <div className={styles.control}>
               <button
                  type="button"
                  className={`${styles.button} ${styles.micButton} ${nudgeMic ? styles.nudge : ""}`}
                  aria-pressed={state.mic === "on"}
                  aria-busy={state.mic === "starting"}
                  aria-disabled={insecure || undefined}
                  aria-describedby={
                     insecure
                        ? `${idPrefix}-insecure`
                        : micError
                          ? `${idPrefix}-mic-error`
                          : undefined
                  }
                  onClick={insecure ? undefined : onMic}
               >
                  <span className={`${styles.swatch} ${styles.swatchVoice}`} />
                  {t(`controls.mic.${state.mic}`)}
               </button>
               {micError && (
                  <p
                     id={`${idPrefix}-mic-error`}
                     className={styles.error}
                     role="alert"
                  >
                     {micError}
                  </p>
               )}
            </div>

            <div className={styles.control}>
               <button
                  type="button"
                  className={`${styles.button} ${styles.tabButton}`}
                  aria-pressed={state.tab === "on"}
                  aria-busy={state.tab === "starting"}
                  aria-disabled={insecure || unsupported || undefined}
                  aria-describedby={
                     insecure
                        ? `${idPrefix}-insecure`
                        : unsupported
                          ? `${idPrefix}-tab-unsupported`
                          : tabError
                            ? `${idPrefix}-tab-error`
                            : undefined
                  }
                  onClick={insecure || unsupported ? undefined : onTab}
               >
                  <span className={`${styles.swatch} ${styles.swatchSong}`} />
                  {t(`controls.tab.${state.tab}`)}
               </button>
               {unsupported && (
                  <p id={`${idPrefix}-tab-unsupported`} className={styles.note}>
                     {t("errors.unsupported")}
                  </p>
               )}
               {tabError && (
                  <p
                     id={`${idPrefix}-tab-error`}
                     className={styles.error}
                     role="alert"
                  >
                     {tabError}
                  </p>
               )}
            </div>
            <p className={styles.caption}>{t("controls.headphones")}</p>
         </div>

         {insecure && (
            <p id={`${idPrefix}-insecure`} className={`${styles.note} mt-3`}>
               {t("errors.insecure")}
            </p>
         )}
         {failed && (
            <p className={`${styles.error} mt-3`} role="alert">
               {t("errors.generic")}
            </p>
         )}
         {state.warnings.map((warning) => (
            <p key={warning} className={`${styles.note} mt-2`}>
               {t(`warnings.${warning}`)}
            </p>
         ))}
      </div>
   )
}

/** Graph height limits and step, in semitones: 1 to 4 octaves by half octaves. */
export const ZOOM_MIN_SEMITONES = 12
export const ZOOM_MAX_SEMITONES = 48
export const ZOOM_STEP_SEMITONES = 6

/** Whether `semitones` is a height the stepper can reach. */
export const isZoomStep = (semitones: number) =>
   semitones >= ZOOM_MIN_SEMITONES &&
   semitones <= ZOOM_MAX_SEMITONES &&
   (semitones - ZOOM_MIN_SEMITONES) % ZOOM_STEP_SEMITONES === 0

type ZoomProps = {
   value: number
   onChange: (semitones: number) => void
   /** Full screen toggle at the row's end, when the browser allows it. */
   fullscreen?: { on: boolean; onToggle: () => void }
}

/** How many octaves the graph shows, in half-octave steps. */
export const Zoom = (props: ZoomProps) => {
   const { value, onChange, fullscreen } = props
   const { t, i18n } = useTranslation(PITCH_TNS)
   const octaves = value / 12
   const step = (by: number) =>
      onChange(
         Math.min(
            ZOOM_MAX_SEMITONES,
            Math.max(ZOOM_MIN_SEMITONES, value + by * ZOOM_STEP_SEMITONES)
         )
      )

   return (
      <div className={styles.zoom} role="group" aria-labelledby="pitch-zoom-label">
         <span id="pitch-zoom-label" className={styles.zoomLabel}>
            {t("controls.zoom.label")}
         </span>
         <span className={styles.stepper}>
            <button
               type="button"
               className={styles.stepButton}
               aria-label={t("controls.zoom.less")}
               disabled={value <= ZOOM_MIN_SEMITONES}
               onClick={() => step(-1)}
            >
               −
            </button>
            <output className={styles.stepValue} aria-live="polite">
               {t("controls.zoom.value", {
                  count: octaves,
                  value: new Intl.NumberFormat(i18n.language).format(octaves),
               })}
            </output>
            <button
               type="button"
               className={styles.stepButton}
               aria-label={t("controls.zoom.more")}
               disabled={value >= ZOOM_MAX_SEMITONES}
               onClick={() => step(1)}
            >
               +
            </button>
         </span>
         {fullscreen && (
            <button
               type="button"
               className={`${styles.button} ${styles.fullscreen}`}
               onClick={fullscreen.onToggle}
            >
               <ArrowsExpandIcon className="h-4 w-4" aria-hidden="true" />
               {t(
                  fullscreen.on
                     ? "controls.fullscreen.exit"
                     : "controls.fullscreen.enter"
               )}
            </button>
         )}
      </div>
   )
}

/** Graph height limits, default and keyboard step, in CSS pixels. */
export const GRAPH_MIN_HEIGHT = 240
export const GRAPH_MAX_HEIGHT = 1400
export const GRAPH_DEFAULT_HEIGHT = 576
const GRAPH_HEIGHT_STEP = 32

export const clampGraphHeight = (px: number) =>
   Math.round(Math.min(GRAPH_MAX_HEIGHT, Math.max(GRAPH_MIN_HEIGHT, px)))

type HeightHandleProps = {
   value: number
   /** Called while dragging; `done` once the drag or key press ends. */
   onChange: (px: number, done: boolean) => void
}

/** A bar under the graph: drag it, or focus it and use the arrow keys. */
export const HeightHandle = (props: HeightHandleProps) => {
   const { value, onChange } = props
   const { t } = useTranslation(PITCH_TNS)
   const drag = React.useRef<{ y: number; height: number; last: number } | null>(
      null
   )

   const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      drag.current = { y: event.clientY, height: value, last: value }
   }
   const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!drag.current) return
      drag.current.last = clampGraphHeight(
         drag.current.height + event.clientY - drag.current.y
      )
      onChange(drag.current.last, false)
   }
   const onPointerUp = () => {
      if (!drag.current) return
      onChange(drag.current.last, true)
      drag.current = null
   }
   const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      const by = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0
      if (!by) return
      event.preventDefault()
      onChange(clampGraphHeight(value + by * GRAPH_HEIGHT_STEP), true)
   }

   return (
      <div
         className={styles.heightHandle}
         role="separator"
         aria-orientation="horizontal"
         aria-label={t("controls.height")}
         aria-valuemin={GRAPH_MIN_HEIGHT}
         aria-valuemax={GRAPH_MAX_HEIGHT}
         aria-valuenow={value}
         tabIndex={0}
         onPointerDown={onPointerDown}
         onPointerMove={onPointerMove}
         onPointerUp={onPointerUp}
         onPointerCancel={onPointerUp}
         onKeyDown={onKeyDown}
      />
   )
}

export default Controls
