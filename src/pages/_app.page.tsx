import { appWithTranslation } from "next-i18next"
import { ThemeProvider } from "next-themes"
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

const MyApp = ({ Component, pageProps }: AppProps) => {
   React.useEffect(
      () => void (appMachine.data.isMounted ? 0 : appMachine.event.mounted()),
      []
   )

   return (
      <ThemeProvider attribute="class" enableSystem={false} defaultTheme="dark">
         <StatekitProvider>
            <Component {...pageProps} />
         </StatekitProvider>
      </ThemeProvider>
   )
}
export default appWithTranslation(MyApp)
