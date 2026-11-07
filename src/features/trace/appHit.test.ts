/** @jest-environment node */
import type { NextApiRequest, NextApiResponse } from "next"
import handler from "@/pages/api/trace/[[...level]].page"
import { appHitKey, buildAppHit, traceAppOf } from "./appHit"

const mockPut = jest.fn(async () => undefined)
jest.mock("@/features/object-store/objectStore.mjs", () => ({
   getObjectStore: () => ({ put: mockPut }),
}))
// Not on Cloudflare: requestContext falls back to the env-selected proxy.
jest.mock("@opennextjs/cloudflare", () => ({
   getCloudflareContext: () => {
      throw new Error("no Cloudflare context")
   },
}))

const query = {
   level: ["1"],
   app: "graphitect",
   v: "0.1.0",
   b: "e2507a0-dirty",
   os: "windows",
   arch: "x86_64",
   t: "ayse-k3f9",
   i: "3f1c0d9e-7d4b-4e0a-9f1f-2b1a6c5d8e7f",
   crashed: "1",
}
const headers = {
   referer: "Graphitect - 0.1.0 - e2507a0-dirty",
   "user-agent": "Graphitect/0.1.0 (release; windows-x86_64)",
   "x-forwarded-for": "203.0.113.7",
}

describe("app hits", () => {
   it("only records known apps", () => {
      expect(traceAppOf({ app: "graphitect" })).toBe("graphitect")
      expect(traceAppOf({ app: "other" })).toBeNull()
      expect(traceAppOf({})).toBeNull()
   })

   it("keeps time, IP, query, Referer and UA", () => {
      const hit = buildAppHit(
         query,
         headers,
         "203.0.113.7",
         new Date("2026-11-04T21:00:00Z")
      )
      expect(hit).toEqual({
         ts: "2026-11-04T21:00:00.000Z",
         ip: "203.0.113.7",
         query: {
            app: "graphitect",
            v: "0.1.0",
            b: "e2507a0-dirty",
            os: "windows",
            arch: "x86_64",
            t: "ayse-k3f9",
            i: "3f1c0d9e-7d4b-4e0a-9f1f-2b1a6c5d8e7f",
            crashed: "1",
         },
         referer: "Graphitect - 0.1.0 - e2507a0-dirty",
         ua: "Graphitect/0.1.0 (release; windows-x86_64)",
      })
      expect(appHitKey("graphitect", hit)).toMatch(
         /^trace\/graphitect\/ayse-k3f9\/2026-11-04T21-00-00-000Z-[0-9a-f]{8}\.json$/
      )
   })

   it("files hits with a strange tester code under _unknown", () => {
      const hit = buildAppHit({ t: "../x" }, {}, null, new Date())
      expect(appHitKey("graphitect", hit)).toMatch(/^trace\/graphitect\/_unknown\//)
   })

   it("stores the hit and answers 204 on /trace/1", async () => {
      delete process.env.IP_TRUSTED_PROXY
      process.env.VERCEL = "1"
      let status = 0
      const res = {
         setHeader: jest.fn(),
         status(code: number) {
            status = code
            return res
         },
         end: jest.fn(),
      }
      await handler(
         { method: "GET", query, headers, socket: {} } as unknown as NextApiRequest,
         res as unknown as NextApiResponse
      )
      expect(status).toBe(204)
      expect(mockPut).toHaveBeenCalledTimes(1)
      const [key, body] = mockPut.mock.calls[0] as unknown as [string, string]
      expect(key).toMatch(/^trace\/graphitect\/ayse-k3f9\//)
      expect(JSON.parse(body)).toMatchObject({
         ip: "203.0.113.7",
         query: { t: "ayse-k3f9" },
      })
   })
})
