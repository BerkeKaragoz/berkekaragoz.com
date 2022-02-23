module.exports = {
  i18n: {
    defaultLocale: process.env["DEFAULT_LOCALE"] || "en-UK",
    locales: ["en-UK", "tr-TR"],
  },
  defaultNS: "common",
  react: { useSuspense: false }, //TEMP
  reloadOnPrerender: process.env.NODE_ENV !== "production", // DEVELOPMENT-ONLY, IMPORTANT!
};
