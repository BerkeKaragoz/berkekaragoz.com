import { Popover } from "@headlessui/react"
import clsx from "clsx"
import React from "react"

export const Tooltip: React.FC<{
   text?: string
   capitalize?: boolean
   className?: HTMLElement["className"]
}> = (props) => {
   const { children, className, capitalize = false, text } = props

   const [isOpen, setIsOpen] = React.useState(false)

   return (
      <Popover className="relative">
         {({ close }) => (
            <>
               <div
                  style={{ display: "contents" }}
                  onMouseEnter={() => {
                     setIsOpen(true)
                  }}
                  onMouseLeave={() => {
                     setIsOpen(false)
                     close()
                  }}
               >
                  {children}
               </div>

               {isOpen && (
                  <Popover.Panel
                     static
                     className={clsx([
                        // TODO temply disabled on small screens
                        "hidden sm:block absolute right-1/2 translate-x-1/2 text-center p-1 mt-1 text-sm z-41 text-subtitle-color card",
                        className,
                        { capitalize: capitalize },
                     ])}
                  >
                     {text}
                  </Popover.Panel>
               )}
            </>
         )}
      </Popover>
   )
}

export default Tooltip
