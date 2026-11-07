import Main from "@/components/atomic/Main/Main"
import AdSenseBanner from "@/components/molecular/AdSenseBanner/AdSenseBanner"
import { ADSENSE_SLOTS } from "@/features/consent/config"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import { createPitchEngine } from "@/features/pitch/engine"
import { PITCH_TNS } from "@/features/pitch/i18n"
import { getPitchStaticProps } from "@/features/pitch/pageProps"
import {
   createSession,
   DEFAULT_RANGE_SEMITONES,
   type Readout as ReadoutValues,
   type Score,
} from "@/features/pitch/session"
import { createSimulatedEngine } from "@/features/pitch/simulatedEngine"
import type { EngineState, PitchEngine } from "@/features/pitch/types"
import { NextPage } from "next"
import { useTranslation } from "next-i18next"
import Head from "next/head"
import React, { useCallback, useEffect, useState } from "react"
import { Controls, Zoom, isZoomStep } from "./Controls"
import { PitchGraph } from "./PitchGraph"
import { Readout } from "./Readout"
import styles from "./pitch.module.css"

// v2: the default went from 1.5 to 2.5 octaves; old choices are dropped.
const ZOOM_STORAGE_KEY = "pitch.zoomSemitones.v2"
const READOUT_INTERVAL_MS = 100

const INITIAL_STATE: EngineState = {
   mic: "off",
   tab: "off",
   latency: { voice: 0, song: 0 },
   warnings: [],
}

const EMPTY_READOUT: ReadoutValues = {
   midi: null,
   hz: null,
   cents: null,
   target: null,
   inTune: false,
}

const EMPTY_SCORE: Score = { voiced: 0, inTune: 0, percent: null }

const sameReadout = (a: ReadoutValues, b: ReadoutValues) =>
   a.midi === b.midi &&
   a.hz === b.hz &&
   a.cents === b.cents &&
   a.target === b.target &&
   a.inTune === b.inTune

export const getStaticProps = getPitchStaticProps

const PitchPage: NextPage = () => {
   const { t } = useTranslation(PITCH_TNS)
   const [session] = useState(() => createSession({ windowSeconds: 8 }))
   const [engine, setEngine] = useState<PitchEngine | null>(null)
   const [engineState, setEngineState] = useState<EngineState>(INITIAL_STATE)
   const [failed, setFailed] = useState(false)
   const [readout, setReadout] = useState<ReadoutValues>(EMPTY_READOUT)
   const [score, setScore] = useState<Score>(EMPTY_SCORE)
   const [zoom, setZoom] = useState(DEFAULT_RANGE_SEMITONES)
   // Read after mount, so the server render and hydration agree.
   const [insecure, setInsecure] = useState(false)
   useEffect(() => setInsecure(window.isSecureContext === false), [])

   // The engine: simulated with ?simulate.
   useEffect(() => {
      const params = new URLSearchParams(window.location.search)

      let created: PitchEngine
      try {
         created = params.has("simulate")
            ? createSimulatedEngine()
            : createPitchEngine()
      } catch (error) {
         console.error(error)
         setFailed(true)
         return
      }

      const unsubscribe = [
         created.onFrames((frames) => session.addFrames(frames)),
         created.onSpectrum((frames) => session.addSpectrum(frames)),
         created.onState(setEngineState),
      ]
      setEngineState(created.getState())
      setEngine(created)

      return () => {
         unsubscribe.forEach((off) => off())
         created.dispose()
         setEngine(null)
      }
   }, [session])

   // The zoom, remembered per browser.
   useEffect(() => {
      try {
         const stored = Number(window.localStorage.getItem(ZOOM_STORAGE_KEY))
         if (isZoomStep(stored)) setZoom(stored)
      } catch {
         // Storage blocked: keep the default.
      }
   }, [])

   const changeZoom = useCallback((semitones: number) => {
      setZoom(semitones)
      try {
         window.localStorage.setItem(ZOOM_STORAGE_KEY, String(semitones))
      } catch {
         // Storage blocked: the zoom still works for this visit.
      }
   }, [])

   // Turning the mic or the tab on or off starts a new take.
   const micOn = engineState.mic === "on"
   const tabOn = engineState.tab === "on"
   useEffect(() => {
      session.setActive({ voice: micOn, song: tabOn })
      session.resetScore()
      setScore(session.score())
   }, [session, micOn, tabOn])

   // Readout and score at ~10 Hz; the graph reads the session every frame.
   useEffect(() => {
      const id = setInterval(() => {
         const nextReadout = session.readout()
         setReadout((prev) => (sameReadout(prev, nextReadout) ? prev : nextReadout))
         const nextScore = session.score()
         setScore((prev) =>
            prev.voiced === nextScore.voiced && prev.inTune === nextScore.inTune
               ? prev
               : nextScore
         )
      }, READOUT_INTERVAL_MS)
      return () => clearInterval(id)
   }, [session])

   const toggleMic = () => {
      if (!engine) return
      if (engineState.mic === "on") engine.disableMic()
      else engine.enableMic().catch((error) => console.error(error))
   }

   const toggleTab = () => {
      if (!engine || engineState.tab === "unsupported") return
      if (engineState.tab === "on") engine.stopTab()
      else engine.shareTab().catch((error) => console.error(error))
   }

   return (
      <PageContainer>
         <Head>
            <title>{t("meta.title")}</title>
            <meta name="description" content={t("meta.description")} />
            <meta property="og:type" content="website" />
            <meta property="og:title" content={t("meta.title")} />
            <meta property="og:description" content={t("meta.description")} />
            <link href="/favicon.ico" rel="icon" />
         </Head>

         <Header />
         <Main>
            <Section block className={`py-10 sm:py-14 ${styles.tool}`}>
               <h1 className={styles.title}>{t("intro.title")}</h1>
               <p className={styles.intro}>{t("intro.description")}</p>

               <div className={styles.panel}>
                  <Controls
                     state={engineState}
                     failed={failed}
                     insecure={insecure}
                     onMic={toggleMic}
                     onTab={toggleTab}
                  />
                  <Readout readout={readout} score={score} />
                  <PitchGraph
                     session={session}
                     engine={engine}
                     semitones={zoom}
                     ariaLabel={t("graph.ariaLabel")}
                  />
                  <div className={styles.legend} aria-hidden="true">
                     <span className={styles.legendItem}>
                        <span className={`${styles.swatch} ${styles.swatchVoice}`} />
                        {t("graph.voice")}
                     </span>
                     <span className={styles.legendItem}>
                        <span className={`${styles.swatch} ${styles.swatchSong}`} />
                        {t("graph.song")}
                     </span>
                     <span className={styles.legendItem}>
                        <span
                           className={`${styles.swatch} ${styles.swatchTarget}`}
                        />
                        {t("graph.target")}
                     </span>
                  </div>
                  <Zoom value={zoom} onChange={changeZoom} />
               </div>
            </Section>
            <Section block>
               <AdSenseBanner slot={ADSENSE_SLOTS.tool} className="mb-10" />
            </Section>
         </Main>
         <Footer />
      </PageContainer>
   )
}

export default PitchPage
