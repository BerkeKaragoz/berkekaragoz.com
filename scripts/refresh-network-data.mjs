// Explicit maintenance command only. Never imported by an endpoint or build.
// ASN data: https://iptoasn.com/ — Public Domain Dedication and License v1.0.
import { readFile, mkdir, writeFile, rename } from "node:fs/promises"
import { gzipSync, gunzipSync } from "node:zlib"
import { createHash } from "node:crypto"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const root = new URL("../", import.meta.url)
const source = await readFile(
   new URL("src/features/request-info/ipAddress.ts", root),
   "utf8"
)
const compiled = ts.transpileModule(source, {
   compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText
const { parseIpAddress } = await import(
   `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
)
const output = new URL("src/features/trace/data/", root)
const organizations = {}

async function download(url) {
   const response = await fetch(url, { signal: AbortSignal.timeout(120000) })
   if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`)
   const bytes = Buffer.from(await response.arrayBuffer())
   if (bytes.length > 32 * 1024 * 1024) throw new Error(`Dataset too large: ${url}`)
   const modified = response.headers.get("last-modified")
   return {
      bytes,
      source: url,
      retrievedAt: new Date().toISOString(),
      sourceUpdatedAt:
         modified && Number.isFinite(Date.parse(modified))
            ? new Date(modified).toISOString()
            : null,
      sha256: createHash("sha256").update(bytes).digest("hex"),
   }
}

const compress = (bytes) => gzipSync(bytes, { level: 9 }).toString("base64")

async function asnFamily(version) {
   const downloaded = await download(
      `https://iptoasn.com/data/ip2asn-v${version}.tsv.gz`
   )
   const lines = gunzipSync(downloaded.bytes, { maxOutputLength: 192 * 1024 * 1024 })
      .toString("utf8")
      .trim()
      .split("\n")
   const addressBytes = version === 4 ? 4 : 16
   const recordBytes = addressBytes * 2 + 4
   const records = Buffer.alloc(lines.length * recordBytes)
   let count = 0
   let previousEnd
   for (const line of lines) {
      const [start, end, asnText, , description] = line.trimEnd().split("\t")
      if (!/^\d+$/.test(asnText || "")) throw new Error("Invalid ASN row")
      const asn = Number(asnText)
      if (asn === 0) continue // Unassigned ranges are not network matches.
      if (!Number.isSafeInteger(asn) || asn > 0xffffffff || !description)
         throw new Error("Invalid ASN record")
      const first = parseIpAddress(start)
      const last = parseIpAddress(end)
      if (first?.version !== version || last?.version !== version)
         throw new Error("Wrong address family")
      const startBytes = Buffer.from(first.bytes)
      const endBytes = Buffer.from(last.bytes)
      if (
         Buffer.compare(startBytes, endBytes) > 0 ||
         (previousEnd && Buffer.compare(previousEnd, startBytes) >= 0)
      )
         throw new Error("ASN ranges overlap or are unsorted")
      startBytes.copy(records, count * recordBytes)
      endBytes.copy(records, count * recordBytes + addressBytes)
      records.writeUInt32BE(asn, count * recordBytes + addressBytes * 2)
      organizations[asn] = description
      previousEnd = endBytes
      count++
   }
   if (count < 10000) throw new Error("ASN dataset is unexpectedly incomplete")
   const { bytes, ...metadata } = downloaded
   return {
      ...metadata,
      count,
      gzipBase64: compress(records.subarray(0, count * recordBytes)),
   }
}

// Download only whole public datasets; never send an end-user's IP anywhere.
const ipv4 = await asnFamily(4)
const ipv6 = await asnFamily(6)
const asn = {
   format: "ip-range-be-v1",
   license: "PDDL-1.0",
   source: "https://iptoasn.com/",
   ipv4,
   ipv6,
   organizationsGzipBase64: compress(Buffer.from(JSON.stringify(organizations))),
}

// Validate both address families before replacing the usable snapshot.
await mkdir(output, { recursive: true })
const target = new URL("asn.json", output)
const staging = new URL("asn.json.tmp", output)
const serialized = JSON.stringify(asn) + "\n"
await writeFile(staging, serialized)
await rename(staging, target)
console.log(`Updated ${fileURLToPath(target)} (${serialized.length} bytes)`)
console.log(`ASN ranges: IPv4 ${ipv4.count}, IPv6 ${ipv6.count}`)
