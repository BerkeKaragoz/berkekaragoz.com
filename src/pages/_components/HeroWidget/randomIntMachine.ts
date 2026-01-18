import { appMachine } from "@/pages/_app.page"
import { createMachine, createMachineContext } from "@statekit/react"

export const generateRandomInt = (max = 99) => Math.floor(Math.random() * max)

const randomIntMachine = createMachine({
   data: { number: 99 },
   initializer: (init) => {
      appMachine.subscribeEvents(([eventName]) => {
         if (eventName !== "mounted") return
         randomIntMachine.event.generate()
      })

      return init
   },
   events: {
      generate: ({ draft }, max = 99) => {
         draft.number = generateRandomInt(max)
      },
   },
})

export const [RandomIntMachineProvider, useRandomIntMachine] =
   createMachineContext(randomIntMachine)
