import Main from "@/components/atomic/Main/Main"
import AdSenseBanner from "@/components/molecular/AdSenseBanner/AdSenseBanner"
import { ADSENSE_SLOTS } from "@/features/consent/config"
import { sendAnalyticsEvent } from "@/features/consent/google"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import { watchActiveUse } from "@/features/pitch/activeUse"
import { createPitchEngine } from "@/features/pitch/engine"
import { PITCH_TNS } from "@/features/pitch/i18n"
import { getPitchStaticProps } from "@/features/pitch/pageProps"
import {
   createSession,
   DEFAULT_RANGE_SEMITONES,
   type Readout as ReadoutValues,
} from "@/features/pitch/session"
import { createSimulatedEngine } from "@/features/pitch/simulatedEngine"
import type { EngineState, PitchEngine } from "@/features/pitch/types"
import { useCanonicalUrl } from "@/lib/i18n/useCanonicalUrl"
import { NextPage } from "next"
import { useTranslation } from "next-i18next"
import Head from "next/head"
import React, { useCallback, useEffect, useRef, useState } from "react"
import {
   Controls,
   GRAPH_DEFAULT_HEIGHT,
   HeightHandle,
   Zoom,
   clampGraphHeight,
   isZoomStep,
} from "./Controls"
import { Guide } from "./Guide"
import { PitchGraph } from "./PitchGraph"
import { Readout } from "./Readout"
import styles from "./pitch.module.css"

// v2: the default went from 1.5 to 2.5 octaves; old choices are dropped.
const ZOOM_STORAGE_KEY = "pitch.zoomSemitones.v2"
const HEIGHT_STORAGE_KEY = "pitch.graphHeight"
const READOUT_INTERVAL_MS = 100
/** How long the mic may sit unused before its button pulses. */
const NUDGE_AFTER_MS = 20000
/** GA4 event for two minutes of use (see activeUse.ts). The name is also set in GA4. */
const ACTIVE_USE_EVENT = "pitch_active_2min"

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

const sameReadout = (a: ReadoutValues, b: ReadoutValues) =>
   a.midi === b.midi &&
   a.hz === b.hz &&
   a.cents === b.cents &&
   a.target === b.target &&
   a.inTune === b.inTune

export const getStaticProps = getPitchStaticProps

const PitchPage: NextPage = () => {
   const { t } = useTranslation(PITCH_TNS)
   const canonicalUrl = useCanonicalUrl("/pitch-graph")
   const [session] = useState(() => createSession({ windowSeconds: 8 }))
   const [engine, setEngine] = useState<PitchEngine | null>(null)
   const [engineState, setEngineState] = useState<EngineState>(INITIAL_STATE)
   const [failed, setFailed] = useState(false)
   const [readout, setReadout] = useState<ReadoutValues>(EMPTY_READOUT)
   const [zoom, setZoom] = useState(DEFAULT_RANGE_SEMITONES)
   const [graphHeight, setGraphHeight] = useState(GRAPH_DEFAULT_HEIGHT)
   const panelRef = useRef<HTMLDivElement>(null)
   const [fullscreen, setFullscreen] = useState(false)
   // Read after mount, so the server render and hydration agree.
   const [insecure, setInsecure] = useState(false)
   const [canFullscreen, setCanFullscreen] = useState(false)
   useEffect(() => {
      setInsecure(window.isSecureContext === false)
      setCanFullscreen(document.fullscreenEnabled === true)
      const onChange = () =>
         setFullscreen(document.fullscreenElement === panelRef.current)
      document.addEventListener("fullscreenchange", onChange)
      return () => document.removeEventListener("fullscreenchange", onChange)
   }, [])

   const toggleFullscreen = () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      else panelRef.current?.requestFullscreen().catch(() => {})
   }

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
      // The mic starts with the page; the browser asks for access first.
      if (window.isSecureContext !== false)
         created.enableMic().catch((error) => console.error(error))

      // One analytics event for a visit that really used the tool.
      if (!params.has("simulate")) {
         unsubscribe.push(
            watchActiveUse(created, () => sendAnalyticsEvent(ACTIVE_USE_EVENT))
         )
      }

      return () => {
         unsubscribe.forEach((off) => off())
         created.dispose()
         setEngine(null)
      }
   }, [session])

   // The zoom and the graph height, remembered per browser.
   useEffect(() => {
      try {
         const stored = Number(window.localStorage.getItem(ZOOM_STORAGE_KEY))
         if (isZoomStep(stored)) setZoom(stored)
         const height = Number(window.localStorage.getItem(HEIGHT_STORAGE_KEY))
         if (height > 0) setGraphHeight(clampGraphHeight(height))
      } catch {
         // Storage blocked: keep the defaults.
      }
   }, [])

   const changeGraphHeight = useCallback((px: number, done: boolean) => {
      setGraphHeight(px)
      if (!done) return
      try {
         window.localStorage.setItem(HEIGHT_STORAGE_KEY, String(px))
      } catch {
         // Storage blocked: the height still holds for this visit.
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

   const micOn = engineState.mic === "on"
   const tabOn = engineState.tab === "on"
   useEffect(() => {
      session.setActive({ voice: micOn, song: tabOn })
   }, [session, micOn, tabOn])

   // Pulse the mic button once it has sat unused for a while.
   const [nudgeMic, setNudgeMic] = useState(false)
   const micIdle =
      !insecure &&
      (engineState.mic === "off" ||
         engineState.mic === "denied" ||
         engineState.mic === "error")
   useEffect(() => {
      setNudgeMic(false)
      if (!micIdle) return
      const id = setTimeout(() => setNudgeMic(true), NUDGE_AFTER_MS)
      return () => clearTimeout(id)
   }, [micIdle])

   // The readout at ~10 Hz; the graph reads the session every frame.
   useEffect(() => {
      const id = setInterval(() => {
         const nextReadout = session.readout()
         setReadout((prev) => (sameReadout(prev, nextReadout) ? prev : nextReadout))
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
            <link rel="canonical" href={canonicalUrl} />
            <meta property="og:url" content={canonicalUrl} />
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

               <div ref={panelRef} className={styles.panel}>
                  <Controls
                     state={engineState}
                     failed={failed}
                     insecure={insecure}
                     nudgeMic={nudgeMic}
                     onMic={toggleMic}
                     onTab={toggleTab}
                  />
                  <Readout readout={readout} />
                  <PitchGraph
                     session={session}
                     engine={engine}
                     semitones={zoom}
                     height={fullscreen ? undefined : graphHeight}
                     ariaLabel={t("graph.ariaLabel")}
                  />
                  {!fullscreen && (
                     <HeightHandle
                        value={graphHeight}
                        onChange={changeGraphHeight}
                     />
                  )}
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
                  <Zoom
                     value={zoom}
                     onChange={changeZoom}
                     fullscreen={
                        canFullscreen
                           ? { on: fullscreen, onToggle: toggleFullscreen }
                           : undefined
                     }
                  />
               </div>
            </Section>
            <Section block>
               <AdSenseBanner slot={ADSENSE_SLOTS.tool} className="mb-10" />
            </Section>
            <Section block className={`pb-10 sm:pb-14 ${styles.tool}`}>
               <Guide />
            </Section>
         </Main>
         <Footer />
      </PageContainer>
   )
}

export default PitchPage
