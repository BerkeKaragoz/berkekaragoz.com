import { cn } from "@shortkit/cn"
import React from "react"

// Node cards after Graphitect's: a header with the name and a status dot, then
// rows of mono key/value pairs. A node without a flag is the header alone,
// HEADER_H tall.

// A node's colour while it's current, and of the edge taken into it.
export type GraphTone = "primary" | "success" | "danger"

export type GraphNode = { name: string; x: number; y: number; flag?: string; tone?: GraphTone }

export type GraphEdge = {
   from: string
   to: string
   label: string
   // Port positions, as offsets into the node box.
   path: [number, number][]
}

export type NodeStatus = "active" | "busy" | "idle"
export type EdgeStatus = "taken" | "available" | "unavailable"

type StateGraphProps = {
   nodes: GraphNode[]
   edges: GraphEdge[]
   width: number
   height: number
   nodeStatus: (name: string) => NodeStatus
   edgeStatus: (edge: GraphEdge) => EdgeStatus
   // Changes key on every blocked attempt, so the flash replays.
   blocked?: { name: string; key: number }
   label: string
}

export const NODE_W = 124
export const NODE_H = 52
export const HEADER_H = 24

const Spinner: React.FC<{ x: number; y: number }> = ({ x, y }) => (
   <g transform={`translate(${x} ${y})`}>
      <circle r={5} fill="none" strokeWidth={1.5} className="stroke-primary-400/30" />
      <path
         d="M 0 -5 A 5 5 0 0 1 5 0"
         fill="none"
         strokeWidth={1.5}
         strokeLinecap="round"
         className="stroke-primary-400 overview-graph-spin"
      />
   </g>
)

const nodeTones = {
   primary: {
      stroke: "stroke-primary-500 dark:stroke-primary-400",
      dot: "fill-primary-400 stroke-primary-400",
   },
   success: {
      stroke: "stroke-green-600 dark:stroke-green-400",
      dot: "fill-green-500 stroke-green-500 dark:fill-green-400 dark:stroke-green-400",
   },
   danger: {
      stroke: "stroke-red-600 dark:stroke-red-400",
      dot: "fill-red-500 stroke-red-500 dark:fill-red-400 dark:stroke-red-400",
   },
} satisfies Record<GraphTone, Record<string, string>>

const Node: React.FC<{ node: GraphNode; status: NodeStatus; blockedKey?: number }> = (
   props
) => {
   const { node, status, blockedKey } = props
   const on = status !== "idle"
   const height = node.flag === undefined ? HEADER_H : NODE_H
   const tone = nodeTones[node.tone ?? "primary"]

   return (
      <g transform={`translate(${node.x} ${node.y})`}>
         <rect
            width={NODE_W}
            height={height}
            rx={6}
            strokeWidth={on ? 1.5 : 1}
            className={cn(
               "transition-colors fill-white dark:fill-background-800",
               on ? tone.stroke : "stroke-background-300 dark:stroke-background-500"
            )}
         />
         {blockedKey !== undefined && (
            <rect
               key={blockedKey}
               width={NODE_W}
               height={height}
               rx={6}
               fill="none"
               strokeWidth={2}
               className="stroke-red-500 dark:stroke-red-400 overview-graph-blocked"
            />
         )}
         <text
            x={10}
            y={HEADER_H / 2}
            dominantBaseline="central"
            className={cn(
               "text-xs font-semibold",
               on
                  ? "fill-background-900 dark:fill-background-50"
                  : "fill-background-600 dark:fill-background-300"
            )}
         >
            {node.name}
         </text>
         {status === "busy" ? (
            <Spinner x={NODE_W - 13} y={HEADER_H / 2} />
         ) : (
            <circle
               cx={NODE_W - 13}
               cy={HEADER_H / 2}
               r={4}
               strokeWidth={1.5}
               className={cn(
                  on ? tone.dot : "fill-none stroke-background-400 dark:stroke-background-500"
               )}
            />
         )}
         {node.flag !== undefined && (
            <>
               <line
                  x1={0}
                  x2={NODE_W}
                  y1={HEADER_H}
                  y2={HEADER_H}
                  strokeWidth={1}
                  className="stroke-background-200 dark:stroke-background-700"
               />
               <text
                  x={10}
                  y={HEADER_H + (NODE_H - HEADER_H) / 2}
                  dominantBaseline="central"
                  className="font-monospace text-[11px] fill-background-500 dark:fill-background-400"
               >
                  flag
               </text>
               <text
                  x={NODE_W - 10}
                  y={HEADER_H + (NODE_H - HEADER_H) / 2}
                  dominantBaseline="central"
                  textAnchor="end"
                  className={cn(
                     "font-monospace text-[11px]",
                     on
                        ? "fill-background-900 dark:fill-background-50"
                        : "fill-background-500 dark:fill-background-400"
                  )}
               >
                  {node.flag}
               </text>
            </>
         )}
      </g>
   )
}

