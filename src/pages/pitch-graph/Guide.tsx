import { PITCH_TNS } from "@/features/pitch/i18n"
import { useTranslation } from "next-i18next"
import Link from "next/link"
import React from "react"
import styles from "./pitch.module.css"

type GuideItemProps = {
   title: string
   children: React.ReactNode
}

/** Native details: the text is in the page's HTML while closed. */
const GuideItem = (props: GuideItemProps) => {
   const { title, children } = props

   return (
      <details className={styles.guideItem}>
         <summary>
            <h3>{title}</h3>
         </summary>
         <div className={styles.guideContent}>{children}</div>
      </details>
   )
}

/** What the tool does, under it. Every statement here follows the code. */
export const Guide = () => {
   const { t } = useTranslation(PITCH_TNS)

   return (
      <>
         <h2 className={styles.guideTitle}>{t("guide.title")}</h2>
         <div className={styles.guideList}>
            <GuideItem title={t("guide.use.title")}>
               <p>{t("guide.use.inputs")}</p>
               <p>{t("guide.use.graph")}</p>
               <p>{t("guide.use.readout")}</p>
               <p>{t("guide.use.view")}</p>
            </GuideItem>
            <GuideItem title={t("guide.works.title")}>
               <p>{t("guide.works.plain")}</p>
               <p>{t("guide.works.detail")}</p>
            </GuideItem>
            <GuideItem title={t("guide.privacy.title")}>
               <p>{t("guide.privacy.audio")}</p>
               <p>{t("guide.privacy.video")}</p>
               <p>{t("guide.privacy.storage")}</p>
               <p>
                  {t("guide.privacy.site")}{" "}
                  <Link href="/privacy">{t("guide.privacy.siteLink")}</Link>
               </p>
            </GuideItem>
            <GuideItem title={t("guide.support.title")}>
               <p>{t("guide.support.mic")}</p>
               <p>{t("guide.support.tab")}</p>
               <p>{t("guide.support.processing")}</p>
            </GuideItem>
         </div>
      </>
   )
}

export default Guide
