import { appWithTranslation } from "next-i18next"
import { ThemeProvider } from "next-themes"
import type { NextPage } from "next"
import type { AppProps } from "next/app"
import "@/styles/globals.css"
import { createMachine, StatekitProvider } from "@statekit/react"
import React from "react"
import Consent from "@/components/organism/Consent/Consent"
import type { ConsentPageConfig } from "@/features/consent/config"

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
// doubled in development. Pages set `consent` to choose when and where the
// cookie banner asks (see src/features/consent/config.ts).
export type AppPage<P = Record<string, never>> = NextPage<P> & {
   strictMode?: boolean
   consent?: ConsentPageConfig
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
               <Consent page={(Component as AppPage).consent} />
            </StatekitProvider>
         </ThemeProvider>
      </Strict>
   )
}
export default appWithTranslation(MyApp)
