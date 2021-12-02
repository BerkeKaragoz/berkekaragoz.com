import clsx from "clsx";
import React from "react";

type SectionProps = React.HtmlHTMLAttributes<HTMLDivElement> & {};

export const Section: React.FC<SectionProps> = (props) => {
  const { children, className, ...rest } = props;

  return (
    <div className="px-8">
      <section
        className={clsx(["flex max-w-screen-xl mx-auto"], className)}
        {...rest}
      >
        {children}
      </section>
    </div>
  );
};

export default Section;
