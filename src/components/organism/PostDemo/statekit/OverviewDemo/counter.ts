import { createMachine, createMachineContext } from "@statekit/react"

// Shared by the Basics and No React tabs: one object, called from both.
export const counterMachine = createMachine({
   data: { count: 0 },
   events: {
      increment: ({ draft }, by = 1) => {
         draft.count += by
      },
   },
   selectors: {
      isPositive: ({ data }) => data.count > 0,
   },
})

export const [useCounter] = createMachineContext(counterMachine)

export const counterCode = `
const counterMachine = createMachine({
   data: { count: 0 },
   events: {
      increment: ({ draft }, by = 1) => {
         draft.count += by
      },
   },
   selectors: {
      isPositive: ({ data }) => data.count > 0,
   },
})
`

type LogLine = { id: number; text: string }

// The No React tab's event log. Subscribed when the demo loads, so clicks on
// the Basics tab show up in it too.
export const logMachine = createMachine({
   data: { lines: [] as LogLine[], next: 0 },
   events: {
      push: ({ draft }, text: string) => {
         draft.lines.push({ id: draft.next++, text })
         if (draft.lines.length > 6) draft.lines.shift()
      },
   },
})

export const [useLog] = createMachineContext(logMachine)

counterMachine.subscribeEvents(([name, args]) => {
   logMachine.event.push(`${String(name)}(${(args as unknown[]).join(", ")})`)
})
