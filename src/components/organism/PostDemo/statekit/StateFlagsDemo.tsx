import { DemoButton, DemoRow } from "@/components/organism/PostDemo/DemoUI"
import { cn } from "@shortkit/cn"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

// The post's playerMachine.
const playerMachine = createMachine({
   states: ["idle", "playing", "buffering"],
   events: {
      play: ({ setState, S }) => setState(S.playing),
      bufferStart: ({ setState, S }) => setState.enter(S.buffering),
      bufferEnd: ({ setState, S }) => setState.exit(S.buffering),
      stop: ({ setState, S }) => setState(S.idle),
   },
   transitionRules: {
      deny: {
         idle: ["buffering"],
      },
   },
})

const [usePlayerMachine] = createMachineContext(playerMachine)

const S = playerMachine.STATE

type StateName = keyof typeof S
type EventName = "play" | "bufferStart" | "bufferEnd" | "stop"

// Highest bit first, so the cells read as m.state in binary.
const cells: StateName[] = ["buffering", "playing", "idle"]

const C: React.FC<React.PropsWithChildren> = (props) => (
   <code className="font-monospace text-[0.9em]">{props.children}</code>
)

// The last call, and the state before and after it.
type Step = { event: EventName; from: number; to: number; error?: string; key: number }

// What just happened, and why the bits are what they are.
const says = (step?: Step): React.ReactNode => {
   if (!step)
      return (
         <>
            The machine starts in <C>idle</C>, its first declared state, so only{" "}
            <C>idle</C>&apos;s bit is on.
         </>
      )

   if (step.error)
      return (
         <>
            <C>transitionRules.deny</C> doesn&apos;t let <C>idle</C> enter <C>buffering</C>,
            so <C>setState.enter(S.buffering)</C> threw and the state stayed <C>idle</C>.
         </>
      )

   switch (step.event) {
      case "play":
         return step.from & S.buffering ? (
            <>
               <C>play</C> called <C>setState(S.playing)</C>, which replaces every active
               state, so it turned <C>buffering</C> off too.
            </>
         ) : (
            <>
               <C>play</C> called <C>setState(S.playing)</C>, which turned <C>idle</C> off
               and <C>playing</C> on.
            </>
         )
      case "bufferStart":
         return (
            <>
               <C>bufferStart</C> called <C>setState.enter(S.buffering)</C>, which turned{" "}
               <C>buffering</C> on and kept <C>playing</C>. Two bits are on, so{" "}
               <C>m.state === m.STATE.playing</C> is now <C>false</C>.
            </>
         )
      case "bufferEnd":
         return (
            <>
               <C>bufferEnd</C> called <C>setState.exit(S.buffering)</C>, which turned{" "}
               <C>buffering</C> off and kept <C>playing</C>.
            </>
         )
      case "stop":
         return (
            <>
               <C>stop</C> called <C>setState(S.idle)</C>, which turned every active state
               off and <C>idle</C> on.
            </>
         )
   }
}

// A mock track, so the player has something to show.
const track = { title: "Harbor Lights", artist: "Mira Sol", length: 214 }

