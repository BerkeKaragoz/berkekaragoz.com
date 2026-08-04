import { extractReadableDevText } from "./randomText"

describe("IPA random practice text", () => {
   it("keeps readable prose while removing code and utility content", () => {
      const text = extractReadableDevText(`
         <p>This week I tried replacing my usual morning routine with a long walk through the park. I noticed sounds, colours, and small details that I normally miss.</p>
         <pre><code>const answer = await fetch('/api')</code></pre>
         <p>By the time I reached home, the problem I had been worrying about felt much easier to understand. Stepping away gave me room to think clearly.</p>
         <p>Thanks for reading and follow me for more posts.</p>
      `)

      expect(text).toContain("This week I tried")
      expect(text).toContain("Stepping away")
      expect(text).not.toContain("const answer")
      expect(text).not.toContain("follow me")
   })

   it("rejects extracts without enough English prose", () => {
      expect(() =>
         extractReadableDevText(`
            <p>Short text.</p>
            <p>Bugün hava güzel olduğu için dışarı çıkıp uzun bir yürüyüş yaptım ve eve döndüğümde kendimi çok daha iyi hissettim.</p>
         `)
      ).toThrow()
   })
})
