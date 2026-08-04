import { checkRandomTextAvailable } from "./randomText"

describe("Wikipedia passage availability", () => {
   afterEach(() => {
      Reflect.deleteProperty(global, "fetch")
   })

   it("checks site availability without requesting article text", async () => {
      const fetchMock = jest.fn().mockResolvedValue({
         json: async () => ({ query: { general: {} } }),
         ok: true,
      } as Response)
      global.fetch = fetchMock

      await checkRandomTextAvailable(new AbortController().signal)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const url = String(fetchMock.mock.calls[0][0])
      expect(url).toContain("meta=siteinfo")
      expect(url).not.toContain("generator=random")
      expect(url).not.toContain("prop=categories")
   })
})