// Text keeps at least 4.5:1 against its pill in both themes.
const tones = {
   // The path into the current state, in the current state's colour.
   taken: {
      stroke: "stroke-primary-500 dark:stroke-primary-400",
      port: "fill-primary-500 dark:fill-primary-400",
      label: "fill-primary-800 dark:fill-primary-200",
   },
   "taken-success": {
      stroke: "stroke-green-600 dark:stroke-green-400",
      port: "fill-green-600 dark:fill-green-400",
      label: "fill-green-800 dark:fill-green-200",
   },
   "taken-danger": {
      stroke: "stroke-red-600 dark:stroke-red-400",
      port: "fill-red-600 dark:fill-red-400",
      label: "fill-red-800 dark:fill-red-200",
   },
   available: {
      stroke: "stroke-background-500 dark:stroke-background-400",
      port: "fill-background-500 dark:fill-background-400",
      label: "fill-background-700 dark:fill-background-200",
   },
   unavailable: {
      stroke: "stroke-background-300 dark:stroke-background-500",
      port: "fill-background-300 dark:fill-background-500",
      label: "fill-background-500 dark:fill-background-400",
   },
} satisfies Record<string, Record<string, string>>

type ToneKey = keyof typeof tones

const toneKey = (status: EdgeStatus, target: GraphTone): ToneKey =>
   status === "taken" && target !== "primary" ? `taken-${target}` : status

const Edge: React.FC<{ edge: GraphEdge; status: EdgeStatus; target: GraphTone }> = (props) => {
   const { edge, status } = props
   const [start, end] = [edge.path[0], edge.path[edge.path.length - 1]]
   const d = edge.path.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ")
   const mid: [number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
   const labelW = edge.label.length * 6.6 + 12

   const key = toneKey(status, props.target)
   const tone = tones[key]

   return (
      <g>
         <path
            d={d}
            fill="none"
            strokeWidth={status === "taken" ? 2 : 1.25}
            strokeDasharray={status === "unavailable" ? "4 3" : undefined}
            markerEnd={`url(#overview-graph-arrow-${key})`}
            className={cn("transition-colors", tone.stroke)}
         />
         <circle cx={start[0]} cy={start[1]} r={3} className={cn("transition-colors", tone.port)} />
         <rect
            x={mid[0] - labelW / 2}
            y={mid[1] - 8}
            width={labelW}
            height={16}
            rx={8}
            strokeWidth={1}
            className={cn(
               "transition-colors fill-background-50 dark:fill-background-900",
               tone.stroke
            )}
         />
         <text
            x={mid[0]}
            y={mid[1]}
            dominantBaseline="central"
            textAnchor="middle"
            className={cn("font-monospace text-[11px] transition-colors", tone.label)}
         >
            {edge.label}
         </text>
      </g>
   )
}

const Arrow: React.FC<{ tone: ToneKey; className: string }> = (props) => (
   <marker
      id={`overview-graph-arrow-${props.tone}`}
      viewBox="0 0 10 10"
      refX={9}
      refY={5}
      markerWidth={6}
      markerHeight={6}
      orient="auto-start-reverse"
   >
      <path d="M 1 1 L 9 5 L 1 9" fill="none" strokeWidth={1.75} className={props.className} />
   </marker>
)

export const StateGraph: React.FC<StateGraphProps> = (props) => {
   const { nodes, edges, width, height, nodeStatus, edgeStatus, blocked, label } = props
   const pad = 8
   const toneOf = (name: string) => nodes.find((n) => n.name === name)?.tone ?? "primary"

   return (
      <svg
         viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`}
         className="w-full max-w-[26rem] overview-graph"
         role="img"
         aria-label={label}
      >
         <defs>
            {(Object.keys(tones) as ToneKey[]).map((key) => (
               <Arrow key={key} tone={key} className={tones[key].stroke} />
            ))}
         </defs>
         {edges.map((edge) => (
            <Edge
               key={`${edge.from}-${edge.to}`}
               edge={edge}
               status={edgeStatus(edge)}
               target={toneOf(edge.to)}
            />
         ))}
         {nodes.map((node) => (
            <Node
               key={node.name}
               node={node}
               status={nodeStatus(node.name)}
               blockedKey={blocked?.name === node.name ? blocked.key : undefined}
            />
         ))}
      </svg>
   )
}
