import type React from "react"

export type DemoLoader = () => Promise<{ default: React.ComponentType }>

// Used in posts as <Demo name="..." />.
export const demos = {
   "statekit-async-events": () =>
      import("@/components/organism/PostDemo/statekit/AsyncEventsDemo"),
   "statekit-state-flags": () =>
      import("@/components/organism/PostDemo/statekit/StateFlagsDemo"),
   "statekit-rerenders": () =>
      import("@/components/organism/PostDemo/statekit/RerendersDemo"),
   "statekit-infinite-query": () =>
      import("@/components/organism/PostDemo/statekit/InfiniteQueryDemo"),
} satisfies Record<string, DemoLoader>

export type DemoName = keyof typeof demos
