import type { WorkerIn, WorkerOut } from "./types"
import { createWorkerCore } from "./workerCore"

// tsconfig's lib has no WebWorker, and pulling it in with a triple-slash
// reference would leak worker globals into the whole program, so type the two
// members used here locally.
interface WorkerScope {
   postMessage(msg: WorkerOut, transfer: Transferable[]): void
   onmessage: ((event: MessageEvent<WorkerIn>) => void) | null
}

const ctx = self as unknown as WorkerScope

const core = createWorkerCore((msg, transfer) => ctx.postMessage(msg, transfer ?? []))

ctx.onmessage = (event) => core.handle(event.data)
