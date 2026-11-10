/* eslint-disable @typescript-eslint/no-var-requires */
const { i18n } = require("./next-i18next.config")

// next-sitemap takes its paths from the manifests of the last `next build`.
// It strips the default locale prefix before it applies `exclude`, so a
// default locale path arrives bare ("/posts/react") and every other locale
// keeps its prefix ("/tr-TR/posts/react"). A pattern has to match the whole
// path, and `*` matches any characters, slashes included.

// Pages that are served but are not content.
const NOT_CONTENT = [
   "/404",
   "/500",
   // Everything below /posts: the tag listings and /posts/preview. The index
   // itself is "/posts", without a trailing slash, so it stays.
   "/posts/*",
]

const otherLocales = i18n.locales.filter(
   (locale) => locale !== i18n.defaultLocale,
)

/** @type {import('next-sitemap').IConfig} */
module.exports = {
   siteUrl: process.env.SITE_URL || "https://berkekaragoz.com",
   generateRobotsTxt: true, // (optional)
   exclude: [
      ...NOT_CONTENT,
      ...otherLocales.flatMap((locale) => [
         ...NOT_CONTENT.map((path) => `/${locale}${path}`),
         // Post bodies are not translated; the copy under another locale
         // canonicalises to the default locale URL.
         `/${locale}/p/*`,
      ]),
   ],
   robotsTxtOptions: {
      policies: [{ userAgent: "*", allow: "/" }],
   },
}
