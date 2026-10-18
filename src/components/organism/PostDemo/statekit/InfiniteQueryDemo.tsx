import {
   DemoButton,
   DemoRow,
   DemoStates,
} from "@/components/organism/PostDemo/DemoUI"
import {
   setTanstackQueryClient,
   withTanstackInfiniteQuery,
} from "@statekit/decoration-tanstack-query"
import {
   createMachine,
   createMachineConfig,
   createMachineContext,
} from "@statekit/react"
import { QueryClient } from "@tanstack/query-core"
import React from "react"

type Post = { id: number; title: string }

const PAGE_SIZE = 3
const LAST_PAGE = 3

let failNextRequest = false

const getPosts = async (page: number) => {
   await new Promise((resolve) => setTimeout(resolve, 700))

   if (failNextRequest) {
      failNextRequest = false
      throw new Error("The server answered 503")
   }

   const items: Post[] = Array.from({ length: PAGE_SIZE }, (_, i) => {
      const id = page * PAGE_SIZE + i + 1
      return { id, title: `Post #${id}` }
   })

   return { items, nextCursor: page < LAST_PAGE ? page + 1 : null }
}

setTanstackQueryClient(new QueryClient())

const feedConfig = createMachineConfig({
   states: ["idle", "loading", "loadingMore", "ready", "failed"],
   data: {
      posts: [] as Post[],
      hasMore: true,
      error: null as Error | null,
   },
})

const feedMachine = createMachine(
   withTanstackInfiniteQuery(feedConfig, {
      initialPageParam: 0,
      queryFn: ({ pageParam }) => getPosts(pageParam),
      into: (d) => d.posts,
   })
)

const [useFeedMachine] = createMachineContext(feedMachine)

const InfiniteQueryDemo = () => {
   const m = useFeedMachine()
   const [failNext, setFailNext] = React.useState(false)
   const has = (state: number) => (m.state & state) !== 0
   const isBusy = has(m.STATE.loading) || has(m.STATE.loadingMore)

   React.useEffect(() => void feedMachine.event.fetch(), [])

   const run = (event: () => Promise<unknown>) => () => {
      failNextRequest = failNext
      setFailNext(false)
      void event()
   }

   return (
      <div className="grid grid-cols-1 gap-4">
         <DemoRow>
            <DemoButton
               disabled={isBusy || !m.data.hasMore}
               onClick={run(m.event.fetchNextPage)}
            >
               {m.data.hasMore ? "fetchNextPage" : "No more pages"}
            </DemoButton>
            <DemoButton disabled={isBusy} onClick={run(m.event.refetch)}>
               refetch
            </DemoButton>
            <label className="flex items-center gap-2 text-sm">
               <input
                  type="checkbox"
                  checked={failNext}
                  onChange={(e) => setFailNext(e.target.checked)}
               />
               Fail the next request
            </label>
         </DemoRow>
         <div className="grid grid-cols-1 gap-2">
            <DemoStates
               state={m.state}
               STATE={m.STATE}
               names={["loading", "loadingMore", "ready", "failed"]}
            />
            <p className="font-monospace text-sm">
               data.hasMore: {String(m.data.hasMore)}, data.error:{" "}
               {m.data.error ? m.data.error.message : "null"}
            </p>
         </div>
         <ol className="grid grid-cols-1 gap-1 p-2 m-0 text-sm list-none card-backdrop min-h-[4rem]">
            {m.data.posts.map((post) => (
               <li key={post.id} className="font-monospace">
                  {post.title}
               </li>
            ))}
            {has(m.STATE.loading) && !m.data.posts.length && (
               <li className="opacity-60">Loading the first page…</li>
            )}
            {has(m.STATE.loadingMore) && (
               <li className="opacity-60">Loading the next page…</li>
            )}
         </ol>
      </div>
   )
}

export default InfiniteQueryDemo
