import clsx from "clsx"
import React from "react"

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
   small?: boolean
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
   (props, ref) => {
      const { children, className, small, ...rest } = props

      return (
         <button
            {...rest}
            className={clsx([
               "app-button group",
               { "app-button-not-small": !small },
               { "app-button-small": small },
               className,
            ])}
            ref={ref}
         >
            {children}
         </button>
      )
   }
)

IconButton.displayName = "App-IconButton"

export default IconButton
