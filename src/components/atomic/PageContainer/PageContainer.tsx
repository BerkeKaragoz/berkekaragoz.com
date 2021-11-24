import React from "react";

type PageContainerProps = {};

export const PageContainer: React.FC<PageContainerProps> = (props) => {
  const { children } = props;

  return (
    <div className="flex flex-col h-screen min-h-screen p-0 m-0">
      {children}
    </div>
  );
};

export default PageContainer;
