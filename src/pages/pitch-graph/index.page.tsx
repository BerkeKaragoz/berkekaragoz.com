import Main from "@/components/atomic/Main/Main"
import AdSenseBanner from "@/components/molecular/AdSenseBanner/AdSenseBanner"
import { ADSENSE_SLOTS } from "@/features/consent/config"
import PageContainer from "@/components/atomic/PageContainer/PageContainer"
import Section from "@/components/atomic/Section/Section"
import Footer from "@/components/organism/Footer/Footer"
import Header from "@/components/organism/Header/Header"
import { watchPitchActiveUse } from "@/features/pitch/analytics"
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
/** When the mic was last on; within MIC_RESUME_MS it starts with the page. */
const MIC_STORAGE_KEY = "pitch.micOnAt"
const MIC_RESUME_MS = 2 * 60 * 60 * 1000
/** How often a running source refreshes its time in storage. */
const STAMP_EVERY_MS = 60 * 1000
/** When the mic or a tab was last on; the overlay stays away this long after. */
const USED_STORAGE_KEY = "pitch.usedAt"
const OVERLAY_COOLDOWN_MS = 10 * 60 * 1000

/** Whether the mic was on within MIC_RESUME_MS, so starting it won't surprise. */
const micRecentlyOn = () => {
   try {
      const at = Number(window.localStorage.getItem(MIC_STORAGE_KEY))
      return at > 0 && Date.now() - at < MIC_RESUME_MS
   } catch {
      return false
   }
}

const stampMic = (on: boolean) => {
   try {
      if (on) window.localStorage.setItem(MIC_STORAGE_KEY, String(Date.now()))
      else window.localStorage.removeItem(MIC_STORAGE_KEY)
   } catch {
      // Storage blocked: the mic just waits for a click next time.
   }
}

const readUsedAt = () => {
   try {
      return Number(window.localStorage.getItem(USED_STORAGE_KEY)) || 0
   } catch {
      return 0
   }
}

const stampUsed = () => {
   try {
      window.localStorage.setItem(USED_STORAGE_KEY, String(Date.now()))
   } catch {
      // Storage blocked: the cooldown only lasts this visit.
   }
}

const READOUT_INTERVAL_MS = 100
/** How long the mic may sit unused before its button pulses. */
const NUDGE_AFTER_MS = 20000

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
      // A mic that was on in the last two hours starts again with the page;
      // anyone else gets the buttons, and the browser asks after a click.
      if (window.isSecureContext !== false && micRecentlyOn())
         created.enableMic().catch((error) => console.error(error))

      // One analytics event for a visit that really used the tool.
      if (!params.has("simulate")) unsubscribe.push(watchPitchActiveUse(created))

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

   // Remember the mic while it runs; forget it once access is refused.
   const micRefused = engineState.mic === "denied"
   useEffect(() => {
      if (micRefused) stampMic(false)
      if (!micOn) return
      stampMic(true)
      const id = setInterval(() => stampMic(true), STAMP_EVERY_MS)
      return () => clearInterval(id)
   }, [micOn, micRefused])

   // Note when anything last ran: for ten minutes after, the overlay stays
   // away, so stopping the mic doesn't throw the panel back under it.
   const active = micOn || tabOn
   const [usedAt, setUsedAt] = useState(0)
   useEffect(() => setUsedAt(readUsedAt()), [])
   useEffect(() => {
      if (!active) return
      stampUsed()
      const id = setInterval(stampUsed, STAMP_EVERY_MS)
      return () => {
         clearInterval(id)
         stampUsed()
         setUsedAt(Date.now())
      }
   }, [active])
   const [cooling, setCooling] = useState(false)
   useEffect(() => {
      const left = usedAt + OVERLAY_COOLDOWN_MS - Date.now()
      if (left <= 0) return setCooling(false)
      setCooling(true)
      const id = setTimeout(() => setCooling(false), left)
      return () => clearTimeout(id)
   }, [usedAt])

   // Nothing running, nor lately: the buttons sit centred over the panel.
   const overlay = !active && !cooling

   // Pulse the mic button once it has sat unused for a while.
   const [nudgeMic, setNudgeMic] = useState(false)
   const micIdle =
      !insecure &&
      (engineState.mic === "off" ||
         engineState.mic === "denied" ||
         engineState.mic === "busy" ||
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
      if (engineState.mic === "on") {
         engine.disableMic()
         stampMic(false)
      } else engine.enableMic().catch((error) => console.error(error))
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
                  {/* Nothing running: the buttons sit centred over a dimmed
                      panel; the panel below keeps its layout but is out of reach. */}
                  {overlay && (
                     <div className={styles.overlay}>
                        <Controls
                           state={engineState}
                           failed={failed}
                           insecure={insecure}
                           nudgeMic={nudgeMic}
                           idPrefix="pitch-overlay"
                           onMic={toggleMic}
                           onTab={toggleTab}
                        />
                     </div>
                  )}
                  <div
                     className={styles.panelBody}
                     aria-hidden={overlay || undefined}
                     inert={overlay}
                  >
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
                           <span
                              className={`${styles.swatch} ${styles.swatchVoice}`}
                           />
                           {t("graph.voice")}
                        </span>
                        <span className={styles.legendItem}>
                           <span
                              className={`${styles.swatch} ${styles.swatchSong}`}
                           />
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
