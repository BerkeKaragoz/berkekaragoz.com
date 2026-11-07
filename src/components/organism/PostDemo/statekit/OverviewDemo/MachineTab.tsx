import { DemoButton, DemoRow } from "@/components/organism/PostDemo/DemoUI"
import { Code } from "@/components/organism/PostDemo/statekit/Code"
import {
   EdgeStatus,
   GraphEdge,
   GraphNode,
   NodeStatus,
   StateGraph,
} from "@/components/organism/PostDemo/statekit/StateGraph"
import { cn } from "@shortkit/cn"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const states = ["idle", "brewing", "empty", "filling"] as const

const coffeeMachine = createMachine({
   states: [...states],
   data: { water: 2, cups: 0 },
   events: {
      brew: async ({ draft, setState, S }) => {
         setState(S.brewing)
         if (draft.water === 0) return setState(S.empty)
         await sleep(1500)
         draft.water--
         draft.cups++
         setState(S.idle)
      },
      refill: async ({ draft, setState, S }) => {
         setState(S.filling)
         await sleep(1200)
         draft.water = 2
         setState(S.idle)
      },
   },
   transitionRules: {
      only: {
         idle: ["brewing"],
         brewing: ["idle", "empty"],
         empty: ["filling"],
         filling: ["idle"],
      },
   },
})

const [useCoffeeMachine] = createMachineContext(coffeeMachine)

const code = `
const coffeeMachine = createMachine({
   states: ["idle", "brewing", "empty", "filling"],
   data: { water: 2, cups: 0 },
   events: {
      brew: async ({ draft, setState, S }) => {
         setState(S.brewing)
         if (draft.water === 0) return setState(S.empty)
         await sleep(1500)
         draft.water--
         draft.cups++
         setState(S.idle)
      },
      refill: async ({ draft, setState, S }) => {
         setState(S.filling)
         await sleep(1200)
         draft.water = 2
         setState(S.idle)
      },
   },
   transitionRules: {
      only: {
         idle: ["brewing"],
         brewing: ["idle", "empty"],
         empty: ["filling"],
         filling: ["idle"],
      },
   },
})
`

const bits = (flag: number) => `0b${flag.toString(2).padStart(states.length, "0")}`

const positions: Record<string, [number, number]> = {
   idle: [0, 0],
   brewing: [200, 0],
   filling: [0, 150],
   empty: [200, 150],
}

const nodes: GraphNode[] = states.map((name) => ({
   name,
   x: positions[name][0],
   y: positions[name][1],
   flag: bits(coffeeMachine.STATE[name]),
}))

// One edge per entry in transitionRules.only, labelled with what moves the
// machine along it.
const edges: GraphEdge[] = [
   { from: "idle", to: "brewing", label: "brew()", path: [[124, 17], [200, 17]] },
   { from: "brewing", to: "idle", label: "await", path: [[200, 37], [124, 37]] },
   { from: "brewing", to: "empty", label: "no water", path: [[262, 52], [262, 150]] },
   { from: "empty", to: "filling", label: "refill()", path: [[200, 176], [124, 176]] },
   { from: "filling", to: "idle", label: "await", path: [[62, 150], [62, 52]] },
]

const stateName = (flag: number) =>
   states.find((name) => coffeeMachine.STATE[name] === flag) ?? "?"

const takenEdges = (from: string, to: string) => {
   const edge = edges.find((e) => e.from === from && e.to === to)
   if (edge) return [edge]
   // brew() with no water passes through brewing before its one publish.
   return edges.filter(
      (e) => (e.from === from && e.to === "brewing") || (e.from === "brewing" && e.to === to)
   )
}

type Attempt = { event: string; error?: string; target?: string; key: number }

const MachineTab = () => {
   const m = useCoffeeMachine()
   const current = stateName(m.state)

   const [taken, setTaken] = React.useState<GraphEdge[]>([])
   const [previous, setPrevious] = React.useState(current)
   if (previous !== current) {
      setPrevious(current)
      setTaken(takenEdges(previous, current))
   }

   const [pending, setPending] = React.useState<Record<string, boolean>>({})
   const [attempt, setAttempt] = React.useState<Attempt>()

   const call = (event: "brew" | "refill") => async () => {
      // A new call clears the last one's error rather than show it while it runs.
      setAttempt((a) => a && { event, key: a.key })
      setPending((p) => ({ ...p, [event]: true }))
      try {
         await m.event[event]()
         setAttempt((a) => ({ event, key: (a?.key ?? 0) + 1 }))
      } catch (error) {
         const message = (error as Error).message.split("\n")[0].trim()
         setAttempt((a) => ({
            event,
            error: message,
            target: message.match(/=> (\w+)/)?.[1],
            key: (a?.key ?? 0) + 1,
         }))
      } finally {
         setPending((p) => ({ ...p, [event]: false }))
      }
   }

   // These two only last until their event's await settles.
   const nodeStatus = (name: string): NodeStatus =>
      name !== current
         ? "idle"
         : name === "brewing" || name === "filling"
           ? "busy"
           : "active"

   const edgeStatus = (edge: GraphEdge): EdgeStatus => {
      if (taken.includes(edge)) return "taken"
      const open = (m.availableTransitions & m.STATE[edge.to as keyof typeof m.STATE]) !== 0
      return edge.from === current && open ? "available" : "unavailable"
   }

   return (
      <div className="grid gap-3">
         <DemoRow className="gap-x-3 font-monospace">
            <DemoButton onClick={call("brew")} disabled={pending.brew}>
               brew()
            </DemoButton>
            <DemoButton onClick={call("refill")} disabled={pending.refill}>
               refill()
            </DemoButton>
            <p
               className={cn(
                  "flex-1 min-w-[14rem] text-xs",
                  attempt?.error ? "text-red-600 dark:text-red-400" : "opacity-60"
               )}
            >
               {attempt?.error
                  ? `${attempt.event}() threw: ${attempt.error}`
                  : "Try refill() while idle, or brew() while empty. The rules throw."}
            </p>
         </DemoRow>
         <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex justify-center flex-1 min-w-[16rem] py-2 well overview-graph-grid">
               <StateGraph
                  nodes={nodes}
                  edges={edges}
                  width={324}
                  height={202}
                  nodeStatus={nodeStatus}
                  edgeStatus={edgeStatus}
                  label="State graph of coffeeMachine, drawn from its transitionRules"
                  blocked={
                     attempt?.target
                        ? { name: attempt.target, key: attempt.key }
                        : undefined
                  }
               />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs font-monospace min-w-[11rem]">
               <dt className="opacity-60">m.data.water</dt>
               <dd aria-label={`${m.data.water} of 2`}>
                  {"●".repeat(m.data.water)}
                  {"○".repeat(2 - m.data.water)}
               </dd>
               <dt className="opacity-60">m.data.cups</dt>
               <dd>{m.data.cups}</dd>
               <dt className="opacity-60">m.state</dt>
               <dd>{bits(m.state)}</dd>
               <dt className="opacity-60">m.availableTransitions</dt>
               <dd>{bits(m.availableTransitions)}</dd>
            </dl>
         </div>
         <Code className="max-h-[16rem]">{code}</Code>
      </div>
   )
}

export default MachineTab
