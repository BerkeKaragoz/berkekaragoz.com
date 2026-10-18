import { appWithTranslation } from "next-i18next"
import { ThemeProvider } from "next-themes"
import type { NextPage } from "next"
import type { AppProps } from "next/app"
import "@/styles/globals.css"
import { createMachine, StatekitProvider } from "@statekit/react"
import React from "react"

export const appMachine = createMachine({
   data: {
      isMounted: false,
   },
   events: {
      mounted: ({ draft }) => {
         draft.isMounted = true
      },
   },
})

// Post pages set `strictMode = false` so their demos' render counts aren't
// doubled in development.
export type AppPage<P = Record<string, never>> = NextPage<P> & {
   strictMode?: boolean
}

const MyApp = ({ Component, pageProps }: AppProps) => {
   const Strict =
      (Component as AppPage).strictMode === false ? React.Fragment : React.StrictMode

   React.useEffect(
      () => void (appMachine.data.isMounted ? 0 : appMachine.event.mounted()),
      []
   )

   return (
      <Strict>
         <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
            <StatekitProvider>
               <Component {...pageProps} />
            </StatekitProvider>
         </ThemeProvider>
      </Strict>
   )
}
export default appWithTranslation(MyApp)
