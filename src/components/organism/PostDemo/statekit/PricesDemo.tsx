import { DemoButton, DemoRow, useRenderCount } from "@/components/organism/PostDemo/DemoUI"
import { Code } from "@/components/organism/PostDemo/statekit/Code"
import { createMachine, createMachineContext } from "@statekit/react"
import React from "react"

// A portfolio on a machine. Each cell shows a position's value, which reads two
// values, and flashes and counts when it rerenders.

// Made-up tickers, so each cell reads as a holding rather than a bare number.
const tickers = [
   "NOVA", "KLR", "BRIX", "ODEN", "VALE", "QUIX", "MIRA", "TORN", "HALO", "PIKE",
   "ZEPH", "LUMA", "CRUX", "DRAV", "FENN", "GALT", "IRIS", "JUNO", "KITE", "ORBO",
   "PELL", "RUNE", "SALT", "TIDE", "UMBR", "VERA", "WREN", "XENO", "YARD", "ZINC",
]

const COUNT = tickers.length
// Small enough that most values are two or three digits.
const prices = Array.from({ length: COUNT }, (_, i) => 4 + ((i * 37) % 41) + ((i * 13) % 10) / 10)
const shares = Array.from({ length: COUNT }, (_, i) => 3 + ((i * 7) % 17))

const portfolio = createMachine({
   data: { prices, shares },
   events: {
      setPrice: ({ draft }, id: number, price: number) => {
         draft.prices[id] = price
      },
      setShares: ({ draft }, id: number, count: number) => {
         draft.shares[id] = count
      },
   },
})

const [usePortfolio] = createMachineContext(portfolio)

// What the feed did last, and each cell render it caused.
type Update = { event: "setPrice" | "setShares"; id: number; arg: number }

const feed = {
   updates: 0,
   rerenders: 0,
   last: null as Update | null,
   rendered: [] as number[],
   listeners: new Set<() => void>(),
   emit: () => feed.listeners.forEach((listener) => listener()),
}

const round = (n: number) => Math.round(n * 10) / 10

// A feed outside React: mostly price ticks, now and then a fill. Every update
// moves the shown value, so none of them looks like it did nothing.
const tick = () => {
   const id = Math.floor(Math.random() * COUNT)
   const { data } = portfolio
   const count = data.shares[id]
   const old = data.prices[id]

   feed.updates++
   feed.rendered = []

   if (Math.random() < 0.2) {
      const next = count <= 1 || Math.random() < 0.5 ? count + 1 : count - 1
      feed.last = { event: "setShares", id, arg: next }
      portfolio.event.setShares(id, next)
   } else {
      // Up or down by up to 2%, and down near the floor goes up instead.
      const sign = old < 2 || Math.random() < 0.5 ? 1 : -1
      let price = round(old * (1 + (sign * Math.random()) / 50))
      while (Math.round(price * count) === Math.round(old * count)) price = round(price + sign / 10)
      feed.last = { event: "setPrice", id, arg: price }
      portfolio.event.setPrice(id, price)
   }

   // The cells' effects emit once they commit; this catches an update that
   // rerendered nothing, so the counts never hide it.
   setTimeout(feed.emit, 100)
}

const Position = ({ id }: { id: number }) => {
   const m = usePortfolio()
   const price = m.data.prices[id]
   const count = m.data.shares[id]

   const value = Math.round(price * count)

   // Compared with the last committed value, so the flash says which way it moved.
   const last = React.useRef(value)
   // Full class names, so Tailwind's content scan keeps them.
   const move =
      value > last.current
         ? "post-demo-flash-up"
         : value < last.current
         ? "post-demo-flash-down"
         : ""

   // Counts every call after mount, so strict mode's double render shows up too,
   // but its double mount doesn't.
   const mounted = React.useRef(false)
   const rerender = mounted.current
   if (rerender) {
      feed.rerenders++
      feed.rendered.push(id)
   }

   const renders = useRenderCount()
   React.useEffect(() => {
      mounted.current = true
      last.current = value
      if (rerender) feed.emit()
   })

   return (
      <div className="relative py-1 text-xs text-center rounded well tabular-nums font-monospace">
         {/* Re-keyed on every render so the flash replays */}
         <span
            key={renders}
            aria-hidden
            className={`absolute inset-0 rounded post-demo-flash ${move}`}
         />
         <span className="relative block text-[0.65rem] opacity-60">{tickers[id]}</span>
         <span className="relative block">${value.toLocaleString("en-GB")}</span>
      </div>
   )
}

