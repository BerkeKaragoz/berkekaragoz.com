import React from "react";

const ReachMe: React.FC<{}> = (props) => {
  const { ...rest } = props;

  return (
    <div
      className="flex flex-col justify-center mx-auto text-center h-80"
      {...rest}
    >
      <h2 className="text-2xl section-heading sm:text-3xl">Get In Touch</h2>
      <a
        href="mailto:mail@berkekaragoz.com"
        className="p-2 text-xl font-semibold rounded-lg sm:text-4xl unstyled-a hover:ring-2"
      >
        mail@berkekaragoz.com
      </a>
    </div>
  );
};

export default ReachMe;
