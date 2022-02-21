import Link, { LinkProps } from "next/link";
import React from "react";

// This component was created for this issue:
// https://github.com/i18next/react-i18next/issues/1090

const LinkText: React.FC<
  React.PropsWithChildren<LinkProps> & {
    className?: HTMLAnchorElement["className"];
  }
> = (props) => {
  const { children, className, href, ...rest } = props;

  return (
    <Link {...rest} href={href || ""}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default LinkText;
