import * as Comlink from 'comlink'
import type { AnalysisWorkerApi } from '@/workers/analysis.worker'

let worker: Worker | null = null
let proxy: Comlink.Remote<AnalysisWorkerApi> | null = null

/** Singleton proxy ke Web Worker analisis (routing/pipeline). */
export function getAnalysisWorker(): Comlink.Remote<AnalysisWorkerApi> {
  if (!proxy) {
    worker = new Worker(
      new URL('../workers/analysis.worker.ts', import.meta.url),
      { type: 'module' },
    )
    proxy = Comlink.wrap<AnalysisWorkerApi>(worker)
  }
  return proxy
}

export function terminateAnalysisWorker(): void {
  worker?.terminate()
  worker = null
  proxy = null
}
