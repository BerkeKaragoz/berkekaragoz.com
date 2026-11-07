# App pings and private downloads

Two server pieces for native apps (Graphitect's invite-only test first). Both are
Next.js API routes, so they run wherever the site runs (Vercel today, the
OpenNext Cloudflare build too). Both keep their data in one private
S3-compatible bucket, because a serverless function has no disk and caps its
response size (4.5 MB on Vercel).

| URL                                       | Route                                       | Bucket keys                               |
| ----------------------------------------- | ------------------------------------------- | ----------------------------------------- |
| `GET /trace/1?app=graphitect&...`         | `src/pages/api/trace/[[...level]].page.ts`  | `trace/<app>/<tester>/<time>-<rand>.json` |
| `GET /downloads/<app>/<tester>/<file...>` | `src/pages/api/downloads/[...path].page.ts` | `downloads/<app>/<tester>/<file...>`      |

## Setup

1. Create a private bucket. On Cloudflare R2:
   `npx wrangler r2 bucket create berkekaragoz-private`, or use the dashboard.
   Leave public access and custom domains off.
2. Create an R2 API token with **Object Read & Write** on that bucket only.
3. Set these four on the host (Vercel: Project → Settings → Environment
   Variables, Production), and in `.env.local` for the scripts below:

   ```
   OBJECT_STORE_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   OBJECT_STORE_BUCKET=berkekaragoz-private
   OBJECT_STORE_ACCESS_KEY_ID=...
   OBJECT_STORE_SECRET_ACCESS_KEY=...
   ```

   `OBJECT_STORE_REGION` is optional (`auto` suits R2; AWS needs the bucket's
   region). Any S3-compatible store works, so moving host or store only means
   changing these values.

## Launch pings: `/trace/<level>`

Requests with `app=<name>` for a name in `TRACE_APPS`
(`src/features/trace/appHit.ts`) are stored and answered `204` with no body.
Every other request still gets the plain-text trace. A stored row holds the
time, the client IP, every query parameter (`app`, `v`, `b`, `os`, `arch`, `t`,
`i`, `crashed`...), the Referer and the User-Agent. If the store is unreachable
the app still gets `204` within about 2.5 s and the hit is only logged as an
error.

Reading the hits:

```bash
pnpm trace:hits graphitect                  # one block per tester
pnpm trace:hits graphitect ayse-k3f9        # one tester
pnpm trace:hits graphitect --json > hits.jsonl
```

Each block lists the tester's distinct install IDs and IPs with counts and last
seen time. It is marked `<- check` when a tester has more than one install ID or
more than two IPs. Hits without a usable tester code are filed under
`_unknown`.

## Private downloads: `/downloads/<app>/<tester>/`

- The client must send HTTP Basic auth with the tester code as both username
  and password, and can open only `/downloads/<app>/<that tester>/...`.
- A tester counts as active while `downloads/<app>/<tester>/latest.json` exists.
  Otherwise every file under their folder returns `401`.
- Files up to 1 MB (`latest.json`, `.sig`) are served directly. Larger files
  (the installer) get a `302` to a signed bucket URL that lasts 10 minutes. The
  updater follows the redirect, and the signed URL needs no auth header.
- There is no listing. Folder URLs return `404`. The bucket is private, and the
  binaries never go into git.
- `latest.json`'s `url` must point at this site's
  `/downloads/<app>/<tester>/<ver>/<file>`, not at the bucket.

The tester code is the only secret. Anyone who has a tester's installer or code
can fetch that tester's folder, and that is also how a passed-on copy shows up
in the trace hits.

### Uploading a release

`cargo xtask release` writes `target/release-out/<tester>/latest.json` and
`target/release-out/<tester>/<ver>/Graphitect_<ver>_x64-setup.exe(.sig)`:

```bash
pnpm downloads upload graphitect <path-to>/target/release-out              # every tester folder
pnpm downloads upload graphitect <path-to>/target/release-out ayse-k3f9    # just these testers
```

Each tester's `latest.json` is uploaded last, so the updater never sees a
version whose installer is not there yet. Old version folders stay in the bucket
until you remove them.

### Adding and removing testers

- Add a tester by building their installer, then uploading their folder. Once
  their `latest.json` is in the bucket, they are active.
- Remove a tester with `pnpm downloads remove graphitect <tester>`. It deletes
  their `latest.json` first, which cuts them off at once, and then the rest of
  their folder.
- `pnpm downloads list graphitect` shows each tester, whether they are active,
  and their versions.
