import { DemoButton, DemoInput, DemoRow, useRenderCount } from "@/components/organism/PostDemo/DemoUI"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

// A post's stats on one machine, read by four components. Each row counts its
// component's renders and flashes when it rerenders.

const statsMachine = createMachine({
   // Few views, so one more still moves the like rate's first decimal.
   data: { likes: 6, views: 48, note: "Share on Friday" },
   events: {
      like: ({ draft }) => {
         draft.likes++
      },
      view: ({ draft }) => {
         draft.views++
      },
      setNote: ({ draft }, note: string) => {
         draft.note = note
      },
   },
   selectors: {
      likeRate: ({ data }) => {
         if (!data.views) return 0
         const rate = data.likes / data.views
         return Math.round(rate * 1000) / 10
      },
   },
})

const [useStatsMachine] = createMachineContext(statsMachine)

const C: React.FC<React.PropsWithChildren> = (props) => (
   <code className="font-monospace text-[0.9em]">{props.children}</code>
)

// One row per component: what it reads, what it renders, and its render count.
// The row is re-keyed on every render, so the flash replays.
const Row: React.FC<{ reads: string; value: React.ReactNode }> = (props) => {
   const renders = useRenderCount()

   return (
      <tr key={renders} className="post-demo-flash">
         <td className="hidden py-1.5 pl-2 pr-4 text-xs whitespace-nowrap sm:table-cell opacity-70">
            {props.reads}
         </td>
         <td
            className="w-full max-w-0 py-1.5 pl-2 sm:pl-0 pr-4 font-sans truncate"
            title={typeof props.value === "string" ? props.value : undefined}
         >
            {props.value}
            {/* On a phone, what it reads goes under the value, not beside it */}
            <div className="text-xs truncate sm:hidden opacity-70 font-monospace">
               {props.reads}
            </div>
         </td>
         <td className="py-1.5 pr-2 text-base font-semibold text-right whitespace-nowrap tabular-nums">
            {renders}&times;
         </td>
      </tr>
   )
}

const Likes = () => {
   const m = useStatsMachine()
   return <Row reads="m.data.likes" value={`${m.data.likes} likes`} />
}

const Views = () => {
   const m = useStatsMachine()
   return <Row reads="m.data.views" value={`${m.data.views} views`} />
}

const LikeRate = () => {
   const m = useStatsMachine()
   return <Row reads="m.select.likeRate()" value={`${m.select.likeRate()}% like rate`} />
}

const Summary = () => {
   const m = useStatsMachine()
   const { ...data } = m.data
   return (
      <Row
         reads="const { ...data } = m.data"
         value={`${data.likes} likes, ${data.views} views. ${data.note}.`}
      />
   )
}

// Memoized, so the sentence changing doesn't rerender the components.
const Table = React.memo(() => (
   <table className="w-full text-sm font-monospace">
      <thead>
         <tr className="text-xs text-left opacity-60">
            <th className="hidden pb-1 pl-2 pr-4 font-normal sm:table-cell">Reads</th>
            <th className="pb-1 pl-2 pr-4 font-normal sm:pl-0">Value</th>
            <th className="pb-1 pr-2 font-normal text-right">Renders</th>
         </tr>
      </thead>
      <tbody className="border-t border-background-400/30 dark:border-background-600/40">
         <Likes />
         <Views />
         <LikeRate />
         <Summary />
      </tbody>
   </table>
))

type Action = "like" | "view" | "note"

// What just happened, and which components rerendered for it.
const says: Record<Action | "mount", React.ReactNode> = {
   mount: <>Each component has rendered once, on mount.</>,
   like: (
      <>
         <C>like()</C> changed <C>likes</C>. <C>Likes</C>, <C>LikeRate</C> through its selector
         and <C>Summary</C> through its spread read it, so they rerendered. <C>Views</C> didn&apos;t.
      </>
   ),
   view: (
      <>
         <C>view()</C> changed <C>views</C>. <C>Views</C>, <C>LikeRate</C> through its selector
         and <C>Summary</C> through its spread read it, so they rerendered. <C>Likes</C> didn&apos;t.
      </>
   ),
   note: (
      <>
         <C>setNote()</C> changed <C>note</C> on every key. Only <C>Summary</C> rerendered: its
         spread reads every field, and no other component reads <C>note</C>.
      </>
   ),
}

const RerendersDemo = () => {
   const m = useStatsMachine()
   const [last, setLast] = React.useState<Action | "mount">("mount")

   return (
      <div className="grid gap-4">
         <DemoRow controls>
            <DemoButton
               onClick={() => {
                  m.event.like()
                  setLast("like")
               }}
            >
               Like the post
            </DemoButton>
            <DemoButton
               onClick={() => {
                  m.event.view()
                  setLast("view")
               }}
            >
               Add a view
            </DemoButton>
            <DemoInput
               aria-label="Note"
               placeholder="Write a note"
               value={m.data.note}
               onChange={(e) => {
                  m.event.setNote(e.target.value)
                  setLast("note")
               }}
            />
         </DemoRow>
         <p aria-live="polite" className="text-sm min-h-[4rem] sm:min-h-[2.75rem]">
            {says[last]}
         </p>
         <Table />
      </div>
   )
}

export default RerendersDemo
