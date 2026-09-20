/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config")

module.exports = {
   reactStrictMode: true,
   output: "standalone",
   transpilePackages: ["next-mdx-remote"],
   i18n,
   async rewrites() {
      return {
         beforeFiles: [
            {
               source: "/trace/:level*",
               destination: "/api/trace/:level*",
            },
         ],
      }
   },
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
         {
            source: "/p/readme-shortkit-cn",
            destination: "/p/shortkit/cn",
            permanent: true,
         },
         {
            source: "/p/readme-shortkit-debounce-throttle",
            destination: "/p/shortkit/debounce-throttle",
            permanent: true,
         },
         {
            source: "/p/readme-shortkit-make-lazy",
            destination: "/p/shortkit/make-lazy",
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
