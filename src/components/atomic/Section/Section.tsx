import clsx from "clsx"
import React from "react"

type SectionProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
   block?: boolean
   prose?: boolean
   as?: React.ElementType
}

export const Section: React.FC<SectionProps> = (props) => {
   const { block, prose, as = "section", children, className, ...rest } = props

   return (
      <div className="px-4 sm:px-8">
         {React.createElement(
            as,
            {
               className: clsx(
                  [
                     "mx-auto",
                     { flex: !block },
                     { block: block },
                     { "max-w-screen-xl": !prose },
                     { "max-w-prose": prose },
                  ],
                  className
               ),
               ...rest,
            },
            children
         )}
      </div>
   )
}

export default Section
