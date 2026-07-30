/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config")

module.exports = {
   reactStrictMode: true,
   output: "standalone",
   transpilePackages: ["next-mdx-remote"],
   i18n,
   async redirects() {
      return [
         {
            source: "/ipa",
            destination: "/english-ipa",
            permanent: true,
         },
         {
            source: "/ipa/text-to-ipa",
            destination: "/english-ipa/text-to-ipa",
            permanent: true,
         },
      ]
   },
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
}
