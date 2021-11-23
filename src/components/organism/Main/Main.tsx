import React from "react";

type MainProps = {};

export const Main: React.FC<MainProps> = (props) => {
  const { children } = props;

  return (
    <div className="px-2">
      <main className="max-w-screen-xl mx-auto mt-2">{children}</main>
    </div>
  );
};

export default Main;
