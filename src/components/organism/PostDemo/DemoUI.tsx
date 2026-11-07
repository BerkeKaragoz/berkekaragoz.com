import { cn } from "@shortkit/cn"
import React from "react"

// The header's card-input, one step lighter than the demo's card, as it is
// against the header. Disabled ones go flat and dashed, but stay readable.
export const DemoButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
   className,
   ...props
}) => (
   <button
      className={cn(
         "px-3 py-1.5 text-sm card-input",
         "enabled:!bg-background-50 dark:enabled:!bg-background-700",
         "enabled:text-primary-700 enabled:hover:text-primary-800",
         "disabled:border-dashed disabled:shadow-none disabled:!text-background-500 disabled:!text-opacity-100 dark:disabled:border-background-600",
         className
      )}
      {...props}
   />
)

export const DemoInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
   className,
   ...props
}) => (
   <input
      className={cn(
         "flex-1 min-w-[10rem] px-3 py-1.5 text-sm rounded-lg bg-background-200/60 dark:bg-background-700/50 placeholder:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary-500",
         className
      )}
      {...props}
   />
)

// Controls the demo's frame adds, like the strict mode toggle. A row marked
// `controls` ends with them, so they sit beside the demo's own buttons.
export const DemoControls = React.createContext<React.ReactNode>(null)

export const DemoRow: React.FC<
   React.PropsWithChildren<{ className?: string; controls?: boolean }>
> = ({ className, controls, children }) => {
   const frameControls = React.useContext(DemoControls)

   return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
         {children}
         {controls && frameControls}
      </div>
   )
}

type DemoStatesProps = {
   state: number
   STATE: Record<string, number>
   names?: string[]
   showBits?: boolean
}

export const DemoStates: React.FC<DemoStatesProps> = (props) => {
   const { state, STATE, names = Object.keys(STATE), showBits = false } = props
   const width = Object.keys(STATE).length

   return (
      <DemoRow>
         {names.map((name) => {
            const active = (state & STATE[name]) !== 0

            return (
               <span
                  key={name}
                  className={cn(
                     "px-2 py-0.5 text-xs font-monospace rounded-full border transition-colors",
                     active
                        ? "border-primary-500 bg-primary-500/20 text-primary-700 dark:text-primary-200"
                        : "border-background-300 dark:border-background-600 opacity-50"
                  )}
               >
                  {name}
                  {showBits && (
                     <span className="ml-1 opacity-60">
                        {STATE[name].toString(2).padStart(width, "0")}
                     </span>
                  )}
               </span>
            )
         })}
      </DemoRow>
   )
}

export const useRenderCount = () => {
   const renders = React.useRef(0)
   renders.current++
   return renders.current
}
