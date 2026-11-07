// The only file with import.meta: Jest (babel-jest, CommonJS) cannot parse it,
// so every test that imports engine.ts mocks this module.
export const createPitchWorker = (): Worker =>
   new Worker(new URL("./pitch.worker.ts", import.meta.url))
