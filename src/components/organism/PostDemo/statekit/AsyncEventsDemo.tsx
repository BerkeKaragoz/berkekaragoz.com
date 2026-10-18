import {
   DemoButton,
   DemoRow,
   DemoStates,
} from "@/components/organism/PostDemo/DemoUI"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const noteMachine = createMachine({
   states: ["idle", "saving", "saved", "failed"],
   data: { message: "Not saved yet", saves: 0 },
   events: {
      save: async ({ draft, setState, S }, fail: boolean) => {
         // Published right away, before the first await.
         setState(S.saving)
         draft.message = "Saving…"

         try {
            await sleep(1500)
            if (fail) throw new Error("The network is down")

            // Published when the event settles.
            draft.saves++
            draft.message = `Saved ${draft.saves} times`
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

type Notification = [name: string, args: unknown, success?: boolean]

const formatNotification = ([name, args, success]: Notification) =>
   `[${JSON.stringify(name)}, ${JSON.stringify(args)}, ${String(success)}]`

const AsyncEventsDemo = () => {
   const m = useNoteMachine()
   const [log, setLog] = React.useState<string[]>([])
   const isSaving = (m.state & m.STATE.saving) !== 0

   React.useEffect(
      () =>
         noteMachine.subscribeEvents((notification) =>
            setLog((log) => [...log.slice(-5), formatNotification(notification)])
         ),
      []
   )

   const save = (fail: boolean) => m.event.save(fail).catch(() => {})

   return (
      <div className="grid grid-cols-1 gap-4">
         <DemoRow>
            <DemoButton disabled={isSaving} onClick={() => save(false)}>
               Save
            </DemoButton>
            <DemoButton disabled={isSaving} onClick={() => save(true)}>
               Save, then fail
            </DemoButton>
         </DemoRow>
         <div className="grid grid-cols-1 gap-2">
            <DemoStates state={m.state} STATE={m.STATE} />
            <p className="font-monospace text-sm">data.message: {m.data.message}</p>
         </div>
         <div>
            <div className="mb-1 text-xs opacity-60">subscribeEvents</div>
            <pre className="p-2 m-0 font-monospace text-xs card-backdrop min-h-[7.5rem] whitespace-pre-wrap">
               {log.length ? log.join("\n") : "Nothing yet. Click Save."}
            </pre>
         </div>
      </div>
   )
}

export default AsyncEventsDemo
