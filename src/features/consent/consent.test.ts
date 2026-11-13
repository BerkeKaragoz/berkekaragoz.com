import { createOwnChoice, Grants, TcData } from "./choice"

jest.mock("./config", () => ({
   ...jest.requireActual("./config"),
   ADSENSE_CLIENT: "ca-pub-test",
   GA_MEASUREMENT_ID: "G-TEST",
   CONSENT_NEEDED: true,
}))

type Tcf = { onData?: (data: TcData) => void; onAbsent?: () => void }

jest.mock("./google", () => {
   const tcf: Tcf = {}
   return {
      tcf,
      watchTcf: jest.fn((onData, onAbsent) => {
         tcf.onData = onData
         tcf.onAbsent = onAbsent
         return () => {}
      }),
      hasGoogleChoice: jest.fn(() => false),
      releaseGoogleMessage: jest.fn(),
      openGoogleSettings: jest.fn(),
      startAds: jest.fn(),
      grantAdConsent: jest.fn(),
      startAnalytics: jest.fn(),
      clearAnalyticsCookies: jest.fn(),
   }
})

const STORAGE_KEY = "consent"

/** A fresh consent module, as on a page load. */
const load = async () => {
   jest.resetModules()
   const google = jest.requireMock("./google") as { tcf: Tcf } & Record<string, jest.Mock>
   const { consentMachine, startConsent } = await import("./consent")
   return { google, consentMachine, startConsent }
}

const storeOwnChoice = (grants: Grants) =>
   window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(createOwnChoice(grants, new Date(), "test"))
   )

describe("startConsent", () => {
   let reload: jest.SpyInstance

   beforeEach(() => {
      window.localStorage.clear()
      // jsdom reports a reload as an error: "Not implemented: navigation".
      reload = jest.spyOn(console, "error").mockImplementation(() => {})
   })
   afterEach(() => {
      reload.mockRestore()
   })

   const reloaded = () => reload.mock.calls.some(([error]) => /navigation/.test(String(error)))

   it("applies a choice saved from our banner at once", async () => {
      storeOwnChoice({ analytics: true, ads: true })
      const { google, consentMachine, startConsent } = await load()
      startConsent()
      expect(consentMachine.data).toMatchObject({
         mode: "own",
         decided: true,
         grants: { analytics: true, ads: true },
      })
      expect(google.startAds).toHaveBeenCalledTimes(1)
      expect(google.grantAdConsent).toHaveBeenCalledTimes(1)
      expect(google.startAnalytics).toHaveBeenCalledTimes(1)
      // Still finds out whether Google's message covers the visitor.
      expect(google.watchTcf).toHaveBeenCalledTimes(1)
   })

   it("keeps that choice when Google's tool doesn't cover the visitor", async () => {
      storeOwnChoice({ analytics: false, ads: true })
      const { google, consentMachine, startConsent } = await load()
      startConsent()
      google.tcf.onAbsent?.()
      google.tcf.onData?.({ gdprApplies: false })
      expect(consentMachine.data).toMatchObject({
         mode: "own",
         decided: true,
         grants: { analytics: false, ads: true },
      })
      expect(google.startAds).toHaveBeenCalledTimes(1)
      expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull()
      expect(reloaded()).toBe(false)
   })

   it("hands over to Google's message when it covers the visitor", async () => {
      storeOwnChoice({ analytics: true, ads: true })
      const { google, consentMachine, startConsent } = await load()
      startConsent()
      google.tcf.onData?.({ gdprApplies: true, eventStatus: "cmpuishown" })
      expect(consentMachine.data).toMatchObject({
         mode: "tcf",
         decided: false,
         grants: { analytics: false, ads: false },
      })
      // The next load must not apply our choice again.
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
      expect(google.clearAnalyticsCookies).toHaveBeenCalledTimes(1)
      expect(reloaded()).toBe(true)
   })

   it("hands over without a reload when nothing had started", async () => {
      storeOwnChoice({ analytics: false, ads: false })
      const { google, consentMachine, startConsent } = await load()
      startConsent()
      google.tcf.onData?.({ gdprApplies: true, eventStatus: "cmpuishown" })
      expect(consentMachine.data).toMatchObject({ mode: "tcf", decided: false })
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
      expect(reloaded()).toBe(false)
   })

   it("takes Google's stored decision over ours", async () => {
      storeOwnChoice({ analytics: true, ads: true })
      const { google, consentMachine, startConsent } = await load()
      startConsent()
      // Decided in Google's message, without the analytics purposes.
      google.tcf.onData?.({ gdprApplies: true, eventStatus: "tcloaded" })
      expect(consentMachine.data).toMatchObject({
         mode: "tcf",
         decided: true,
         grants: { analytics: false, ads: true },
      })
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
      expect(reloaded()).toBe(true)
   })

   it("waits for Google's tool when only Google holds a choice", async () => {
      const { google, consentMachine, startConsent } = await load()
      google.hasGoogleChoice.mockReturnValue(true)
      startConsent()
      expect(consentMachine.data).toMatchObject({ mode: "detecting", decided: false })
      expect(google.startAds).not.toHaveBeenCalled()
      google.tcf.onData?.({ gdprApplies: true, eventStatus: "tcloaded" })
      expect(consentMachine.data).toMatchObject({ mode: "tcf", decided: true })
      expect(google.startAds).toHaveBeenCalledTimes(1)
      // Google's tags read the TC string; "ads" here isn't the visitor's answer.
      expect(google.grantAdConsent).not.toHaveBeenCalled()
   })

   it("keeps a decision made in Google's message when its settings reopen", async () => {
      const { google, consentMachine, startConsent } = await load()
      google.hasGoogleChoice.mockReturnValue(true)
      startConsent()
      google.tcf.onData?.({ gdprApplies: true, eventStatus: "tcloaded" })
      google.tcf.onData?.({ gdprApplies: true, eventStatus: "cmpuishown" })
      expect(consentMachine.data).toMatchObject({ mode: "tcf", decided: true })
      expect(reloaded()).toBe(false)
   })

   it("does nothing on load for a visitor with no choice", async () => {
      const { google, consentMachine, startConsent } = await load()
      startConsent()
      expect(consentMachine.data).toMatchObject({ mode: "detecting", decided: false })
      expect(google.watchTcf).not.toHaveBeenCalled()
      expect(google.startAds).not.toHaveBeenCalled()
   })
})
