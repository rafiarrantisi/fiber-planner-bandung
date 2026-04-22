import { useCallback } from 'react'
import { useDataStore } from '@/store/data'
import { useAnalysisStore } from '@/store/analysis'
import { buildSupplyBufferUnion } from '@/analysis/buffer'
import { classifyPoI } from '@/analysis/spatial-join'
import { recursiveKMeansByCity } from '@/analysis/kmeans-recursive'
import { computeStats } from '@/analysis/stats'

async function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

export function useRunAnalysis() {
  const data = useDataStore((s) => s.data)
  const setStep = useAnalysisStore((s) => s.setStep)
  const setProgress = useAnalysisStore((s) => s.setProgress)
  const commit = useAnalysisStore((s) => s.commit)

  return useCallback(async () => {
    if (!data) return

    setStep('buffer')
    setProgress(0.1)
    await nextFrame()
    const bufferUnion = buildSupplyBufferUnion(data.supply)

    setStep('classify')
    setProgress(0.35)
    await nextFrame()
    const { classifiedPoi, enrichedSupply } = classifyPoI(
      data.poi,
      data.supply,
      bufferUnion,
    )

    setStep('cluster')
    setProgress(0.6)
    await nextFrame()
    const nonFo = classifiedPoi.filter((p) => p.foStatus === 'NON_FO')
    const { clusters, enrichedPoi } = recursiveKMeansByCity(nonFo, data.supply)

    const clusterIdByPoi = new Map(
      enrichedPoi.map((p) => [p.id, p.clusterId] as const),
    )
    const finalPoi = classifiedPoi.map((p) => ({
      ...p,
      clusterId: clusterIdByPoi.get(p.id),
    }))

    setStep('stats')
    setProgress(0.85)
    await nextFrame()
    const result = computeStats(finalPoi, clusters)

    commit({
      result,
      bufferUnion,
      classifiedPoi: finalPoi,
      enrichedSupply,
      clusters,
    })
  }, [data, setStep, setProgress, commit])
}
