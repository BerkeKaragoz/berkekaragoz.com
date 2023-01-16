/* eslint-disable @typescript-eslint/no-var-requires */
// const defaultTheme = require("tailwindcss/defaultTheme");
const plugin = require("tailwindcss/plugin")
const colors = require("tailwindcss/colors")

module.exports = {
   // mode: "jit",
   content: [
      "./src/pages/**/*.{js,ts,jsx,tsx}",
      "./src/components/**/*.{js,ts,jsx,tsx}",
   ],
   darkMode: "class", // or 'media' or 'class', also darkMode increases bundle size noticeably
   theme: {
      fontFamily: {
         sans: [
            "Saira",
            "'Open Sans'",
            "ui-sans-serif",
            "system-ui",
            "-apple-system",
            "BlinkMacSystemFont",
            "sans-serif",
         ],
         monospace: ["'Source Code Pro'", "monospace"],
      },
      maxHeight: {
         "screen-sm": "640px",
         "screen-md": "768px",
         "screen-lg": "1024px",
         "screen-xl": "1280px",
         "screen-2xl": "1536px",
      },
      textIndent: {
         none: "0rem",
         xs: "1rem",
         sm: "2rem",
         md: "3rem",
         lg: "4rem",
      },
      textShadow: {
         default: "0 2px 5px rgba(0, 0, 0, 0.5)",
         lg: "0 2px 10px rgba(0, 0, 0, 0.5)",
      },
      extend: {
         height: {
            "screen-1/2": "50vh",
            "screen-3/5": "60vh",
            "screen-7/10": "70vh",
            "screen-4/5": "80vh",
            "screen-sm": "640px",
            "screen-md": "768px",
            "screen-lg": "1024px",
            "screen-xl": "1280px",
            "screen-2xl": "1536px",
         },
         screens: {
            xs: "360px",
            xsh: { raw: `(min-height: 360px)` },
            smh: { raw: `(min-height: 600px)` },
            mdh: { raw: `(min-height: 960px)` },
            lgh: { raw: `(min-height: 1280px)` },
            xlh: { raw: `(min-height: 1920px)` },
         },
         maxWidth: {
            prose: "70ch",
         },
         colors: {
            current: colors.sky,
            primary: colors.sky,
            secondary: colors.amber,
            accent: colors.indigo,
            background: colors.slate,
         },
      },
   },
   plugins: [
      require("tailwindcss-typography")({
         // https://www.npmjs.com/package/tailwindcss-typography
         // all these options default to the values specified here
         ellipsis: true, // whether to generate ellipsis utilities
         hyphens: true, // whether to generate hyphenation utilities
         kerning: true, // whether to generate kerning utilities
         textUnset: true, // whether to generate utilities to unset text properties
         // componentPrefix: "c-", // the prefix to use for text style classes
      }),
      require("tailwindcss-rtl"),
      // Add custom plugins as such:
      plugin(({ addUtilities }) => {
         const extendTextTransform = {
            ".uppercase-first": {
               "&::first-letter": {
                  textTransform: "uppercase",
               },
            },
            ".uppercase-firstOnly": {
               textTransform: "lowercase",
               "&::first-letter": {
                  textTransform: "uppercase",
               },
            },
         }
         addUtilities(extendTextTransform, ["responsive"])
      }),
   ],
}
