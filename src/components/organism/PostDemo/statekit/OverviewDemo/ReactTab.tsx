import {
   DemoButton,
   DemoInput,
   DemoRow,
   useRenderCount,
} from "@/components/organism/PostDemo/DemoUI"
import { Code } from "@/components/organism/PostDemo/statekit/Code"
import { cn } from "@shortkit/cn"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

const profileMachine = createMachine({
   data: { name: "Ada", likes: 3, views: 10 },
   events: {
      rename: ({ draft }, name: string) => {
         draft.name = name
      },
      like: ({ draft }) => {
         draft.likes++
      },
      view: ({ draft }) => {
         draft.views++
      },
   },
   selectors: {
      likeRate: ({ data }) =>
         data.views ? Math.round((data.likes / data.views) * 100) : 0,
   },
})

const [useProfile] = createMachineContext(profileMachine)

const code = `
const Likes = () => {
   const m = useProfile()

   // Rerenders when likes changes, and only then
   return <b>{m.data.likes}</b>
}

// Outside React, mounted components still update
setInterval(profileMachine.event.view, 1000)
`

const Box: React.FC<
   React.PropsWithChildren<{ name: string; reads: string; canvas?: boolean }>
> = (props) => {
   const renders = useRenderCount()

   return (
      <div
         className={cn(
            "relative min-w-0 p-2 text-xs",
            props.canvas
               ? "well"
               : "border rounded-md bg-white dark:bg-background-800 border-background-200 dark:border-background-600"
         )}
      >
         {/* Re-keyed on every render so the flash replays, without remounting
             the children. */}
         <span
            key={renders}
            aria-hidden
            className="absolute inset-0 rounded-md pointer-events-none post-demo-flash"
         />
         <div className="flex items-baseline gap-2 font-monospace">
            <span className="text-accent-700 dark:text-accent-300">&lt;{props.name}&gt;</span>
            <span className="ml-auto font-semibold whitespace-nowrap">{renders}&times;</span>
         </div>
         <div className="mt-0.5 break-words opacity-60 font-monospace">
            {/* Wraps after a dot, not mid-name */}
            {props.reads.split(".").map((part, i) => (
               <React.Fragment key={i}>
                  {i > 0 && <>.<wbr /></>}
                  {part}
               </React.Fragment>
            ))}
         </div>
         {props.children}
      </div>
   )
}

const Value: React.FC<React.PropsWithChildren> = (props) => (
   <div className="mt-1 text-lg font-semibold truncate">{props.children}</div>
)

const Name = () => {
   const m = useProfile()
   return (
      <Box name="Name" reads="m.data.name">
         <Value>{m.data.name || " "}</Value>
      </Box>
   )
}

const Likes = () => {
   const m = useProfile()
   return (
      <Box name="Likes" reads="m.data.likes">
         <Value>{m.data.likes}</Value>
      </Box>
   )
}

const Views = () => {
   const m = useProfile()
   return (
      <Box name="Views" reads="m.data.views">
         <Value>{m.data.views}</Value>
      </Box>
   )
}

const LikeRate = () => {
   const m = useProfile()
   return (
      <Box name="LikeRate" reads="m.select.likeRate()">
         <Value>{m.select.likeRate()}%</Value>
      </Box>
   )
}

// Reads nothing, so it renders once and its children render on their own.
const Profile = () => (
   <Box name="Profile" reads="reads nothing" canvas>
      <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-4">
         <Name />
         <Likes />
         <Views />
         <LikeRate />
      </div>
   </Box>
)

const Controls = () => {
   const m = useProfile()
   const [ticking, setTicking] = React.useState(false)

   React.useEffect(() => {
      if (!ticking) return
      const interval = setInterval(profileMachine.event.view, 1000)
      return () => clearInterval(interval)
   }, [ticking])

   return (
      <DemoRow>
         <DemoButton onClick={m.event.like}>like</DemoButton>
         <DemoButton onClick={m.event.view}>view</DemoButton>
         <DemoInput
            aria-label="name"
            className="!min-w-[6rem] max-w-[10rem]"
            value={m.data.name}
            onChange={(e) => m.event.rename(e.target.value)}
         />
         <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none opacity-80">
            <input
               type="checkbox"
               checked={ticking}
               onChange={(e) => setTicking(e.target.checked)}
            />
            view() every second, from setInterval
         </label>
      </DemoRow>
   )
}

const ReactTab = () => (
   <div className="grid gap-3">
      <Controls />
      <Profile />
      <Code>{code}</Code>
   </div>
)

export default ReactTab
