import { create } from 'zustand'
import type {
  AnalysisResult,
  CapexSummary,
  Cluster,
  ConstraintImpact,
  CostAssumptions,
  NetworkTopology,
  PoI,
  SupplyPoint,
} from '@/types/domain'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import {
  DEFAULT_CAPEX_BUDGET_IDR,
  DEFAULT_COST_ASSUMPTIONS,
} from '@/lib/constants'

export type AnalysisStep =
  | 'idle'
  | 'buffer'
  | 'classify'
  | 'cluster'
  | 'route'
  | 'topology'
  | 'demand'
  | 'capex'
  | 'stats'
  | 'done'

export type PhaseFilter = 1 | 2 | 3 | 'all'

interface CommitPayload {
  result: AnalysisResult
  bufferUnion: Feature<Polygon | MultiPolygon>
  classifiedPoi: PoI[]
  enrichedSupply: SupplyPoint[]
  clusters: Cluster[]
  // v2 (opsional — diisi saat pipeline lengkap berjalan)
  topology?: NetworkTopology | null
  capex?: CapexSummary | null
  constraintImpact?: ConstraintImpact | null
}

interface AnalysisState {
  step: AnalysisStep
  progress: number
  progressLabel: string
  running: boolean
  result: AnalysisResult | null
  bufferUnion: Feature<Polygon | MultiPolygon> | null
  classifiedPoi: PoI[]
  enrichedSupply: SupplyPoint[]
  clusters: Cluster[]

  // ── v2: topologi, ekonomi, constraint impact ──
  topology: NetworkTopology | null
  capex: CapexSummary | null
  constraintImpact: ConstraintImpact | null

  // ── v2: kontrol pengguna (slider, fase, asumsi) ──
  budgetIdr: number
  activePhaseFilter: PhaseFilter
  costAssumptions: CostAssumptions

  setStep: (s: AnalysisStep) => void
  setProgress: (p: number, label?: string) => void
  setRunning: (running: boolean) => void
  commit: (data: CommitPayload) => void
  setBudget: (idr: number) => void
  setActivePhase: (p: PhaseFilter) => void
  updateCostAssumption: (key: keyof CostAssumptions, val: number) => void
  /** Update fase hasil tanpa re-run pipeline (re-phasing murah). */
  rephase: (clusters: Cluster[], capex: CapexSummary) => void
  reset: () => void
}

const clearedResults = {
  step: 'idle' as AnalysisStep,
  progress: 0,
  progressLabel: '',
  running: false,
  result: null,
  bufferUnion: null,
  classifiedPoi: [] as PoI[],
  enrichedSupply: [] as SupplyPoint[],
  clusters: [] as Cluster[],
  topology: null,
  capex: null,
  constraintImpact: null,
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...clearedResults,
  budgetIdr: DEFAULT_CAPEX_BUDGET_IDR,
  activePhaseFilter: 'all',
  costAssumptions: { ...DEFAULT_COST_ASSUMPTIONS },

  setStep: (step) => set({ step }),
  setProgress: (progress, label) =>
    set((s) => ({ progress, progressLabel: label ?? s.progressLabel })),
  setRunning: (running) => set({ running }),
  commit: ({
    result,
    bufferUnion,
    classifiedPoi,
    enrichedSupply,
    clusters,
    topology = null,
    capex = null,
    constraintImpact = null,
  }) =>
    set({
      result,
      bufferUnion,
      classifiedPoi,
      enrichedSupply,
      clusters,
      topology,
      capex,
      constraintImpact,
      step: 'done',
      progress: 1,
      running: false,
    }),
  setBudget: (budgetIdr) => set({ budgetIdr }),
  setActivePhase: (activePhaseFilter) => set({ activePhaseFilter }),
  updateCostAssumption: (key, val) =>
    set((s) => ({ costAssumptions: { ...s.costAssumptions, [key]: val } })),
  rephase: (clusters, capex) => set({ clusters, capex }),
  reset: () => set({ ...clearedResults }),
}))