const clock = (seconds: number) =>
   `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

// What a player component renders from the same bits. It checks each state
// with &, since === misses while two are on.
const Player = () => {
   const m = usePlayerMachine()
   const playing = (m.state & m.STATE.playing) !== 0
   const buffering = (m.state & m.STATE.buffering) !== 0

   const [elapsed, setElapsed] = React.useState(0)
   if (!playing && elapsed !== 0) setElapsed(0)

   // The clock only runs while playing and not buffering.
   React.useEffect(() => {
      if (!playing || buffering) return
      const id = setInterval(() => setElapsed((e) => Math.min(e + 1, track.length)), 1000)
      return () => clearInterval(id)
   }, [playing, buffering])

   return (
      <div className="grid gap-2 p-3 text-sm well">
         <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span>
               <span className="font-semibold">{track.title}</span>
               <span className="ml-2 opacity-70">{track.artist}</span>
            </span>
            <span className="text-xs tabular-nums opacity-70 font-monospace">
               {clock(elapsed)} / {clock(track.length)}
            </span>
         </div>
         <div className="h-1 overflow-hidden rounded-full bg-background-900/10 dark:bg-white/10">
            <div
               className="h-full transition-[width] duration-1000 ease-linear bg-primary-500"
               style={{ width: `${(elapsed / track.length) * 100}%` }}
            />
         </div>
         <p className="flex items-center gap-2 text-xs min-h-[1rem]">
            {!playing && <span className="opacity-70">Stopped</span>}
            {playing && <span>Playing</span>}
            {buffering && (
               <>
                  <span className="opacity-40">·</span>
                  <span
                     aria-hidden
                     className="w-3 h-3 border-2 rounded-full border-primary-500 border-t-transparent animate-spin motion-reduce:animate-none"
                  />
                  <span>Buffering…</span>
               </>
            )}
         </p>
      </div>
   )
}

const StateFlagsDemo = () => {
   const m = usePlayerMachine()
   const [step, setStep] = React.useState<Step>()

   // The machine outlives the demo, so coming back to the page starts it over
   // rather than leave the opening sentence beside a stale state.
   React.useEffect(() => {
      playerMachine.setState(S.idle)
   }, [])

   // A blocked transition throws, and leaves the state as it was.
   const call = (event: EventName) => () => {
      const from = playerMachine.state
      const key = (step?.key ?? 0) + 1
      try {
         m.event[event]()
         setStep({ event, from, to: playerMachine.state, key })
      } catch (error) {
         const message = (error as Error).message.split("\n")[0].trim()
         setStep({ event, from, to: from, error: message, key })
      }
   }

   const on = (name: StateName) => (m.state & S[name]) !== 0
   const playingOnly = m.state === S.playing

   // Calls that would change nothing are disabled. bufferStart from idle stays
   // enabled, since the rule throwing is the point.
   const buttons: { event: EventName; label: string; disabled: boolean }[] = [
      { event: "play", label: "Play", disabled: playingOnly },
      { event: "bufferStart", label: "Start buffering", disabled: on("buffering") },
      { event: "bufferEnd", label: "End buffering", disabled: !on("buffering") },
      { event: "stop", label: "Stop", disabled: on("idle") },
   ]

   // Cells whose bit the last call flipped flash, the one it was refused red.
   const flash = (name: StateName) => {
      if (!step) return
      if (step.error) return name === "buffering" ? "post-demo-flash post-demo-flash-down" : undefined
      return (step.from ^ step.to) & S[name] ? "post-demo-flash" : undefined
   }

   return (
      <div className="grid gap-4">
         <DemoRow controls>
            {buttons.map((b) => (
               <DemoButton key={b.event} onClick={call(b.event)} disabled={b.disabled}>
                  {b.label}
               </DemoButton>
            ))}
         </DemoRow>
         <div className="grid items-start gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
               <div className="flex items-baseline justify-between gap-3 font-monospace">
                  <span className="text-xs opacity-60">m.state</span>
                  <span className="text-sm">
                     0b{m.state.toString(2).padStart(cells.length, "0")} = {m.state}
                  </span>
               </div>
               <div className="grid grid-cols-3 gap-2" aria-hidden>
                  {cells.map((name) => (
                     <div
                        key={`${name}-${flash(name) ? step?.key : 0}`}
                        className={cn(
                           "grid py-2 text-center well font-monospace transition-colors",
                           on(name) && "bg-primary-500/15 dark:bg-primary-400/20",
                           flash(name)
                        )}
                     >
                        <span className={cn("text-xs", !on(name) && "opacity-70")}>{name}</span>
                        <span
                           className={cn(
                              "text-2xl",
                              on(name)
                                 ? "text-primary-700 dark:text-primary-200"
                                 : "text-background-500 dark:text-background-400"
                           )}
                        >
                           {on(name) ? 1 : 0}
                        </span>
                     </div>
                  ))}
               </div>
            </div>
            <div className="grid gap-1">
               <span className="text-xs opacity-60 font-monospace">&lt;Player /&gt;</span>
               <Player />
            </div>
         </div>
         <div aria-live="polite" className="grid gap-1 text-sm min-h-[3.75rem]">
            <p>{says(step)}</p>
            {step?.error && (
               <p className="text-xs break-words text-red-600 dark:text-red-400 font-monospace">
                  {step.error}
               </p>
            )}
         </div>
      </div>
   )
}

export default StateFlagsDemo
