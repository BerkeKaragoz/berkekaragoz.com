import {
   DemoButton,
   DemoRow,
   DemoStates,
} from "@/components/organism/PostDemo/DemoUI"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

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

const StateFlagsDemo = () => {
   const m = usePlayerMachine()
   const [blocked, setBlocked] = React.useState<string>()

   // A blocked transition throws.
   const run = (event: () => void) => () => {
      try {
         event()
         setBlocked(undefined)
      } catch (error) {
         setBlocked((error as Error).message.split("\n")[0].trim())
      }
   }

   return (
      <div className="grid grid-cols-1 gap-4">
         <DemoRow>
            <DemoButton onClick={run(m.event.play)}>play</DemoButton>
            <DemoButton onClick={run(m.event.bufferStart)}>bufferStart</DemoButton>
            <DemoButton onClick={run(m.event.bufferEnd)}>bufferEnd</DemoButton>
            <DemoButton onClick={run(m.event.stop)}>stop</DemoButton>
         </DemoRow>
         <div className="grid grid-cols-1 gap-2">
            <DemoStates state={m.state} STATE={m.STATE} showBits />
            <p className="font-monospace text-sm">
               m.state = {m.state} = 0b{m.state.toString(2).padStart(3, "0")}
            </p>
            <p className="min-h-[1.25rem] font-monospace text-xs text-red-600 dark:text-red-400">
               {blocked}
            </p>
         </div>
      </div>
   )
}

export default StateFlagsDemo
