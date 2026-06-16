import { useCallback } from 'react'
import * as Comlink from 'comlink'
import { useDataStore } from '@/store/data'
import { useAnalysisStore, type AnalysisStep } from '@/store/analysis'
import { useConstraintStore } from '@/store/constraints'
import { getAnalysisWorker } from '@/lib/analysis-worker'
import { STRINGS } from '@/lib/i18n-strings'
import type { PipelineProgress, PipelineStep } from '@/analysis/pipeline'

const STEP_LABEL: Record<PipelineStep, string> = {
  buffer: STRINGS.pipeline.buffer,
  classify: STRINGS.pipeline.classify,
  cluster: STRINGS.pipeline.cluster,
  route: STRINGS.pipeline.route,
  topology: STRINGS.pipeline.topology,
  demand: STRINGS.pipeline.demand,
  capex: STRINGS.pipeline.capex,
  stats: STRINGS.pipeline.stats,
}

export function useRunAnalysis(): () => Promise<void> {
  const data = useDataStore((s) => s.data)
  const constraints = useConstraintStore((s) => s.features)
  const setStep = useAnalysisStore((s) => s.setStep)
  const setProgress = useAnalysisStore((s) => s.setProgress)
  const setRunning = useAnalysisStore((s) => s.setRunning)
  const commit = useAnalysisStore((s) => s.commit)
  const costAssumptions = useAnalysisStore((s) => s.costAssumptions)
  const budgetIdr = useAnalysisStore((s) => s.budgetIdr)

  return useCallback(async () => {
    if (!data) return
    // Cegah run konkuren (StrictMode double-invoke / klik ganda)
    if (useAnalysisStore.getState().running) return
    setRunning(true)
    setStep('buffer')
    setProgress(0.02, STRINGS.pipeline.buffer)

    const worker = getAnalysisWorker()
    const onProgress = Comlink.proxy((p: PipelineProgress) => {
      setStep(p.step as AnalysisStep)
      setProgress(p.pct, STEP_LABEL[p.step])
    })

    try {
      const res = await worker.runAnalysis(
        {
          poi: data.poi,
          supply: data.supply,
          popSites: data.popSites,
          demandGrid: data.demandGrid,
          roadGraph: data.roadGraph,
          constraints,
          assumptions: costAssumptions,
          budgetIdr,
        },
        onProgress,
      )
      commit({
        result: res.result,
        bufferUnion: res.bufferUnion,
        classifiedPoi: res.classifiedPoi,
        enrichedSupply: res.enrichedSupply,
        clusters: res.clusters,
        topology: res.topology,
        capex: res.capex,
        constraintImpact: res.constraintImpact,
      })
    } catch (err) {
      setRunning(false)
      setStep('idle')
      throw err instanceof Error ? err : new Error('Analisis gagal')
    }
  }, [
    data,
    constraints,
    costAssumptions,
    budgetIdr,
    setStep,
    setProgress,
    setRunning,
    commit,
  ])
}
