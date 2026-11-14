import { PITCH_TNS } from "@/features/pitch/i18n"
import { noteName } from "@/features/pitch/notes"
import type { Readout as ReadoutValues } from "@/features/pitch/session"
import { CheckCircleIcon } from "@heroicons/react/solid"
import { useTranslation } from "next-i18next"
import React from "react"
import styles from "./pitch.module.css"

const EMPTY = "–"

/** At or below this level (dBFS) an input counts as silent and shows a dash. */
const SILENT_DB = -60

const formatDb = (db: number) => (db < 0 ? `−${-db}` : String(db))

const formatCents = (cents: number) => {
   const rounded = Math.round(cents)
   return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${-rounded}` : "0"
}

type ReadoutProps = {
   readout: ReadoutValues
}

export const Readout = (props: ReadoutProps) => {
   const { readout } = props
   const { t } = useTranslation(PITCH_TNS)
   const { midi, hz, cents, target, inTune, db } = readout
   const level = (db: number | null) =>
      db === null || db <= SILENT_DB
         ? EMPTY
         : t("readout.dbValue", { value: formatDb(db) })

   return (
      <div className={styles.readout}>
         <div className={styles.readoutNote}>
            <span className={styles.statLabel}>{t("readout.note")}</span>
            <span className={styles.bigNote}>
               {midi === null ? EMPTY : noteName(midi)}
            </span>
         </div>
         <dl className={styles.stats}>
            <div className={styles.stat}>
               <dt className={styles.statLabel}>{t("readout.cents")}</dt>
               <dd className={styles.statValue}>
                  {cents === null
                     ? EMPTY
                     : t("readout.centsValue", { value: formatCents(cents) })}
                  {inTune && (
                     <CheckCircleIcon
                        className={styles.check}
                        role="img"
                        aria-label={t("readout.inTuneCheck")}
                     />
                  )}
               </dd>
            </div>
            <div className={styles.stat}>
               <dt className={styles.statLabel}>{t("readout.hz")}</dt>
               <dd className={styles.statValue}>
                  {hz === null
                     ? EMPTY
                     : t("readout.hzValue", { value: hz.toFixed(1) })}
               </dd>
            </div>
            <div className={styles.stat}>
               <dt className={styles.statLabel}>{t("readout.target")}</dt>
               <dd className={`${styles.statValue} ${styles.targetValue}`}>
                  {target === null ? EMPTY : noteName(target)}
               </dd>
            </div>
         </dl>
         <dl className={styles.levels}>
            <div className={styles.levelStat}>
               <dt className={styles.statLabel}>{t("readout.micLevel")}</dt>
               <dd className={styles.statValue}>{level(db)}</dd>
            </div>
         </dl>
      </div>
   )
}

export default Readout
