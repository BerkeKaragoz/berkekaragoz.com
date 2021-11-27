import clsx from "clsx";
import React from "react";

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  small?: boolean;
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    const { children, className, small, ...rest } = props;

    return (
      <button
        {...rest}
        className={clsx([
          " card-input group flex-shrink-0",
          { "w-8 h-8 p-1": !small },
          { "w-5 h-5 p-0.5 border-opacity-50": small },
          className,
        ])}
        ref={ref}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "App-IconButton";

export default IconButton;
