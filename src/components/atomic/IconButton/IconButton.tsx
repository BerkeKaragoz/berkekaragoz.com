import clsx from "clsx";
import React from "react";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

//TODO disabled styling
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    const { children, className, ...rest } = props;

    return (
      <button
        ref={ref}
        className={clsx(["w-8 h-8 card-input group", className])}
        {...rest}
      >
        <span className="h-full max-w-full contents text-primary-500 dark:text-primary-200 group-hover:text-primary-600 dark:group-hover:text-primary-100">
          {children}
        </span>
      </button>
    );
  },
);

IconButton.displayName = "App-IconButton";

export default IconButton;
