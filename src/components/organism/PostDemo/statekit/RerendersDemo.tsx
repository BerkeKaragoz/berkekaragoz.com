import {
   DemoButton,
   DemoInput,
   DemoRow,
   useRenderCount,
} from "@/components/organism/PostDemo/DemoUI"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

const statsMachine = createMachine({
   data: { likes: 0, views: 0, note: "" },
   events: {
      like: ({ draft }) => {
         draft.likes++
      },
      view: ({ draft }) => {
         draft.views++
      },
      write: ({ draft }, note: string) => {
         draft.note = note
      },
   },
   selectors: {
      likeRate: ({ data }) =>
         data.views ? Math.round((data.likes / data.views) * 100) : 0,
   },
})

const [useStatsMachine] = createMachineContext(statsMachine)

// Re-keyed on every render so the flash replays.
const Row: React.FC<{ reads: string; value: React.ReactNode }> = (props) => {
   const renders = useRenderCount()

   return (
      <tr key={renders} className="post-demo-flash">
         <td className="py-1.5 pr-4 text-xs whitespace-nowrap opacity-70">
            {props.reads}
         </td>
         <td
            className="w-full max-w-0 py-1.5 pr-4 truncate"
            title={typeof props.value === "string" ? props.value : undefined}
         >
            {props.value}
         </td>
         <td className="py-1.5 text-base font-semibold text-right whitespace-nowrap">
            {renders}&times;
         </td>
      </tr>
   )
}

const Likes = () => {
   const m = useStatsMachine()
   return <Row reads="m.data.likes" value={m.data.likes} />
}

const Views = () => {
   const m = useStatsMachine()
   return <Row reads="m.data.views" value={m.data.views} />
}

const LikeRate = () => {
   const m = useStatsMachine()
   return <Row reads="m.select.likeRate()" value={`${m.select.likeRate()}%`} />
}

const Everything = () => {
   const m = useStatsMachine()
   const { ...data } = m.data
   return <Row reads="const { ...data } = m.data" value={JSON.stringify(data)} />
}

const Controls = () => {
   const m = useStatsMachine()

   return (
      <DemoRow>
         <DemoButton onClick={m.event.like}>like</DemoButton>
         <DemoButton onClick={m.event.view}>view</DemoButton>
         <DemoInput
            placeholder="write a note"
            value={m.data.note}
            onChange={(e) => m.event.write(e.target.value)}
         />
      </DemoRow>
   )
}

const RerendersDemo = () => (
   <div className="grid gap-4">
      <Controls />
      <table className="w-full text-sm font-monospace">
         <thead>
            <tr className="text-xs text-left opacity-60">
               <th className="pb-1 pr-4 font-normal">Reads</th>
               <th className="pb-1 pr-4 font-normal">Value</th>
               <th className="pb-1 font-normal text-right">Renders</th>
            </tr>
         </thead>
         <tbody className="border-t border-background-400/30 dark:border-background-600/40">
            <Likes />
            <Views />
            <LikeRate />
            <Everything />
         </tbody>
      </table>
   </div>
)

export default RerendersDemo
