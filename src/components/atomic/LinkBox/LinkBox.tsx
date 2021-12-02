import React from "react";
import Link, { LinkProps } from "next/link";

type LinkBoxOnClick = React.MouseEventHandler<HTMLAnchorElement> | undefined;

const LinkBoxAnchor = React.forwardRef<
  HTMLAnchorElement,
  {
    onClick?: LinkBoxOnClick;
    href?: string;
  } & React.HTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  const { onClick, href, children, ...rest } = props;

  return (
    <a
      hidden // to prevent global styling
      href={href}
      onClick={onClick}
      ref={ref}
      style={{ display: "contents" }}
    >
      <button {...rest}>{children}</button>
    </a>
  );
});

LinkBoxAnchor.displayName = "LinkBoxAnchor";

const LinkBox: React.FC<
  LinkProps &
    React.HTMLAttributes<HTMLButtonElement> & {
      onClick?: LinkBoxOnClick;
    }
> = (props) => {
  const {
    href,
    as,
    replace,
    scroll,
    passHref, //unused, always true
    shallow,
    prefetch,
    locale,
    //^^ LinkProps
    children,
    ...rest
  } = props;

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
      <LinkBoxAnchor {...rest}>{children}</LinkBoxAnchor>
    </Link>
  );
};

export default LinkBox;
