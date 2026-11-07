import { DemoButton, DemoRow } from "@/components/organism/PostDemo/DemoUI"
import { Code } from "@/components/organism/PostDemo/statekit/Code"
import {
   counterCode,
   useCounter,
} from "@/components/organism/PostDemo/statekit/OverviewDemo/counter"
import React from "react"

const code = `${counterCode}
const [useCounter] = createMachineContext(counterMachine)

const Counter = () => {
   const m = useCounter()
   return <button onClick={() => m.event.increment()}>{m.data.count}</button>
}
`

const BasicsTab = () => {
   const m = useCounter()

   return (
      <div className="grid gap-3">
         <DemoRow className="gap-3">
            <span className="min-w-[2ch] mr-2 text-4xl font-semibold tabular-nums">
               {m.data.count}
            </span>
            <DemoButton onClick={() => m.event.increment(-1)}>&minus;1</DemoButton>
            <DemoButton onClick={() => m.event.increment()}>+1</DemoButton>
            <DemoButton onClick={() => m.event.increment(5)}>+5</DemoButton>
            <span className="ml-auto text-xs font-monospace text-background-600 dark:text-background-300">
               m.select.isPositive(){" "}
               <span className="text-primary-700 dark:text-primary-300">
                  {String(m.select.isPositive())}
               </span>
            </span>
         </DemoRow>
         <Code>{code}</Code>
      </div>
   )
}

export default BasicsTab
