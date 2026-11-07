import { cn } from "@shortkit/cn"
import { DemoButton, DemoRow } from "@/components/organism/PostDemo/DemoUI"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// The post's noteMachine, as the post writes it.
const states = ["idle", "saving", "saved", "failed"] as const

const noteMachine = createMachine({
   states: [...states],
   data: { message: "Not saved yet", saves: 0 },
   events: {
      save: async ({ draft, setState, S }, fail: boolean) => {
         setState(S.saving)
         draft.message = "Saving…"

         try {
            await sleep(1500)
            if (fail) throw new Error("The network is down")

            draft.saves++
            draft.message = `Saved (${draft.saves})`
            setState(S.saved)
         } catch (error) {
            draft.message = (error as Error).message
            setState(S.failed)
            throw error
         }
      },
   },
})

const [useNoteMachine] = createMachineContext(noteMachine)

type StateName = (typeof states)[number]

const stateName = (flag: number): StateName =>
   states.find((name) => noteMachine.STATE[name] === flag) ?? "idle"

// The last call's publishes, as subscribeEvents reports them: one with no
// outcome as the event starts, one with true or false as it settles. Kept
// outside the component, so the timeline still matches the note after the
// demo remounts.
type Publish = { at: number; state: StateName; message: string }
type Run = { startedAt: number; start: Publish; settle?: Publish }

let run: Run | undefined
const listeners = new Set<() => void>()

noteMachine.subscribeEvents(([, , success]) => {
   const now = performance.now()
   const publish = (at: number): Publish => ({
      at,
      state: stateName(noteMachine.state),
      message: noteMachine.data.message,
   })

   if (success === undefined) run = { startedAt: now, start: publish(0) }
   else if (run) run = { ...run, settle: publish(now - run.startedAt) }

   listeners.forEach((listener) => listener())
})

const subscribeRun = (listener: () => void) => {
   listeners.add(listener)
   return () => listeners.delete(listener)
}

const useRun = () =>
   React.useSyncExternalStore(
      subscribeRun,
      () => run,
      () => undefined
   )

const save = (fail: boolean) => noteMachine.event.save(fail).catch(() => {})

const C: React.FC<React.PropsWithChildren> = (props) => (
   <code className="font-monospace text-[0.9em]">{props.children}</code>
)

const outcomeText = {
   saved: "text-green-700 dark:text-green-400",
   failed: "text-red-700 dark:text-red-400",
}

// What just happened, and why the note shows what it shows.
const says: Record<StateName, React.ReactNode> = {
   idle: (
      <>
         Save the note. <C>save</C> publishes twice: as it starts, and as it settles.
      </>
   ),
   saving: (
      <>
         <C>save</C> published before its <C>await</C>, so the note shows Saving… for the
         whole wait.
      </>
   ),
   saved: (
      <>
         The <C>await</C> resolved and <C>save</C> published again as it settled, so the
         note shows the new count.
      </>
   ),
   failed: (
      <>
         <C>save</C> threw after its <C>await</C>, so the note shows what the{" "}
         <C>catch</C> wrote, and the call&apos;s promise rejected.
      </>
   ),
}

