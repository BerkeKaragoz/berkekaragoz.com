import { DemoLoader, demos, DemoName } from "@/components/organism/PostDemo/demos"
import dynamic from "next/dynamic"
import React from "react"

type PostDemoProps = {
   name: DemoName
   lead?: string
   caption?: string
   minHeight?: number
}

const loadedDemos = new Map<string, React.ComponentType>()

const getDemo = (name: string) => {
   const load = (demos as Record<string, DemoLoader | undefined>)[name]
   if (!load) throw new Error(`Unknown post demo "${name}"`)

   if (!loadedDemos.has(name)) {
      loadedDemos.set(
         name,
         // Memoized, so a rerender of the post layout never reaches the demo.
         React.memo(
            dynamic(load, { ssr: false, loading: () => <DemoPlaceholder /> })
         )
      )
   }

   return loadedDemos.get(name)!
}

const DemoPlaceholder = () => (
   <p className="text-sm opacity-60">Loading demo&hellip;</p>
)

class DemoErrorBoundary extends React.Component<
   React.PropsWithChildren,
   { error?: Error }
> {
   state: { error?: Error } = {}

   static getDerivedStateFromError(error: Error) {
      return { error }
   }

   render() {
      if (this.state.error) {
         return (
            <p className="text-sm opacity-60">
               This demo crashed: {this.state.error.message}
            </p>
         )
      }

      return this.props.children
   }
}

// Production builds never double-render, so the strict mode toggle is dev only.
const isDev = process.env.NODE_ENV === "development"

const StrictModeToggle: React.FC<{
   on: boolean
   onChange: (on: boolean) => void
}> = (props) => (
   <label className="flex items-center gap-1.5 ml-auto text-xs opacity-60 cursor-pointer select-none">
      <input
         type="checkbox"
         checked={props.on}
         onChange={(e) => props.onChange(e.target.checked)}
      />
      strict mode
   </label>
)

export const PostDemo: React.FC<PostDemoProps> = (props) => {
   const { name, lead, caption, minHeight = 120 } = props
   const Demo = getDemo(name)
   const [strict, setStrict] = React.useState(false)
   const Strict = strict ? React.StrictMode : React.Fragment

   return (
      <figure className="mb-8">
         <div className="p-4 card" style={{ minHeight }}>
            {(lead || isDev) && (
               <div className="flex flex-wrap items-center mb-3 gap-x-4 gap-y-1">
                  {lead && <div className="text-sm opacity-80">{lead}</div>}
                  {isDev && <StrictModeToggle on={strict} onChange={setStrict} />}
               </div>
            )}
            <DemoErrorBoundary>
               <Strict>
                  <Demo />
               </Strict>
            </DemoErrorBoundary>
         </div>
         {caption && (
            <figcaption className="mt-2 text-sm text-center opacity-70">
               {caption}
            </figcaption>
         )}
      </figure>
   )
}

export default PostDemo
