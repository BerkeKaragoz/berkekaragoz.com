import clsx from "clsx"
import React from "react"

type MainProps = React.HtmlHTMLAttributes<HTMLDivElement>

export const Main: React.FC<MainProps> = (props) => {
   const { children, className, ...rest } = props

   return (
      <main
         className={clsx(["block h-full min-h-full flex-grow"], className)}
         {...rest}
      >
         {children}
      </main>
   )
}

export default Main
