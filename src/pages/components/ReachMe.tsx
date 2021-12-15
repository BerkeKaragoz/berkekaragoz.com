import { PAGES_TNS } from "@/lib/i18n/consts";
import { ComponentPropsWithTranslation } from "@/lib/types/i18n";
import React from "react";
import { Trans, withTranslation } from "react-i18next";

const ReachMe: React.FC<ComponentPropsWithTranslation<{}>> = (props) => {
  const { t, ...rest } = props;

  return (
    <div
      className="flex flex-col justify-center mx-auto text-center h-80"
      {...rest}
    >
      <h2 className="text-2xl section-heading sm:text-3xl">
        <Trans t={t} i18nKey="index.reachMe.title">
          Get In Touch
        </Trans>
      </h2>
      <a
        href="mailto:mail@berkekaragoz.com"
        className="p-2 text-xl font-semibold rounded-lg sm:text-4xl unstyled-a hover:ring-2"
      >
        mail@berkekaragoz.com
      </a>
    </div>
  );
};

export default withTranslation(PAGES_TNS)(ReachMe);
