# Post navigation

Posts can be a single file or a directory of pages. Both render through
`src/pages/p/[...slug].page.tsx`.

## Single file posts

Nothing changed. `posts/my-post.mdx` is served at `/p/my-post`.

Every post now gets a **contents rail** on the right, built from its `h2` and
`h3` headings. Nothing to author — the headings already carry ids from
`rehype-slug`, and the rail tracks whichever heading you are reading. It shows
from `lg` upwards and collapses into a *contents* sheet below that.

## Multi page posts

Turn the file into a directory when a post needs pages of its own:

```
posts/
  my-guide/
    index.mdx          ← page 1, and the post's frontmatter
    installation.mdx
    configuration.mdx
    doing-it-in-c.mdx
```

`index.mdx` carries the post frontmatter, plus a `nav` list that sets the
reading order:

```yaml
---
title: My guide
pageTitle: Overview # optional, the sidebar label for index.mdx
tags:
   - guide
date: 20 Sep 26 10:00 UTC+0
excerpt: What the post is about.
nav:
   - Getting started:
        - installation
        - configuration
   - Going further:
        - doing-it-in-c
---
```

A `nav` entry is either a page slug on its own, or a `group: [slugs]` map. The
two can be mixed, and groups are optional:

```yaml
nav:
   - installation
   - configuration
```

`index` is prepended as the first page automatically. List it explicitly if you
want it inside a group instead.

Each child page only needs its own `title`, which is what the sidebar shows:

```yaml
---
title: Installation
---
```

### What you get

- `/p/my-guide` for `index.mdx`, `/p/my-guide/installation` for the rest
- a page tree on the left from `lg`, a *pages* sheet below that
- previous/next cards at the foot of every page
- an `N pages` badge on the post card in `/posts`

### What is inherited

Tags, date, excerpt and the cover image come from `index.mdx` and apply to the
whole post. If `index.mdx` has no `<Image>`, the first one found in a child page
is used as the cover instead.

Reading time is per page in the article header, and the total across pages in
the sidebar and on the post card.

Comments are shared: every page of a multi page post points giscus at
`/p/<slug>`, so the post has one discussion rather than one per page.

## Where the code lives

| Path | Role |
| --- | --- |
| `src/lib/api/blog-common.ts` | Types, `INDEX_PAGE_SLUG`, `getPostPageHref`. No imports, so components can use it |
| `src/lib/api/blog.ts` | Reads `posts/`, parses `nav`, resolves pages. Build only — pulls in `fs` and `glob` |
| `src/lib/api/blog-client.ts` | MDX serialization, post meta, heading collection |
| `src/components/organism/PostLayout/` | The rails, the sheets, pagination, scroll spy |

`src/styles/components/post-layout.css` holds the three column grid. Both side
tracks resolve to the same `clamp()`, so the article stays centred whether a
rail holds anything or not, and an empty track needs no spacer. Rail entries are
heading and page titles, so the panel wraps on `overflow-wrap: anywhere` and
scrolls its own overflow rather than growing.

The panel is pinned the same way as the IPA tool's `.detailPanel` in
`src/pages/english-ipa/ipa.module.css`. Keep the two in step if either moves.

Keep value exports out of `blog.ts` if a component needs them. Importing one
from a component drags `fs` and `glob` into the browser bundle and the page
fails to build — that is what `blog-common.ts` exists to prevent.
