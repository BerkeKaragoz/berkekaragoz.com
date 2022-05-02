import React from "react"
import Link, { LinkProps } from "next/link"

type LinkBoxOnClick = React.MouseEventHandler<HTMLAnchorElement> | undefined

const LinkBoxAnchor = React.forwardRef<
   HTMLAnchorElement,
   {
      onClick?: LinkBoxOnClick
      href?: string
      as?: React.ElementType
   } & React.HTMLAttributes<HTMLButtonElement>
>((props, ref) => {
   const { onClick, as: Component = "button", href, children, ...rest } = props

   return (
      <a
         hidden // to prevent global styling
         href={href}
         onClick={onClick}
         ref={ref}
         style={{ display: "contents" }}
      >
         <Component {...rest}>{children}</Component>
      </a>
   )
})

LinkBoxAnchor.displayName = "LinkBoxAnchor"

const LinkBox: React.FC<
   LinkProps &
      React.HTMLAttributes<HTMLButtonElement> & {
         onClick?: LinkBoxOnClick
         component?: React.ElementType
      }
> = (props) => {
   const {
      href,
      as,
      component,
      replace,
      scroll,
      passHref, // unused, always true
      shallow,
      prefetch,
      locale,
      // ^^ LinkProps
      children,
      ...rest
   } = props

   return (
      <Link
         href={href}
         as={as}
         replace={replace}
         scroll={scroll}
         shallow={shallow}
         prefetch={prefetch}
         locale={locale}
         passHref
      >
         <LinkBoxAnchor as={component} {...rest}>
            {children}
         </LinkBoxAnchor>
      </Link>
   )
}

export default LinkBox
