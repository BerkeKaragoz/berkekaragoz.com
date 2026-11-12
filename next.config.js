/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config")

module.exports = {
   // Applied per page in _app instead, see AppPage.
   reactStrictMode: false,
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
            {
               source: "/downloads/:path*",
               destination: "/api/downloads/:path*",
            },
            {
               source: "/ads.txt",
               destination: "/api/ads-txt",
            },
         ],
      }
   },
   async redirects() {
      return [
         {
            source: "/ipa",
            destination: "/english-ipa/text-to-ipa",
            permanent: true,
         },
         {
            source: "/ipa/text-to-ipa",
            destination: "/english-ipa/text-to-ipa",
            permanent: true,
         },
         {
            // The converter is the IPA tool's landing page.
            source: "/english-ipa",
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
         {
            source: "/p/shortkit/installation",
            destination: "/p/shortkit#installation",
            permanent: true,
         },
         {
            source: "/p/statekit/installation",
            destination: "/p/statekit#installation",
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
      // Every `quality` a next/image caller passes, plus the default 75.
      qualities: [40, 60, 75, 80],
      domains: ["upload.wikimedia.org", "user-images.githubusercontent.com"],
   },
}
