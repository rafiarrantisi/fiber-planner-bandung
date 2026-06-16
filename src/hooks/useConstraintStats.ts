import { useMemo } from 'react'
import { useDataStore } from '@/store/data'
import { useConstraintStore } from '@/store/constraints'
import { buildIndex, countPoiInRestricted } from '@/analysis/constraints'

export interface ConstraintStats {
  loaded: boolean
  hardCount: number
  softCount: number
  poiInRestricted: number
  totalPoi: number
}

/** Statistik ringkas constraint (dipakai KPI Fase 1; tak butuh run analysis). */
export function useConstraintStats(): ConstraintStats {
  const features = useConstraintStore((s) => s.features)
  const poi = useDataStore((s) => s.data?.poi)

  return useMemo<ConstraintStats>(() => {
    if (features.length === 0 || !poi) {
      return {
        loaded: features.length > 0,
        hardCount: 0,
        softCount: 0,
        poiInRestricted: 0,
        totalPoi: poi?.length ?? 0,
      }
    }
    const idx = buildIndex(features)
    const hardCount = features.filter((f) => f.properties.severity === 'hard').length
    return {
      loaded: true,
      hardCount,
      softCount: features.length - hardCount,
      poiInRestricted: countPoiInRestricted(poi, idx),
      totalPoi: poi.length,
    }
  }, [features, poi])
}
