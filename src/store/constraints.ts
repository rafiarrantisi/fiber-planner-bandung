import { create } from 'zustand'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { ConstraintCategory, ConstraintFeature } from '@/types/domain'
import { CONSTRAINT_CATEGORY_LABELS } from '@/types/domain'

export type ConstraintSeverityFilter = 'all' | 'hard' | 'soft'

const ALL_CONSTRAINT_CATEGORIES = Object.keys(
  CONSTRAINT_CATEGORY_LABELS,
) as ConstraintCategory[]

interface ConstraintState {
  features: ConstraintFeature[]
  /** Union seluruh poligon severity="hard" (untuk reject snap & visual). */
  unionHard: Feature<Polygon | MultiPolygon> | null
  visibleCategories: Set<ConstraintCategory>
  severityFilter: ConstraintSeverityFilter
  loaded: boolean
  setFeatures: (
    features: ConstraintFeature[],
    unionHard: Feature<Polygon | MultiPolygon> | null,
  ) => void
  toggleCategory: (cat: ConstraintCategory) => void
  setSeverityFilter: (f: ConstraintSeverityFilter) => void
}

export const useConstraintStore = create<ConstraintState>((set) => ({
  features: [],
  unionHard: null,
  visibleCategories: new Set(ALL_CONSTRAINT_CATEGORIES),
  severityFilter: 'all',
  loaded: false,
  setFeatures: (features, unionHard) =>
    set({ features, unionHard, loaded: true }),
  toggleCategory: (cat) =>
    set((s) => {
      const next = new Set(s.visibleCategories)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return { visibleCategories: next }
    }),
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
}))
