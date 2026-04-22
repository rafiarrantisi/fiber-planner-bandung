import { create } from 'zustand'
import type { City, PoICategory } from '@/types/domain'

export type FoStatusFilter = 'ALL' | 'FO_READY' | 'NON_FO'

export interface LayerToggles {
  boundary: boolean
  buffer: boolean
  fiber: boolean
  supply: boolean
  poi: boolean
  clusters: boolean
}

interface FiltersState {
  layers: LayerToggles
  categories: Set<PoICategory>
  foStatus: FoStatusFilter
  cities: Set<City>
  toggleLayer: (k: keyof LayerToggles) => void
  toggleCategory: (c: PoICategory) => void
  setFoStatus: (s: FoStatusFilter) => void
  toggleCity: (c: City) => void
  resetFilters: () => void
}

const ALL_CATEGORIES: PoICategory[] = [
  'PENDIDIKAN',
  'KESEHATAN',
  'PEMERINTAHAN',
  'NIAGA',
  'LAYANAN_POS',
  'MENARA_NON_FIBER',
]

const ALL_CITIES: City[] = ['KOTA_BANDUNG', 'KOTA_CIMAHI', 'KAB_BANDUNG_BARAT']

export const useFiltersStore = create<FiltersState>((set) => ({
  layers: {
    boundary: true,
    buffer: false,
    fiber: true,
    supply: true,
    poi: true,
    clusters: true,
  },
  categories: new Set(ALL_CATEGORIES),
  foStatus: 'ALL',
  cities: new Set(ALL_CITIES),
  toggleLayer: (k) =>
    set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  toggleCategory: (c) =>
    set((s) => {
      const next = new Set(s.categories)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return { categories: next }
    }),
  setFoStatus: (foStatus) => set({ foStatus }),
  toggleCity: (c) =>
    set((s) => {
      const next = new Set(s.cities)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return { cities: next }
    }),
  resetFilters: () =>
    set({
      categories: new Set(ALL_CATEGORIES),
      foStatus: 'ALL',
      cities: new Set(ALL_CITIES),
    }),
}))
