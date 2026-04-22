import { useMemo } from 'react'
import { useFiltersStore } from '@/store/filters'
import type { PoI, SupplyPoint, FiberCable } from '@/types/domain'

export function useFilteredPoI(poi: PoI[]): PoI[] {
  const categories = useFiltersStore((s) => s.categories)
  const foStatus = useFiltersStore((s) => s.foStatus)
  const cities = useFiltersStore((s) => s.cities)

  return useMemo(
    () =>
      poi.filter((p) => {
        if (!cities.has(p.city)) return false
        if (!categories.has(p.category)) return false
        if (foStatus === 'FO_READY' && p.foStatus !== 'FO_READY') return false
        if (foStatus === 'NON_FO' && p.foStatus !== 'NON_FO') return false
        return true
      }),
    [poi, categories, foStatus, cities],
  )
}

export function useFilteredSupply(supply: SupplyPoint[]): SupplyPoint[] {
  const cities = useFiltersStore((s) => s.cities)
  return useMemo(() => supply.filter((s) => cities.has(s.city)), [supply, cities])
}

export function useFilteredCables(cables: FiberCable[]): FiberCable[] {
  const cities = useFiltersStore((s) => s.cities)
  return useMemo(() => cables.filter((c) => cities.has(c.city)), [cables, cities])
}