const ids = prices.map((_, i) => i)

const code = `
// The feed, outside React
portfolio.event.setPrice(id, price)

const Position = ({ id }) => {
   const m = usePortfolio()
   const price = m.data.prices[id]
   const shares = m.data.shares[id]
   return <td>{price * shares}</td>
}`

// Reads the feed's counts when they change. It sits outside the grid, so its
// own updates never rerender the cells.
const useFeedCounts = () => {
   const [now, setNow] = React.useState({ updates: 0, rerenders: 0, last: feed.last, rendered: [] as number[] })
   React.useEffect(() => {
      const listener = () =>
         setNow({
            updates: feed.updates,
            rerenders: feed.rerenders,
            last: feed.last,
            rendered: [...feed.rendered],
         })
      listener()
      feed.listeners.add(listener)
      return () => {
         feed.listeners.delete(listener)
      }
   }, [])
   return now
}

const C = (props: React.PropsWithChildren) => (
   <code className="font-monospace text-[0.9em]">{props.children}</code>
)

const Counts = () => {
   const { updates, rerenders } = useFeedCounts()
   const count = (n: number, noun: string) =>
      `${n.toLocaleString("en-GB")} ${noun}${n === 1 ? "" : "s"}`

   return (
      <span className="text-xs tabular-nums opacity-70">
         {count(updates, "update")}, {count(rerenders, "cell rerender")}
      </span>
   )
}

// Says what the last update changed and which cells rerendered for it, from
// what actually rendered rather than what should have.
const LastUpdate = () => {
   const { last, rendered } = useFeedCounts()

   if (!last) {
      return (
         <>
            A feed outside React calls <C>setPrice</C> and <C>setShares</C> on the machine.
         </>
      )
   }

   const { event, id, arg } = last
   const field = event === "setPrice" ? "prices" : "shares"
   const ticker = tickers[id]
   const cells = rendered.filter((r, i) => rendered.indexOf(r) === i)
   const only = cells.length === 1 && cells[0] === id
   // The post's dev-only strict mode toggle renders each update twice.
   const twice = only && rendered.length === 2

   return (
      <>
         <C>
            {event}({id}, {arg})
         </C>{" "}
         changed <C>{`${field}[${id}]`}</C>
         {only ? (
            <>
               , which only {ticker} reads, so only {ticker} rerendered.
               {twice && " Strict mode renders it twice."}
            </>
         ) : cells.length ? (
            <>. Rerendered: {cells.map((r) => tickers[r]).join(", ")}.</>
         ) : (
            <>. No cell rerendered.</>
         )}
      </>
   )
}

// Memoized, so pausing doesn't rerender the cells either.
const Grid = React.memo(() => (
   <div className="grid grid-cols-6 gap-1 content-start">
      {ids.map((id) => (
         <Position key={id} id={id} />
      ))}
   </div>
))

// Runs while it's on screen and not paused.
const useFeed = (ref: React.RefObject<HTMLElement | null>, paused: boolean) => {
   const [visible, setVisible] = React.useState(false)

   React.useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
      if (ref.current) observer.observe(ref.current)
      return () => observer.disconnect()
   }, [ref])

   React.useEffect(() => {
      if (!visible || paused) return
      const interval = setInterval(tick, 900)
      return () => clearInterval(interval)
   }, [visible, paused])
}

const PricesDemo = () => {
   const ref = React.useRef<HTMLDivElement>(null)
   const [paused, setPaused] = React.useState(false)
   useFeed(ref, paused)

   return (
      <div ref={ref} className="grid gap-4">
         <DemoRow className="gap-3" controls>
            <DemoButton onClick={() => setPaused(!paused)}>
               {paused ? "Resume feed" : "Pause feed"}
            </DemoButton>
            <Counts />
         </DemoRow>
         {/* Two lines tall, so the grid doesn't jump when the sentence wraps */}
         <p className="m-0 text-sm min-h-[2.5rem]">
            <LastUpdate />
         </p>
         <div className="grid items-start gap-4 sm:grid-cols-2">
            <Grid />
            <Code>{code}</Code>
         </div>
      </div>
   )
}

export default PricesDemo
