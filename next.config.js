/** @type {import('next').NextConfig} */
const { i18n } = require("./next-i18next.config");

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
  ], //for custom page extensions
  images: {
    domains: ["upload.wikimedia.org"],
  },
};
