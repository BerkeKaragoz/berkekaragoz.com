import BasicsTab from "@/components/organism/PostDemo/statekit/OverviewDemo/BasicsTab"
import CoreTab from "@/components/organism/PostDemo/statekit/OverviewDemo/CoreTab"
import MachineTab from "@/components/organism/PostDemo/statekit/OverviewDemo/MachineTab"
import ReactTab from "@/components/organism/PostDemo/statekit/OverviewDemo/ReactTab"
import { cn } from "@shortkit/cn"
import React from "react"

const tabs = [
   { id: "basics", label: "Basics", lead: "A machine, a hook and a component.", Panel: React.memo(BasicsTab) },
   { id: "core", label: "No React", lead: "The same counter, called as plain functions.", Panel: React.memo(CoreTab) },
   { id: "react", label: "React", lead: "Each component rerenders on what it reads.", Panel: React.memo(ReactTab) },
   {
      id: "machine",
      label: "State machine",
      lead: "States, transition rules and async events.",
      Panel: React.memo(MachineTab),
   },
]

// Every panel stays mounted, so a machine mid-brew keeps brewing on another tab.
const OverviewDemo = () => {
   const [selected, setSelected] = React.useState(0)
   const buttons = React.useRef<(HTMLButtonElement | null)[]>([])

   const select = (index: number) => {
      const next = (index + tabs.length) % tabs.length
      setSelected(next)
      buttons.current[next]?.focus()
   }

   const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") select(selected + 1)
      else if (e.key === "ArrowLeft") select(selected - 1)
      else return
      e.preventDefault()
   }

   return (
      <div className="grid gap-3">
         <div
            role="tablist"
            aria-label="statekit demo"
            onKeyDown={onKeyDown}
            className="flex flex-wrap gap-0.5 sm:gap-1 p-1 rounded-lg well w-fit"
         >
            {tabs.map((tab, i) => (
               <button
                  key={tab.id}
                  ref={(el) => {
                     buttons.current[i] = el
                  }}
                  id={`overview-tab-${tab.id}`}
                  role="tab"
                  aria-selected={i === selected}
                  aria-controls={`overview-panel-${tab.id}`}
                  tabIndex={i === selected ? 0 : -1}
                  onClick={() => setSelected(i)}
                  className={cn(
                     "px-2.5 sm:px-3 py-1 text-[13px] sm:text-sm rounded-md transition-colors",
                     i === selected
                        ? "bg-background-50 dark:bg-background-700 text-primary-700 dark:text-primary-200 shadow"
                        : "text-background-600 dark:text-background-400 hover:text-background-900 dark:hover:text-background-100"
                  )}
               >
                  {tab.label}
               </button>
            ))}
         </div>
         {tabs.map(({ id, lead, Panel }, i) => (
            <div
               key={id}
               id={`overview-panel-${id}`}
               role="tabpanel"
               aria-labelledby={`overview-tab-${id}`}
               hidden={i !== selected}
               className={cn("gap-3", i === selected ? "grid" : "hidden")}
            >
               <p className="text-sm opacity-80">{lead}</p>
               <Panel />
            </div>
         ))}
      </div>
   )
}

export default OverviewDemo
