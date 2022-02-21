import clsx from "clsx";
import React from "react";

type SectionProps = React.HtmlHTMLAttributes<HTMLDivElement> & {
  block?: boolean;
  prose?: boolean;
  as?: React.ElementType;
};

export const Section: React.FC<SectionProps> = (props) => {
  const {
    block,
    prose,
    as: Component = "section",
    children,
    className,
    ...rest
  } = props;

  return (
    <div className="px-8">
      <Component
        className={clsx(
          [
            "mx-auto",
            { flex: !block },
            { block: block },
            { "max-w-screen-xl": !prose },
            { "max-w-prose": prose },
          ],
          className,
        )}
        {...rest}
      >
        {children}
      </Component>
    </div>
  );
};

export default Section;
