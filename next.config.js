/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config")

module.exports = {
   reactStrictMode: true,
   i18n,
   pageExtensions: [
      "page.mdx",
      "page.md",
      "page.jsx",
      "page.js",
      "page.tsx",
      "page.ts",
      "p.mdx",
      "p.md",
      "p.jsx",
      "p.js",
      "p.tsx",
      "p.ts",
   ], // for custom page extensions
   images: {
      domains: ["upload.wikimedia.org", "user-images.githubusercontent.com"],
   },
   ignoreBuildErrors: true, // for react-i18next bug (actually next-i18next)
}
