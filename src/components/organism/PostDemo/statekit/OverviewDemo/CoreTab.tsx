import { DemoButton, DemoRow } from "@/components/organism/PostDemo/DemoUI"
import {
   counterMachine,
   useLog,
} from "@/components/organism/PostDemo/statekit/OverviewDemo/counter"
import { cn } from "@shortkit/cn"
import React from "react"

type Line = {
   input: string
   run: () => unknown
   note?: string
}

// What `const before = …` declared, if that line has run.
const scope: { before?: { count: number } } = {}

const lines: Line[] = [
   {
      input: "counterMachine.event.increment(2)",
      run: () => counterMachine.event.increment(2),
   },
   {
      input: "const before = counterMachine.data",
      run: () => {
         scope.before = counterMachine.data
      },
   },
   {
      input: "counterMachine.event.increment()",
      run: () => counterMachine.event.increment(),
   },
   {
      input: "counterMachine.data.count",
      run: () => counterMachine.data.count,
   },
   {
      input: "before.count",
      run: () => {
         if (!scope.before) throw new ReferenceError("before is not defined")
         return scope.before.count
      },
      note: "snapshots don't change",
   },
   {
      input: "counterMachine.data.count = 100",
      run: () => {
         ;(counterMachine.data as { count: number }).count = 100
      },
      note: "or get written to",
   },
   {
      input: "counterMachine.select.isPositive()",
      run: () => counterMachine.select.isPositive(),
   },
]

type Output = { text: string; kind: "value" | "undefined" | "error" }

const format = (value: unknown): Output => {
   if (value === undefined) return { text: "undefined", kind: "undefined" }
   if (typeof value === "object" && value !== null)
      return { text: JSON.stringify(value), kind: "value" }
   return { text: String(value), kind: "value" }
}

const run = (line: Line): Output => {
   try {
      return format(line.run())
   } catch (error) {
      const e = error as Error
      return { text: `${e.name}: ${e.message}`, kind: "error" }
   }
}

const Log = () => {
   const log = useLog()

   return (
      <div className="flex flex-col min-w-0 gap-1 p-3 text-xs well font-monospace">
         <div className="mb-1 opacity-60">
            counterMachine.<wbr />
            subscribeEvents(log)
         </div>
         {log.data.lines.length === 0 && (
            <div className="opacity-40">No events yet.</div>
         )}
         {log.data.lines.map((line) => (
            <div key={line.id} className="truncate post-demo-flash">
               {line.text}
            </div>
         ))}
      </div>
   )
}

const CoreTab = () => {
   const [outputs, setOutputs] = React.useState<Output[]>([])
   const done = outputs.length === lines.length

   const next = () => {
      if (done) {
         scope.before = undefined
         setOutputs([])
         return
      }
      setOutputs([...outputs, run(lines[outputs.length])])
   }

   // The button leads, so the lines growing below never move it.
   return (
      <div className="grid gap-3">
         <DemoRow>
            <DemoButton onClick={next}>{done ? "Start over" : "Run next line"}</DemoButton>
            <span className="text-xs opacity-70">The Basics tab updates too.</span>
         </DemoRow>
         <div className="grid gap-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <ol className="flex flex-col min-w-0 gap-1.5 p-3 text-xs well font-monospace">
               <li className="opacity-60">
                  import {"{"} counterMachine {"}"} from &quot;./counter&quot;
               </li>
               {lines.map((line, i) => {
                  const output = outputs[i]
                  const isNext = i === outputs.length

                  return (
                     <li
                        key={line.input}
                        className={cn(
                           "transition-opacity",
                           !output && !isNext && "opacity-30"
                        )}
                     >
                        <div className="flex gap-2">
                           <span
                              className={cn(
                                 isNext
                                    ? "text-primary-600 dark:text-primary-400"
                                    : "text-background-600 dark:text-background-400"
                              )}
                           >
                              {isNext ? "▸" : "›"}
                           </span>
                           <span className="break-all">{line.input}</span>
                        </div>
                        {output && (
                           <div className="flex flex-wrap pl-4 gap-x-3 post-demo-flash">
                              <span
                                 className={cn(
                                    output.kind === "undefined" && "text-background-600 dark:text-background-400",
                                    output.kind === "value" &&
                                       "text-secondary-800 dark:text-secondary-300",
                                    output.kind === "error" &&
                                       "text-red-700 dark:text-red-400"
                                 )}
                              >
                                 {output.text}
                              </span>
                              {line.note && (
                                 <span className="text-background-600 dark:text-background-400">{`// ${line.note}`}</span>
                              )}
                           </div>
                        )}
                     </li>
                  )
               })}
            </ol>
            <Log />
         </div>
      </div>
   )
}

export default CoreTab
