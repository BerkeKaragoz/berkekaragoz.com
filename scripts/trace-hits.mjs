// Reads the launch pings stored by /trace/<level>?app=<app>&...
//
//   pnpm trace:hits <app>                 one block per tester
//   pnpm trace:hits <app> <tester>        just that tester
//   pnpm trace:hits <app> [tester] --json every hit as one JSON line
import {
   createObjectStore,
   storeConfigFromEnv,
} from "../src/features/object-store/objectStore.mjs"

const args = process.argv.slice(2)
const json = args.includes("--json")
const [app, tester] = args.filter((arg) => arg !== "--json")
if (!app) {
   console.error("usage: pnpm trace:hits <app> [tester] [--json]")
   process.exit(1)
}
const config = storeConfigFromEnv()
if (!config) {
   console.error("error: set OBJECT_STORE_* in .env.local (see docs/app-backend.md)")
   process.exit(1)
}
const store = createObjectStore(config)

const keys = await store.list(`trace/${app}/${tester ? `${tester}/` : ""}`)
const hits = []
for (let i = 0; i < keys.length; i += 16) {
   const batch = keys.slice(i, i + 16).map(async (key) => {
      const res = await store.get(key)
      return res ? res.json() : null
   })
   hits.push(...(await Promise.all(batch)).filter(Boolean))
}
hits.sort((a, b) => a.ts.localeCompare(b.ts))

if (json) {
   for (const hit of hits) console.log(JSON.stringify(hit))
   process.exit(0)
}
if (!hits.length) {
   console.log(`no hits for ${app}${tester ? `/${tester}` : ""}`)
   process.exit(0)
}

function tally(map, value) {
   if (!value) return
   const entry = map.get(value) ?? { count: 0, last: "" }
   entry.count += 1
   map.set(value, entry)
   return entry
}

const testers = new Map()
for (const hit of hits) {
   const code = hit.query.t ?? "(no tester code)"
   const entry = testers.get(code) ?? {
      hits: 0,
      crashes: 0,
      first: hit.ts,
      last: hit.ts,
      installs: new Map(),
      ips: new Map(),
      versions: new Map(),
   }
   entry.hits += 1
   if (hit.query.crashed === "1") entry.crashes += 1
   entry.last = hit.ts
   for (const [map, value] of [
      [entry.installs, hit.query.i],
      [entry.ips, hit.ip],
      [entry.versions, hit.query.v && `${hit.query.v} (${hit.query.b ?? hit.query.p ?? "?"})`],
   ]) {
      const seen = tally(map, value)
      if (seen) seen.last = hit.ts
   }
   testers.set(code, entry)
}

const day = (ts) => ts.slice(0, 16).replace("T", " ")
const lines = (map) =>
   [...map]
      .sort((a, b) => b[1].last.localeCompare(a[1].last))
      .map(
         ([value, { count, last }]) => `    ${value}  ×${count}  last ${day(last)}`
      )

for (const [code, entry] of [...testers].sort()) {
   const flag = entry.installs.size > 1 || entry.ips.size > 2 ? "  <- check" : ""
   console.log(
      `${code}: ${entry.hits} hit(s), ${entry.crashes} after a crash, ${day(entry.first)} .. ${day(entry.last)} UTC${flag}`
   )
   for (const [label, map] of [
      ["install IDs", entry.installs],
      ["IPs", entry.ips],
      ["versions", entry.versions],
   ]) {
      console.log([`  ${label} (${map.size}):`, ...lines(map)].join("\n"))
   }
   console.log()
}
