import React from "react";

type MainProps = {};

export const Main: React.FC<MainProps> = (props) => {
  const { children } = props;

  return (
    <div className="box-border flex-grow px-2">
      <main className="block h-full max-w-screen-xl min-h-full mx-auto">
        {children}
      </main>
    </div>
  );
};

export default Main;
