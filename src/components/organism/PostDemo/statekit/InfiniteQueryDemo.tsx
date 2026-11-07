import { cn } from "@shortkit/cn"
import { DemoButton, DemoRow } from "@/components/organism/PostDemo/DemoUI"
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

type Post = { id: number; title: string; author: string; minutes: number }

// A blog's feed, three pages of three posts.
const posts: Post[] = [
   ["Moving to pnpm workspaces", "Elif Demir", 6],
   ["A year of feature flags", "Jonas Weber", 9],
   ["Hunting a memory leak in Node", "Priya Natarajan", 7],
   ["Empty states that help", "Marta Silva", 4],
   ["Postgres indexes, in practice", "Kenji Ito", 12],
   ["Dark mode without a flash", "Ada Okafor", 5],
   ["Retries and idempotency keys", "Lucas Moreau", 8],
   ["Testing React components", "Sara Lindqvist", 6],
   ["SQLite in production", "Omar Haddad", 10],
].map(([title, author, minutes], i) => ({
   id: i + 1,
   title: title as string,
   author: author as string,
   minutes: minutes as number,
}))

const PAGE_SIZE = 3
const LAST_PAGE = posts.length / PAGE_SIZE - 1

let failNextRequest = false

// The fake API: slow on purpose, and told by a button to fail once.
const getPosts = async (page: number) => {
   await new Promise((resolve) => setTimeout(resolve, 900))

   if (failNextRequest) {
      failNextRequest = false
      throw new Error("503 Service Unavailable")
   }

   return {
      items: posts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
      nextCursor: page < LAST_PAGE ? page + 1 : null,
   }
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

const useFlags = () => {
   const m = useFeedMachine()
   const on = (state: number) => (m.state & state) !== 0

   return {
      m,
      loading: on(m.STATE.loading),
      loadingMore: on(m.STATE.loadingMore),
      ready: on(m.STATE.ready),
      failed: on(m.STATE.failed),
      pages: m.data.posts.length / PAGE_SIZE,
   }
}

const C: React.FC<React.PropsWithChildren> = (props) => (
   <code className="font-monospace text-[0.9em]">{props.children}</code>
)

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`

// What the feed's component renders from m.data and the states.
const Feed = () => {
   const { m, loading, loadingMore, failed } = useFlags()
   const { posts, hasMore, error } = m.data
   const status = "px-3 py-2 text-sm"

   if (!posts.length)
      return <p className={cn(status, "opacity-60")}>Loading posts…</p>

   return (
      <ol className="grid p-0 m-0 list-none">
         {posts.map((post) => (
            <li
               key={post.id}
               className={cn(
                  "px-3 py-1.5 transition-opacity",
                  loading && "opacity-50"
               )}
            >
               <span className="block text-sm">{post.title}</span>
               <span className="block text-xs opacity-60">
                  {post.author} · {post.minutes} min read
               </span>
            </li>
         ))}
         {loading ? (
            <li className={cn(status, "opacity-60")}>Reloading every page…</li>
         ) : loadingMore ? (
            <li className={cn(status, "opacity-60")}>Loading more…</li>
         ) : failed && error ? (
            <li className={cn(status, "text-red-700 dark:text-red-300")}>
               Couldn&apos;t load more posts: {error.message}
            </li>
         ) : (
            !hasMore && (
               <li className={cn(status, "opacity-60")}>That&apos;s every post.</li>
            )
         )}
      </ol>
   )
}

type Action = "fetch" | "next" | "fail" | "refetch"

// What just happened, and which states and fields of m.data it changed.
const Says = (props: { action: Action; retried: boolean }) => {
   const { m, loading, loadingMore, ready, failed, pages } = useFlags()
   const { posts, hasMore } = m.data

   if (!posts.length)
      return (
         <>
            <C>fetch()</C> is loading the first page, in <C>loading</C>. <C>posts</C>{" "}
            is still empty.
         </>
      )

   if (loading)
      return (
         <>
            <C>refetch()</C> is reloading all {pages} pages, one after another from
            the first, in <C>loading</C>. The posts stay until the new pages replace
            them.
         </>
      )

   if (loadingMore)
      return (
         <>
            <C>fetchNextPage()</C> is loading page {pages + 1}, in <C>loadingMore</C>
            .{" "}
            {ready ? (
               <>
                  The machine is still in <C>ready</C>: the {posts.length} posts
                  already there stay on screen.
               </>
            ) : (
               <>
                  It&apos;s still in <C>failed</C>, and <C>error</C> is kept, until
                  the page arrives.
               </>
            )}
         </>
      )

   if (failed)
      return (
         <>
            Page {pages + 1} failed. <C>ready</C> gave way to <C>failed</C>,{" "}
            <C>error</C> holds the <C>Error</C>, and the {posts.length} posts already
            there stay. Loading the next page asks for page {pages + 1} again.
         </>
      )

   if (props.action === "refetch")
      return (
         <>
            <C>refetch()</C> reloaded all {pages} pages, from the first, and replaced{" "}
            <C>posts</C> with them.
         </>
      )

   if (pages === 1)
      return (
         <>
            The first page arrived. <C>posts</C> holds its {posts.length} posts, the
            machine is in <C>ready</C>, and <C>hasMore</C> is <C>true</C> because the
            page&apos;s <C>nextCursor</C> isn&apos;t <C>null</C>.
         </>
      )

   const arrived = `Page ${pages} arrived${props.retried ? " on the second try" : ""}`
   const recovered = props.retried && (
      <>
         {" "}
         <C>failed</C> gave way to <C>ready</C>, and <C>error</C> is <C>null</C>{" "}
         again.
      </>
   )

   if (!hasMore)
      return (
         <>
            {arrived} and was the last: its <C>nextCursor</C> is <C>null</C>, so{" "}
            <C>hasMore</C> is <C>false</C>.{recovered} <C>fetchNextPage()</C> does
            nothing now.
         </>
      )

   return (
      <>
         {arrived}. Its posts were added to the end of <C>posts</C>, one flat list of
         all {pages} pages.{recovered}
      </>
   )
}

// The states the decoration moves through. Idle only lasts until the first
// fetch starts, so it gets no light.
const lights = [
   { name: "loading", tone: "busy" },
   { name: "loadingMore", tone: "busy" },
   { name: "ready", tone: "success" },
   { name: "failed", tone: "danger" },
] as const

const toneClass = {
   busy: "border-primary-500 bg-primary-500/20 text-primary-700 dark:text-primary-200",
   success:
      "border-green-600 bg-green-500/15 text-green-800 dark:border-green-400 dark:text-green-200",
   danger:
      "border-red-600 bg-red-500/15 text-red-800 dark:border-red-400 dark:text-red-200",
}

// A field's value, flashing when it changes, but not when it mounts.
const Value = (props: { children: string }) => {
   const last = React.useRef(props.children)
   const changed = React.useRef(false)
   if (last.current !== props.children) {
      last.current = props.children
      changed.current = true
   }

   return (
      <span
         key={props.children}
         className={cn("px-1 -mx-1 rounded", changed.current && "post-demo-flash")}
      >
         {props.children}
      </span>
   )
}

const Readout = () => {
   const { m, pages } = useFlags()
   const { posts, hasMore, error } = m.data
   const label = "text-xs opacity-60 font-monospace"

   return (
      <div className="grid gap-2.5 text-xs font-monospace">
         <div className="flex flex-wrap gap-1">
            {lights.map(({ name, tone }) => (
               <span
                  key={name}
                  className={cn(
                     "px-2 py-0.5 rounded-full border transition-colors",
                     (m.state & m.STATE[name]) !== 0
                        ? toneClass[tone]
                        : "border-background-300 dark:border-background-600 opacity-50"
                  )}
               >
                  {name}
               </span>
            ))}
         </div>
         <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 m-0">
            <dt className={label}>m.data.posts</dt>
            <dd className="m-0">
               <Value>
                  {posts.length
                     ? `${plural(posts.length, "post")}, from ${plural(pages, "page")}`
                     : "[]"}
               </Value>
            </dd>
            <dt className={label}>m.data.hasMore</dt>
            <dd className="m-0">
               <Value>{String(hasMore)}</Value>
            </dd>
            <dt className={label}>m.data.error</dt>
            <dd className="m-0 break-words">
               <Value>{error ? `Error: ${error.message}` : "null"}</Value>
            </dd>
         </dl>
      </div>
   )
}

const InfiniteQueryDemo = () => {
   const { m, loading, loadingMore, failed } = useFlags()
   const busy = loading || loadingMore || !m.data.posts.length
   const [action, setAction] = React.useState<Action>("fetch")
   const [retried, setRetried] = React.useState(false)

   // The feed loads its first page when it mounts, like the post's code.
   React.useEffect(() => {
      if (!feedMachine.data.posts.length) void feedMachine.event.fetch()
   }, [])

   const run = (next: Action) => () => {
      failNextRequest = next === "fail"
      setRetried(next === "next" && failed)
      setAction(next)
      void (next === "refetch" ? m.event.refetch() : m.event.fetchNextPage())
   }

   const detail = (text: string) => (
      <span className="ml-1.5 text-xs opacity-60 font-monospace">{text}</span>
   )

   return (
      <div className="grid gap-4">
         <DemoRow controls>
            <DemoButton disabled={busy || !m.data.hasMore} onClick={run("next")}>
               Load the next page{detail("fetchNextPage()")}
            </DemoButton>
            <DemoButton disabled={busy || !m.data.hasMore} onClick={run("fail")}>
               A next page that fails
            </DemoButton>
            <DemoButton disabled={busy} onClick={run("refetch")}>
               Reload every page{detail("refetch()")}
            </DemoButton>
         </DemoRow>
         <div className="grid items-start gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
               <span className="text-xs opacity-60 font-monospace">
                  &lt;Feed /&gt;
               </span>
               <div className="py-1.5 well min-h-[10rem]">
                  <Feed />
               </div>
            </div>
            <div className="grid order-first gap-4 sm:order-none sm:pt-5">
               <p aria-live="polite" className="m-0 text-sm">
                  <Says action={action} retried={retried} />
               </p>
               <Readout />
            </div>
         </div>
      </div>
   )
}

export default InfiniteQueryDemo
