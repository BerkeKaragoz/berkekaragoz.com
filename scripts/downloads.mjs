// Manages the private per-tester release folders served at
// /downloads/<app>/<tester>/. See docs/app-backend.md.
//
//   pnpm downloads upload <app> <release-out-dir> [tester...]
//   pnpm downloads remove <app> <tester>
//   pnpm downloads list <app>
import { readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import {
   createObjectStore,
   storeConfigFromEnv,
} from "../src/features/object-store/objectStore.mjs"

const SEGMENT = /^[A-Za-z0-9._-]{1,128}$/
const CONTENT_TYPES = {
   ".json": "application/json",
   ".sig": "text/plain; charset=utf-8",
   ".exe": "application/vnd.microsoft.portable-executable",
}

function usage(message) {
   if (message) console.error(`error: ${message}\n`)
   console.error(
      [
         "usage:",
         "  pnpm downloads upload <app> <release-out-dir> [tester...]",
         "  pnpm downloads remove <app> <tester>",
         "  pnpm downloads list <app>",
      ].join("\n")
   )
   process.exit(1)
}

function segment(value, what) {
   if (!value || !SEGMENT.test(value) || /^\.+$/.test(value)) {
      usage(`invalid ${what}: ${value ?? "(missing)"}`)
   }
   return value
}

async function filesUnder(dir, prefix = "") {
   const files = []
   for (const entry of await readdir(dir, { withFileTypes: true })) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
         files.push(...(await filesUnder(path.join(dir, entry.name), relative)))
      } else if (entry.isFile()) {
         files.push(relative)
      }
   }
   return files
}

async function upload(store, app, releaseDir, only) {
   const testers = only.length
      ? only.map((tester) => segment(tester, "tester"))
      : (await readdir(releaseDir, { withFileTypes: true }))
           .filter((entry) => entry.isDirectory())
           .map((entry) => segment(entry.name, "tester folder"))
   if (!testers.length) usage(`no tester folders in ${releaseDir}`)

   for (const tester of testers) {
      const dir = path.join(releaseDir, tester)
      const files = await filesUnder(dir)
      if (!files.includes("latest.json")) {
         throw new Error(`${dir} has no latest.json`)
      }
      for (const file of files)
         file.split("/").forEach((part) => segment(part, "file name"))
      // latest.json goes last so the updater never sees a version whose
      // installer is not there yet.
      const ordered = [...files.filter((f) => f !== "latest.json"), "latest.json"]
      for (const file of ordered) {
         const key = `downloads/${app}/${tester}/${file}`
         const source = path.join(dir, ...file.split("/"))
         const { size } = await stat(source)
         const type =
            CONTENT_TYPES[path.extname(file).toLowerCase()] ??
            "application/octet-stream"
         await store.put(key, await readFile(source), type)
         console.log(`put ${key} (${(size / 1024).toFixed(0)} KiB)`)
      }
   }
}

async function remove(store, app, tester) {
   const folder = `downloads/${app}/${tester}/`
   // Deleting latest.json first cuts the tester off even if a later delete fails.
   await store.delete(`${folder}latest.json`)
   const keys = await store.list(folder)
   for (const key of keys) await store.delete(key)
   console.log(
      `removed ${tester}: deleted latest.json and ${keys.length} other object(s)`
   )
}

async function list(store, app) {
   const folder = `downloads/${app}/`
   const testers = new Map()
   for (const key of await store.list(folder)) {
      const [tester, ...rest] = key.slice(folder.length).split("/")
      const entry = testers.get(tester) ?? { active: false, versions: new Set() }
      if (rest.join("/") === "latest.json") entry.active = true
      else if (rest.length > 1) entry.versions.add(rest[0])
      testers.set(tester, entry)
   }
   if (!testers.size) return console.log(`no testers under ${folder}`)
   for (const [tester, { active, versions }] of [...testers].sort()) {
      console.log(
         `${tester}\t${active ? "active " : "removed"}\t${[...versions].sort().join(", ")}`
      )
   }
}

const [command, app, ...rest] = process.argv.slice(2)
if (!command) usage()
const config = storeConfigFromEnv()
if (!config) usage("set OBJECT_STORE_* in .env.local (see docs/app-backend.md)")
const store = createObjectStore(config)
segment(app, "app")

if (command === "upload") {
   const [releaseDir, ...testers] = rest
   if (!releaseDir) usage("missing <release-out-dir>")
   await upload(store, app, path.resolve(releaseDir), testers)
} else if (command === "remove") {
   await remove(store, app, segment(rest[0], "tester"))
} else if (command === "list") {
   await list(store, app)
} else {
   usage(`unknown command: ${command}`)
}