// A component that reads the machine, the way a page would.
const Note = () => {
   const m = useNoteMachine()
   const current = stateName(m.state)

   return (
      <div className="grid gap-2 p-3 text-sm well">
         <p className="font-semibold">Shopping list</p>
         <ul className="grid gap-0.5 opacity-80">
            <li>Oat milk</li>
            <li>Eggs, a dozen</li>
            <li>Coffee beans</li>
            <li className="opacity-60">…</li>
         </ul>
         <p
            className={cn(
               "text-xs",
               current === "saved" || current === "failed"
                  ? outcomeText[current]
                  : "opacity-60"
            )}
         >
            {m.data.message}
         </p>
      </div>
   )
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`

type Tone = "primary" | "success" | "danger" | "pending"

const dotTone: Record<Tone, string> = {
   primary: "bg-primary-500 border-primary-500 dark:bg-primary-400 dark:border-primary-400",
   success: "bg-green-600 border-green-600 dark:bg-green-400 dark:border-green-400",
   danger: "bg-red-600 border-red-600 dark:bg-red-400 dark:border-red-400",
   pending: "bg-background-400 border-background-400 dark:bg-background-600 dark:border-background-600",
}

// Rows are placed by hand, so the rail can run under both dots.
const rows = ["row-start-1", "row-start-2", "row-start-3"]

// One publish on the timeline: when, and what went out with it. The dot sits
// 11px down its cell, which the rail lines up with.
const PublishRow: React.FC<
   React.PropsWithChildren<{ row: number; time?: string; tone: Tone; title: React.ReactNode }>
> = (props) => (
   <>
      <span className={cn("col-start-1 pt-0.5 text-xs text-right font-monospace opacity-60", rows[props.row])}>
         {props.time ?? ""}
      </span>
      <span className={cn("relative flex justify-center col-start-2 pt-1.5", rows[props.row])}>
         <span
            className={cn(
               "w-2.5 h-2.5 rounded-full border-2",
               dotTone[props.tone]
            )}
         />
      </span>
      <div
         className={cn(
            "grid col-start-3 gap-0.5",
            rows[props.row],
            props.tone === "pending" && "opacity-60"
         )}
      >
         <span className="font-semibold leading-5">{props.title}</span>
         {/* Two lines kept, so filling a row in doesn't move the rest. */}
         <span className="leading-5 min-h-[2.5rem]">{props.children}</span>
      </div>
   </>
)

const Sent: React.FC<React.PropsWithChildren<{ publish: Publish }>> = (props) => (
   <>
      Sent <C>{props.publish.state}</C> and “{props.publish.message}”, {props.children}.
   </>
)

// The wait between the two publishes. Its rail runs from one dot to the next
// and fills over the sleep, so it runs out as the second publish lands.
const Wait: React.FC<{ run?: Run }> = ({ run }) => {
   const fill = React.useRef<HTMLSpanElement>(null)
   const waiting = run !== undefined && run.settle === undefined

   React.useLayoutEffect(() => {
      if (!waiting || !fill.current) return
      const animation = fill.current.animate(
         [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }],
         {
            duration: 1500,
            delay: run.startedAt - performance.now(),
            easing: "linear",
            fill: "forwards",
         }
      )
      return () => animation.cancel()
   }, [waiting, run?.startedAt])

   return (
      <>
         <span className="relative flex justify-center col-start-2 row-span-2 row-start-1">
            <span className="absolute top-[11px] -bottom-[11px] w-0.5 overflow-hidden bg-background-500/30">
               <span
                  ref={fill}
                  className="absolute inset-0 origin-top bg-primary-500/70 dark:bg-primary-400/70"
                  style={{ transform: run?.settle ? "scaleY(1)" : "scaleY(0)" }}
               />
            </span>
         </span>
         <div className="grid col-start-3 row-start-2 gap-0.5 py-3">
            <C>await sleep(1500)</C>
            <span className="opacity-70">Nothing is published while it waits.</span>
         </div>
      </>
   )
}

const Timeline = () => {
   const run = useRun()
   const settle = run?.settle
   const failed = settle?.state === "failed"

   return (
      <div className="grid grid-cols-[2.25rem_0.75rem_minmax(0,1fr)] gap-x-2 p-3 text-sm well">
         <Wait run={run} />
         <PublishRow
            row={0}
            time={run && seconds(run.start.at)}
            tone={run ? "primary" : "pending"}
            title="Published as it starts"
         >
            {run ? (
               <>
                  <Sent publish={run.start}>
                     written before the <C>await</C>
                  </Sent>
               </>
            ) : (
               <>
                  What the event writes before the <C>await</C>.
               </>
            )}
         </PublishRow>
         <PublishRow
            row={2}
            time={settle && seconds(settle.at)}
            tone={!settle ? "pending" : failed ? "danger" : "success"}
            title={
               <>
                  Published as it settles
                  {settle && (
                     <span className={outcomeText[failed ? "failed" : "saved"]}>
                        {failed ? ": fail" : ": success"}
                     </span>
                  )}
               </>
            }
         >
            {!settle ? (
               <>
                  What it writes after the <C>await</C>.
               </>
            ) : failed ? (
               <>
                  <Sent publish={settle}>
                     written in the <C>catch</C>
                  </Sent>
               </>
            ) : (
               <>
                  <Sent publish={settle}>
                     written after the <C>await</C>
                  </Sent>
               </>
            )}
         </PublishRow>
      </div>
   )
}

const AsyncEventsDemo = () => {
   const m = useNoteMachine()
   const current = stateName(m.state)
   const isSaving = current === "saving"

   return (
      <div className="grid gap-4">
         <DemoRow controls>
            <DemoButton disabled={isSaving} onClick={() => save(false)}>
               Save the note
            </DemoButton>
            <DemoButton disabled={isSaving} onClick={() => save(true)}>
               Save with the network down
            </DemoButton>
         </DemoRow>
         <p aria-live="polite" className="text-sm min-h-[3.75rem] sm:min-h-[2.5rem]">
            {says[current]}
         </p>
         <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)]">
            <div className="grid gap-1">
               <span className="text-xs opacity-60 font-monospace">&lt;Note /&gt;</span>
               <Note />
            </div>
            <div className="grid gap-1">
               <span className="text-xs opacity-60">Publishes</span>
               <Timeline />
            </div>
         </div>
      </div>
   )
}

export default AsyncEventsDemo
