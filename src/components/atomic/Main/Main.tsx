import Header from "@/components/organism/Header/Header";
import clsx from "clsx";
import React from "react";

type MainProps = React.HtmlHTMLAttributes<HTMLDivElement> & {};

export const Main: React.FC<MainProps> = (props) => {
  const { children, className, ...rest } = props;

  return (
    <main className={clsx(["block h-full min-h-full"], className)} {...rest}>
      {children}
    </main>
  );
};

export default Main;
