import { gunzipSync } from "node:zlib"
import type { IpAddress } from "@/features/request-info/ipAddress"
import { getIpScope } from "@/features/request-info/ipAddress"
import asnSnapshot from "./data/asn.json"

const HOUR = 60 * 60 * 1000
const ASN_MAX_AGE_HOURS = 30 * 24

// These caches contain only bundled public reference data, never request data.
let ipv4Records: Buffer | undefined
let ipv6Records: Buffer | undefined
let organizations: Record<string, string> | undefined

function ageHours(date: string, now: number): number | undefined {
   const age = (now - Date.parse(date)) / HOUR
   return Number.isFinite(age) && age >= 0 ? age : undefined
}

function findAsn(ip: IpAddress): number | undefined {
   const snapshot = ip.version === 4 ? asnSnapshot.ipv4 : asnSnapshot.ipv6
   if (ip.version === 4 && !ipv4Records) {
      ipv4Records = gunzipSync(Buffer.from(snapshot.gzipBase64, "base64"))
   } else if (ip.version === 6 && !ipv6Records) {
      ipv6Records = gunzipSync(Buffer.from(snapshot.gzipBase64, "base64"))
   }
   const records = (ip.version === 4 ? ipv4Records : ipv6Records)!
   const address = Buffer.from(ip.bytes)
   const width = address.length
   const stride = width * 2 + 4
   let low = 0
   let high = snapshot.count - 1
   while (low <= high) {
      const middle = Math.floor((low + high) / 2)
      const offset = middle * stride
      if (Buffer.compare(address, records.subarray(offset, offset + width)) < 0) {
         high = middle - 1
      } else if (
         Buffer.compare(
            address,
            records.subarray(offset + width, offset + width * 2)
         ) > 0
      ) {
         low = middle + 1
      } else {
         return records.readUInt32BE(offset + width * 2)
      }
   }
   return undefined
}

export function lookupLocalAsn(ip: IpAddress | null, now: number) {
   const snapshot = ip?.version === 6 ? asnSnapshot.ipv6 : asnSnapshot.ipv4
   const date = snapshot.sourceUpdatedAt || snapshot.retrievedAt
   const age = ageHours(date, now)
   const stale = age === undefined || age > ASN_MAX_AGE_HOURS
   const applicable = ip && getIpScope(ip) === "public"
   const asn = applicable ? findAsn(ip) : undefined
   if (asn && !organizations) {
      organizations = JSON.parse(
         gunzipSync(
            Buffer.from(asnSnapshot.organizationsGzipBase64, "base64")
         ).toString("utf8")
      )
   }
   return {
      asn,
      organization: asn ? organizations?.[asn] : undefined,
      date,
      ageHours: age === undefined ? undefined : Math.floor(age),
      stale,
      status: !ip
         ? "invalid_ip"
         : !applicable
           ? "not_applicable"
           : asn
             ? "matched"
             : "not_found",
   }
}
