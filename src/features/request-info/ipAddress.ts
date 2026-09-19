import { isIP } from "node:net"

export type IpAddress = { version: 4 | 6; bytes: Uint8Array }

export function parseIpAddress(value: string | null | undefined): IpAddress | null {
   if (!value || value.includes("%")) return null
   const version = isIP(value)
   if (!version) return null
   if (version === 4) {
      return { version: 4, bytes: Uint8Array.from(value.split(".").map(Number)) }
   }

   let ipv6 = value
   if (ipv6.includes(".")) {
      const boundary = ipv6.lastIndexOf(":")
      const octets = ipv6
         .slice(boundary + 1)
         .split(".")
         .map(Number)
      ipv6 =
         ipv6.slice(0, boundary + 1) +
         (octets[0] * 256 + octets[1]).toString(16) +
         ":" +
         (octets[2] * 256 + octets[3]).toString(16)
   }
   const halves = ipv6.split("::")
   const left = halves[0] ? halves[0].split(":") : []
   const right = halves[1] ? halves[1].split(":") : []
   const words =
      halves.length === 2
         ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
         : left
   const bytes = Uint8Array.from(
      words.flatMap((word) => {
         const number = parseInt(word, 16)
         return [number >>> 8, number & 255]
      })
   )
   // Treat both dotted and hexadecimal IPv4-mapped representations identically.
   if (
      bytes.slice(0, 10).every((byte) => byte === 0) &&
      bytes[10] === 255 &&
      bytes[11] === 255
   ) {
      return { version: 4, bytes: bytes.slice(12) }
   }
   return { version: 6, bytes }
}

// IANA special-purpose registries, reviewed 2026-09-19. Longest prefix wins.
// https://www.iana.org/assignments/iana-ipv4-special-registry/
// https://www.iana.org/assignments/iana-ipv6-special-registry/
const SPECIAL_RANGES: [string, string][] = [
   ["0.0.0.0/32", "unspecified"],
   ["0.0.0.0/8", "reserved"],
   ["10.0.0.0/8", "private"],
   ["100.64.0.0/10", "shared"],
   ["127.0.0.0/8", "loopback"],
   ["169.254.0.0/16", "link_local"],
   ["172.16.0.0/12", "private"],
   ["192.0.0.0/24", "reserved"],
   ["192.0.0.9/32", "public"],
   ["192.0.0.10/32", "public"],
   ["192.0.2.0/24", "documentation"],
   ["192.88.99.0/24", "reserved"],
   ["192.168.0.0/16", "private"],
   ["198.18.0.0/15", "benchmarking"],
   ["198.51.100.0/24", "documentation"],
   ["203.0.113.0/24", "documentation"],
   ["224.0.0.0/4", "multicast"],
   ["240.0.0.0/4", "reserved"],
   ["255.255.255.255/32", "broadcast"],
   ["::/128", "unspecified"],
   ["::1/128", "loopback"],
   ["::/96", "reserved"],
   ["64:ff9b::/96", "translation"],
   ["64:ff9b:1::/48", "translation"],
   ["100::/64", "discard_only"],
   ["100:0:0:1::/64", "reserved"],
   ["2001::/23", "reserved"],
   ["2001::/32", "transition"],
   ["2001:1::1/128", "public"],
   ["2001:1::2/128", "public"],
   ["2001:1::3/128", "public"],
   ["2001:2::/48", "benchmarking"],
   ["2001:3::/32", "public"],
   ["2001:4:112::/48", "public"],
   ["2001:20::/28", "special_purpose"],
   ["2001:30::/28", "special_purpose"],
   ["2001:db8::/32", "documentation"],
   ["2002::/16", "transition"],
   ["3fff::/20", "documentation"],
   ["5f00::/16", "special_purpose"],
   ["fc00::/7", "private"],
   ["fec0::/10", "reserved"],
   ["fe80::/10", "link_local"],
   ["ff00::/8", "multicast"],
]

const ranges = SPECIAL_RANGES.map(([cidr, scope]) => {
   const [address, prefix] = cidr.split("/")
   return { address: parseIpAddress(address)!, prefix: Number(prefix), scope }
}).sort((a, b) => b.prefix - a.prefix)

export function getIpScope(ip: IpAddress | null): string | undefined {
   if (!ip) return undefined
   for (const range of ranges) {
      if (ip.version !== range.address.version) continue
      const completeBytes = Math.floor(range.prefix / 8)
      const remainingBits = range.prefix % 8
      if (
         !ip.bytes
            .slice(0, completeBytes)
            .every((byte, index) => byte === range.address.bytes[index])
      )
         continue
      if (remainingBits) {
         const mask = (255 << (8 - remainingBits)) & 255
         if (
            (ip.bytes[completeBytes] & mask) !==
            (range.address.bytes[completeBytes] & mask)
         )
            continue
      }
      return range.scope
   }
   // Classification describes address space, not proof of an active route.
   // Other IPv6 allocations remain reserved after the exceptions above.
   // https://www.iana.org/assignments/ipv6-address-space/
   if (ip.version === 6 && (ip.bytes[0] & 224) !== 32) return "reserved"
   return "public"
}
