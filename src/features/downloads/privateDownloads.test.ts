/** @jest-environment node */
import type { NextApiRequest, NextApiResponse } from "next"
import handler from "@/pages/api/downloads/[...path].page"
import { isTesterAuthorized, parseDownloadPath } from "./privateDownloads"

const mockObjects = new Map<string, { size: number; contentType: string }>()
const mockStore = {
   head: jest.fn(async (key: string) => mockObjects.get(key) ?? null),
   get: jest.fn(async (key: string) =>
      mockObjects.has(key) ? new Response(`body of ${key}`) : null
   ),
   presignGet: jest.fn(async (key: string) => `https://bucket.example/${key}?sig`),
}
jest.mock("@/features/object-store/objectStore.mjs", () => ({
   getObjectStore: () => mockStore,
}))

const basic = (user: string, password = user) =>
   `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`

async function call(path: string[], authorization?: string, method = "GET") {
   const headers: Record<string, string> = {}
   let status = 0
   let body: unknown
   const res = {
      setHeader: (name: string, value: string) => {
         headers[name.toLowerCase()] = value
      },
      status(code: number) {
         status = code
         return res
      },
      end(chunk?: unknown) {
         body = chunk
         return res
      },
   }
   await handler(
      {
         method,
         query: { path },
         headers: { authorization },
      } as unknown as NextApiRequest,
      res as unknown as NextApiResponse
   )
   return { status, headers, body: body === undefined ? undefined : String(body) }
}

beforeEach(() => {
   mockObjects.clear()
   mockObjects.set("downloads/graphitect/ayse-k3f9/latest.json", {
      size: 400,
      contentType: "application/json",
   })
   mockObjects.set(
      "downloads/graphitect/ayse-k3f9/0.1.0/Graphitect_0.1.0_x64-setup.exe",
      {
         size: 30_000_000,
         contentType: "application/vnd.microsoft.portable-executable",
      }
   )
   mockObjects.set(
      "downloads/graphitect/ayse-k3f9/0.1.0/Graphitect_0.1.0_x64-setup.exe.sig",
      {
         size: 420,
         contentType: "text/plain",
      }
   )
})

describe("parseDownloadPath", () => {
   it("maps the route to the bucket key and the tester's latest.json", () => {
      expect(
         parseDownloadPath(["graphitect", "ayse-k3f9", "0.1.0", "a.exe"])
      ).toEqual({
         app: "graphitect",
         tester: "ayse-k3f9",
         key: "downloads/graphitect/ayse-k3f9/0.1.0/a.exe",
         markerKey: "downloads/graphitect/ayse-k3f9/latest.json",
      })
   })

   it("rejects short paths, dot segments and odd characters", () => {
      expect(parseDownloadPath(["graphitect", "ayse-k3f9"])).toBeNull()
      expect(parseDownloadPath(["graphitect", "..", "latest.json"])).toBeNull()
      expect(parseDownloadPath(["graphitect", "a b", "latest.json"])).toBeNull()
   })
})

describe("isTesterAuthorized", () => {
   it("needs the tester code as both username and password", () => {
      expect(isTesterAuthorized(basic("ayse-k3f9"), "ayse-k3f9")).toBe(true)
      expect(isTesterAuthorized(basic("ayse-k3f9", "x"), "ayse-k3f9")).toBe(false)
      expect(isTesterAuthorized(basic("mehmet-a1b2"), "ayse-k3f9")).toBe(false)
      expect(isTesterAuthorized(undefined, "ayse-k3f9")).toBe(false)
   })
})

describe("downloads route", () => {
   const latest = ["graphitect", "ayse-k3f9", "latest.json"]
   const exe = ["graphitect", "ayse-k3f9", "0.1.0", "Graphitect_0.1.0_x64-setup.exe"]

   it("asks for Basic auth without the tester's credentials", async () => {
      const res = await call(latest)
      expect(res.status).toBe(401)
      expect(res.headers["www-authenticate"]).toMatch(/^Basic /)
      expect((await call(latest, basic("mehmet-a1b2"))).status).toBe(401)
   })

   it("serves small files directly", async () => {
      const res = await call(latest, basic("ayse-k3f9"))
      expect(res.status).toBe(200)
      expect(res.headers["content-type"]).toBe("application/json")
      expect(res.body).toBe("body of downloads/graphitect/ayse-k3f9/latest.json")
      const sig = await call(
         [...exe.slice(0, 3), `${exe[3]}.sig`],
         basic("ayse-k3f9")
      )
      expect(sig.status).toBe(200)
   })

   it("redirects large files to a signed URL", async () => {
      const res = await call(exe, basic("ayse-k3f9"))
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe(
         "https://bucket.example/downloads/graphitect/ayse-k3f9/0.1.0/Graphitect_0.1.0_x64-setup.exe?sig"
      )
   })

   it("cuts a removed tester off from every file", async () => {
      mockObjects.delete("downloads/graphitect/ayse-k3f9/latest.json")
      expect((await call(exe, basic("ayse-k3f9"))).status).toBe(401)
      expect((await call(latest, basic("ayse-k3f9"))).status).toBe(401)
   })

   it("404s a missing file for an active tester", async () => {
      const res = await call(
         ["graphitect", "ayse-k3f9", "9.9.9", "x.exe"],
         basic("ayse-k3f9")
      )
      expect(res.status).toBe(404)
   })
})
