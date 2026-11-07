import { PITCH_TNS } from "@/features/pitch/i18n"
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
   onMic: () => void
   onTab: () => void
}

export const Controls = (props: ControlsProps) => {
   const { state, failed, insecure, onMic, onTab } = props
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
                  className={styles.button}
                  aria-pressed={state.mic === "on"}
                  aria-busy={state.mic === "starting"}
                  aria-disabled={insecure || undefined}
                  aria-describedby={
                     insecure
                        ? "pitch-insecure"
                        : micError
                          ? "pitch-mic-error"
                          : undefined
                  }
                  onClick={insecure ? undefined : onMic}
               >
                  <span className={`${styles.swatch} ${styles.swatchVoice}`} />
                  {t(`controls.mic.${state.mic}`)}
               </button>
               {micError && (
                  <p id="pitch-mic-error" className={styles.error} role="alert">
                     {micError}
                  </p>
               )}
            </div>

            <div className={styles.control}>
               <button
                  type="button"
                  className={styles.button}
                  aria-pressed={state.tab === "on"}
                  aria-busy={state.tab === "starting"}
                  aria-disabled={insecure || unsupported || undefined}
                  aria-describedby={
                     insecure
                        ? "pitch-insecure"
                        : unsupported
                          ? "pitch-tab-unsupported"
                          : tabError
                            ? "pitch-tab-error"
                            : undefined
                  }
                  onClick={insecure || unsupported ? undefined : onTab}
               >
                  <span className={`${styles.swatch} ${styles.swatchSong}`} />
                  {t(`controls.tab.${state.tab}`)}
               </button>
               {unsupported && (
                  <p id="pitch-tab-unsupported" className={styles.note}>
                     {t("errors.unsupported")}
                  </p>
               )}
               {tabError && (
                  <p id="pitch-tab-error" className={styles.error} role="alert">
                     {tabError}
                  </p>
               )}
            </div>
         </div>

         {insecure && (
            <p id="pitch-insecure" className={`${styles.note} mt-3`}>
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
         <p className={styles.hint}>{t("controls.headphones")}</p>
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
}

/** How many octaves the graph shows, in half-octave steps. */
export const Zoom = (props: ZoomProps) => {
   const { value, onChange } = props
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
      </div>
   )
}

export default Controls
