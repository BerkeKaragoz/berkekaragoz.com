import { CONSENT_MAX_AGE_MS, CONSENT_VERSION } from "./config"
import {
   createOwnChoice,
   parseOwnChoice,
   revoked,
   tcfDecided,
   tcfGrants,
} from "./choice"

const NOW = Date.parse("2026-11-06T12:00:00.000Z")

describe("parseOwnChoice", () => {
   const stored = createOwnChoice({ analytics: true, ads: false }, new Date(NOW), "id-1")

   it("reads back a choice it created", () => {
      expect(parseOwnChoice(JSON.stringify(stored), NOW)).toEqual(stored)
   })

   it("ignores missing, malformed and partial values", () => {
      expect(parseOwnChoice(null, NOW)).toBeNull()
      expect(parseOwnChoice("{not json", NOW)).toBeNull()
      expect(parseOwnChoice(JSON.stringify({ ...stored, ads: "yes" }), NOW)).toBeNull()
   })

   it("asks again after a version bump", () => {
      const old = { ...stored, version: CONSENT_VERSION - 1 }
      expect(parseOwnChoice(JSON.stringify(old), NOW)).toBeNull()
   })

   it("asks again once the choice is too old", () => {
      const raw = JSON.stringify(stored)
      expect(parseOwnChoice(raw, NOW + CONSENT_MAX_AGE_MS)).toEqual(stored)
      expect(parseOwnChoice(raw, NOW + CONSENT_MAX_AGE_MS + 1)).toBeNull()
   })
})

describe("TCF decisions", () => {
   it("counts only a stored or just-made decision", () => {
      expect(tcfDecided({ eventStatus: "tcloaded" })).toBe(true)
      expect(tcfDecided({ eventStatus: "useractioncomplete" })).toBe(true)
      expect(tcfDecided({ eventStatus: "cmpuishown" })).toBe(false)
      expect(tcfDecided({})).toBe(false)
   })

   it("allows analytics only with every publisher purpose", () => {
      const all = { publisher: { consents: { 1: true, 8: true, 9: true } } }
      const some = { publisher: { consents: { 1: true, 8: true, 9: false } } }
      expect(tcfGrants(all)).toEqual({ analytics: true, ads: true })
      expect(tcfGrants(some)).toEqual({ analytics: false, ads: true })
      expect(tcfGrants({})).toEqual({ analytics: false, ads: true })
   })
})

describe("revoked", () => {
   it("is true only when something granted is taken back", () => {
      const none = { analytics: false, ads: false }
      const all = { analytics: true, ads: true }
      expect(revoked(none, all)).toBe(false)
      expect(revoked(all, all)).toBe(false)
      expect(revoked(all, { analytics: false, ads: true })).toBe(true)
      expect(revoked({ analytics: false, ads: true }, none)).toBe(true)
   })
})
