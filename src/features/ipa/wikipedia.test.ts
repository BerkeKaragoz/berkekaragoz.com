import {
   extractWikipediaPassage,
   parseWikipediaCandidates,
   rankWikipediaCandidates,
} from "./wikipedia"

const prose = (subject: string) =>
   `${subject} changes how the system works because each part responds to the parts around it. The process creates visible results that are easy to notice and explain. `.repeat(
      2
   )

describe("Wikipedia practice passages", () => {
   it("rejects biographies, lists, and disambiguation pages", () => {
      const candidates = parseWikipediaCandidates({
         query: {
            pages: [
               {
                  categories: [{ title: "Category:Optical phenomena" }],
                  extract: prose("The effect"),
                  pageid: 1,
                  title: "Interesting effect",
               },
               {
                  categories: [{ title: "Category:Living people" }],
                  extract: prose("A person"),
                  pageid: 2,
                  title: "A Person",
               },
               {
                  extract: prose("The entries"),
                  pageid: 3,
                  title: "List of objects",
               },
               {
                  categories: [{ title: "Category:Basketball seasons" }],
                  extract: prose("The competition"),
                  pageid: 5,
                  title: "A sports season",
               },
               {
                  extract: prose("The term"),
                  pageid: 4,
                  pageprops: { disambiguation: "" },
                  title: "Ambiguous term",
               },
            ],
         },
      })

      expect(candidates.map(({ pageid }) => pageid)).toEqual([1])
   })

   it("favours explanatory topics while retaining some variety", () => {
      const candidates = parseWikipediaCandidates({
         query: {
            pages: [
               {
                  categories: [{ title: "Category:Villages" }],
                  extract: prose("The village"),
                  pageid: 1,
                  title: "Quiet village",
               },
               {
                  categories: [{ title: "Category:Animal behavior" }],
                  extract: prose("The animal behaviour"),
                  pageid: 2,
                  title: "Animal behaviour",
               },
            ],
         },
      })

      expect(rankWikipediaCandidates(candidates, () => 0)[0].pageid).toBe(2)
   })

   it("uses an explanatory internal section, not the lead or references", () => {
      const value = {
         parse: {
            text: `
               <div class="mw-parser-output">
                  <p>${prose("The lead")}</p>
                  <h2>History</h2>
                  <p>${prose("In 1842 the inventor")}</p>
                  <h2>How it works</h2>
                  <p>${prose("Air pressure")}</p>
                  <h2>References</h2>
                  <p>${prose("The reference list")}</p>
               </div>
            `,
         },
      }

      const passage = extractWikipediaPassage(value, () => 0)
      expect(passage).toContain("Air pressure")
      expect(passage).not.toContain("The lead")
      expect(passage).not.toContain("reference list")
      expect(passage?.length).toBeLessThanOrEqual(1200)
   })
})
