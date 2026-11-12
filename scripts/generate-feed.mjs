// Writes public/rss.xml from the posts on disk. The output is committed, so it
// depends on the posts only: running it twice gives the same bytes.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { globSync } from "glob"
import matter from "gray-matter"

const SITE_URL = (process.env.SITE_URL || "https://berkekaragoz.com").replace(
   /\/+$/,
   ""
)
const FEED_PATH = "/rss.xml"
const TITLE = "E. Berke Karagöz | Posts"
const DESCRIPTION =
   "Hi, I'm Berke Karagöz. A curious software engineer who builds tools, libraries and apps."
const LANGUAGE = "en"

const root = process.cwd()
const postsPath = path.join(root, "posts")
// glob treats a backslash as an escape. Patterns stay posix.
const postsGlobRoot = postsPath.split(path.sep).join("/")

const fail = (message) => {
   console.error(`generate-feed: ${message}`)
   process.exit(1)
}

// The same discovery as getSlugs in src/lib/api/blog.ts: a post is either
// posts/<slug>.mdx or posts/<slug>/index.mdx. Other files in a post's
// directory are its pages, not posts.
const slugs = [
   ...globSync(`${postsGlobRoot}/*.mdx`).map((el) => path.basename(el, ".mdx")),
   ...globSync(`${postsGlobRoot}/*/index.mdx`).map((el) =>
      path.basename(path.dirname(el))
   ),
]

const readPost = (slug) => {
   // The same lookup order as readPostMatter in blog.ts.
   const filePath = [
      path.join(postsPath, `${slug}.mdx`),
      path.join(postsPath, slug, "index.mdx"),
   ].find((el) => existsSync(el))
   const relativePath = path.relative(root, filePath).split(path.sep).join("/")
   const { data } = matter(readFileSync(filePath, "utf-8"))

   if (typeof data.title !== "string" || !data.title.trim()) {
      fail(`${relativePath} has no title.`)
   }
   if (data.date === undefined || data.date === null) {
      fail(`${relativePath} has no date.`)
   }

   const date = new Date(data.date.toString())
   if (Number.isNaN(date.getTime())) {
      fail(`${relativePath} has a date that does not parse: "${data.date}".`)
   }

   return {
      slug,
      title: data.title,
      excerpt: typeof data.excerpt === "string" ? data.excerpt.trim() : "",
      tags: Array.isArray(data.tags) ? data.tags.map(String).sort() : [],
      date,
   }
}

const escapeXml = (value) =>
   value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")

// Newest first, as in getAllPosts. The slug breaks ties so the order is stable.
const posts = slugs
   .map(readPost)
   .sort((a, b) => b.date - a.date || a.slug.localeCompare(b.slug))

if (posts.length === 0) fail(`no posts found in ${postsPath}.`)

const item = (post) => {
   const link = `${SITE_URL}/p/${post.slug}`

   return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${post.date.toUTCString()}</pubDate>`,
      ...(post.excerpt
         ? [`      <description>${escapeXml(post.excerpt)}</description>`]
         : []),
      ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
      "    </item>",
   ].join("\n")
}

const xml = [
   '<?xml version="1.0" encoding="UTF-8"?>',
   '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
   "  <channel>",
   `    <title>${escapeXml(TITLE)}</title>`,
   `    <link>${escapeXml(SITE_URL)}</link>`,
   `    <description>${escapeXml(DESCRIPTION)}</description>`,
   `    <language>${LANGUAGE}</language>`,
   // The newest post, not the current time, so the output is reproducible.
   `    <lastBuildDate>${posts[0].date.toUTCString()}</lastBuildDate>`,
   `    <atom:link href="${escapeXml(SITE_URL + FEED_PATH)}" rel="self" type="application/rss+xml" />`,
   ...posts.map(item),
   "  </channel>",
   "</rss>",
   "",
].join("\n")

writeFileSync(path.join(root, "public", "rss.xml"), xml)

console.log(`Wrote public${FEED_PATH} with ${posts.length} posts.`)
