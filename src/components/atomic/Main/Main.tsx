import clsx from "clsx";
import React from "react";

type MainProps = React.HtmlHTMLAttributes<HTMLDivElement> & {};

export const Main: React.FC<MainProps> = (props) => {
  const { children, className, ...rest } = props;

  return (
    <div
      className={clsx(["box-border flex-grow overflow-x-hidden"], className)}
      {...rest}
    >
      <main className="block h-full min-h-full">{children}</main>
    </div>
  );
};

export default Main;
