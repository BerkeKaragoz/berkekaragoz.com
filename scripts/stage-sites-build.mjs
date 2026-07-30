import { access, cp, mkdir, rm } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const openNextPath = path.join(root, ".open-next")
const bundledWorkerPath = path.join(root, ".sites-worker", "worker.js")
const outputPath = path.join(root, "dist")
const serverPath = path.join(outputPath, "server")

await access(bundledWorkerPath)
await access(path.join(openNextPath, "assets"))

await rm(outputPath, { recursive: true, force: true })
await mkdir(serverPath, { recursive: true })

await cp(bundledWorkerPath, path.join(serverPath, "index.js"))
await cp(path.join(openNextPath, "assets"), path.join(outputPath, "assets"), {
   recursive: true,
})

console.log("Staged the bundled worker and static assets in dist.")
