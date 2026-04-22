import { create } from 'zustand'
import type { AnalysisResult, Cluster, PoI, SupplyPoint } from '@/types/domain'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

export type AnalysisStep = 'idle' | 'buffer' | 'classify' | 'cluster' | 'stats' | 'done'

interface AnalysisState {
  step: AnalysisStep
  progress: number
  result: AnalysisResult | null
  bufferUnion: Feature<Polygon | MultiPolygon> | null
  classifiedPoi: PoI[]
  enrichedSupply: SupplyPoint[]
  clusters: Cluster[]
  setStep: (s: AnalysisStep) => void
  setProgress: (p: number) => void
  commit: (data: {
    result: AnalysisResult
    bufferUnion: Feature<Polygon | MultiPolygon>
    classifiedPoi: PoI[]
    enrichedSupply: SupplyPoint[]
    clusters: Cluster[]
  }) => void
  reset: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  step: 'idle',
  progress: 0,
  result: null,
  bufferUnion: null,
  classifiedPoi: [],
  enrichedSupply: [],
  clusters: [],
  setStep: (step) => set({ step }),
  setProgress: (progress) => set({ progress }),
  commit: ({ result, bufferUnion, classifiedPoi, enrichedSupply, clusters }) =>
    set({
      result,
      bufferUnion,
      classifiedPoi,
      enrichedSupply,
      clusters,
      step: 'done',
      progress: 1,
    }),
  reset: () =>
    set({
      step: 'idle',
      progress: 0,
      result: null,
      bufferUnion: null,
      classifiedPoi: [],
      enrichedSupply: [],
      clusters: [],
    }),
}))
