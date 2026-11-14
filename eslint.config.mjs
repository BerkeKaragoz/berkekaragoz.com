import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import suggestions from "eslint-config-berkekaragoz/suggestions.js";
import typescript from "eslint-config-berkekaragoz/typescript.js";

export default [
   {
      ignores: [
         "dist/**",
         ".open-next/**",
         ".sites-worker/**",
         ".design-compare/**",
         "coverage/**",
         "public/**",
      ],
   },
   ...nextCoreWebVitals,
   suggestions,
   ...typescript,
   {
      rules: {
         "sort-imports": "off",
      },
   },
];
