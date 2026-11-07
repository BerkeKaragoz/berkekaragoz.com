import { DemoButton, DemoRow } from "@/components/organism/PostDemo/DemoUI"
import { Code } from "@/components/organism/PostDemo/statekit/Code"
import {
   EdgeStatus,
   GraphEdge,
   GraphNode,
   NodeStatus,
   StateGraph,
} from "@/components/organism/PostDemo/statekit/StateGraph"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

// The landing page's importMachine, as the post writes it.
const states = ["idle", "importing", "ready", "failed"] as const

const importMachine = createMachine({
   states: [...states],
   data: { rows: [] as string[] },
   events: {
      importFile: async ({ draft, setState, S }, file: File) => {
         setState(S.importing)
         try {
            const text = await file.text()
            draft.rows = text.split("\n")
            setState(S.ready)
         } catch (error) {
            setState(S.failed)
            throw error
         }
      },
   },
})

const [useImportMachine] = createMachineContext(importMachine)

const code = `
importFile: async ({ draft, setState, S }, file) => {
   setState(S.importing)
   try {
      const text = await file.text()
      draft.rows = text.split("\\n")
      setState(S.ready)
   } catch (error) {
      setState(S.failed)
      throw error
   }
}`

// Where the event is in the code above, told by the state it published.
const lines: Record<(typeof states)[number], number[]> = {
   idle: [],
   importing: [2, 4],
   ready: [5, 6],
   failed: [8, 9],
}

// No edges back into importing: any state can call importFile again, and
// drawing that from every state buries the three that matter.
const nodes: GraphNode[] = [
   { name: "idle", x: 0, y: 0 },
   { name: "importing", x: 0, y: 64 },
   { name: "ready", x: 0, y: 128, tone: "success" },
   { name: "failed", x: 150, y: 128, tone: "danger" },
]

const edges: GraphEdge[] = [
   { from: "idle", to: "importing", label: "importFile()", path: [[62, 24], [62, 64]] },
   { from: "importing", to: "ready", label: "success", path: [[40, 88], [40, 128]] },
   {
      from: "importing",
      to: "failed",
      label: "fail",
      path: [[100, 88], [100, 108], [212, 108], [212, 128]],
   },
]

const stateName = (flag: number) =>
   states.find((name) => importMachine.STATE[name] === flag) ?? "idle"

// Sample files, so the slow and failing paths can be tried without one at hand.

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class SlowFile extends File {
   text() {
      return sleep(1800).then(() => super.text())
   }
}

class DeletedFile extends File {
   text() {
      return sleep(900).then(() => {
         throw new DOMException("The file could not be read.", "NotReadableError")
      })
   }
}

const orders = [
   "order,customer,total",
   "1042,Ada Lovelace,42.00",
   "1043,Grace Hopper,18.50",
   "1044,Alan Turing,7.25",
   "1045,Katherine Johnson,64.10",
   "1046,Edsger Dijkstra,12.00",
].join("\n")

const cities = ["city,country", "Lisbon,Portugal", "Osaka,Japan"].join("\n")

// Labelled by what they do, since a file name says nothing about that.
const samples = [
   { label: "A slow file", file: () => new SlowFile([orders], "orders.csv") },
   { label: "A quick file", file: () => new File([cities], "cities.csv") },
   { label: "A file that can't be read", file: () => new DeletedFile([], "deleted.csv") },
]

const run = (file: File | undefined) => {
   if (file) importMachine.event.importFile(file).catch(() => {})
}

const C: React.FC<React.PropsWithChildren> = (props) => (
   <code className="font-monospace text-[0.9em]">{props.children}</code>
)

// What just happened, and why the component shows what it shows.
const says: Record<(typeof states)[number], React.ReactNode> = {
   idle: (
      <>
         Import a file. <C>importFile</C> publishes once when it starts and again when it
         settles.
      </>
   ),
   importing: (
      <>
         <C>importFile</C> published <C>importing</C> before its <C>await</C>, so the
         component shows Importing… while the file is read.
      </>
   ),
   ready: (
      <>
         The <C>await</C> resolved. <C>importFile</C> set <C>rows</C>, then published{" "}
         <C>ready</C>.
      </>
   ),
   failed: (
      <>
         <C>file.text()</C> threw. <C>importFile</C> published <C>failed</C>, then rethrew
         to its caller.
      </>
   ),
}

// The post's <Importer />, with the sample buttons standing in for its file
// input.
const Importer = () => {
   const m = useImportMachine()

   if (m.state === m.STATE.importing) return <p>Importing…</p>

   return (
      <>
         {m.state === m.STATE.idle && <p className="opacity-60">No file imported yet.</p>}
         {m.state === m.STATE.failed && <p>Couldn&apos;t read that file.</p>}
         {m.state === m.STATE.ready && (
            <ul className="text-xs font-monospace">
               {m.data.rows.slice(0, 3).map((row, i) => (
                  <li key={i}>{row}</li>
               ))}
               {m.data.rows.length > 3 && <li className="opacity-60">…</li>}
            </ul>
         )}
      </>
   )
}

const ImporterDemo = () => {
   const m = useImportMachine()
   const current = stateName(m.state)

   // The edge the last publish moved along, if one is drawn.
   const [taken, setTaken] = React.useState<GraphEdge>()
   const [previous, setPrevious] = React.useState(current)
   if (previous !== current) {
      setPrevious(current)
      setTaken(edges.find((e) => e.from === previous && e.to === current))
   }

   const nodeStatus = (name: string): NodeStatus =>
      name !== current ? "idle" : name === "importing" ? "busy" : "active"

   const edgeStatus = (edge: GraphEdge): EdgeStatus =>
      edge === taken ? "taken" : edge.from === current ? "available" : "unavailable"

   return (
      <div className="grid gap-4">
         <DemoRow controls>
            <span className="mr-1 text-xs opacity-60">Import</span>
            {samples.map((sample) => (
               <DemoButton key={sample.label} onClick={() => run(sample.file())}>
                  {sample.label}
               </DemoButton>
            ))}
         </DemoRow>
         <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,16.5rem)_minmax(0,1fr)]">
            <div className="grid gap-1">
               <span className="text-xs opacity-60 font-monospace">&lt;Importer /&gt;</span>
               <div className="grid content-center gap-2 p-3 text-sm well min-h-[5rem]">
                  <Importer />
               </div>
            </div>
            <p aria-live="polite" className="text-sm">
               {says[current]}
            </p>
            <div className="flex justify-center py-3 well overview-graph-grid">
               <StateGraph
                  nodes={nodes}
                  edges={edges}
                  width={274}
                  height={152}
                  nodeStatus={nodeStatus}
                  edgeStatus={edgeStatus}
                  label="State graph of importMachine"
               />
            </div>
            <Code highlight={lines[current]}>{code}</Code>
         </div>
      </div>
   )
}

export default ImporterDemo
