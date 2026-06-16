import { create } from 'zustand'

interface FlyTarget {
  lat: number
  lng: number
  zoom?: number
  id: string
}

/** Layer v2 (constraint-aware engine). Terpisah dari toggle dasar di useFiltersStore. */
export interface V2LayerToggles {
  showConstraints: boolean
  showFeeder: boolean
  showDemandHeat: boolean
  showPhaseColors: boolean
  showRoadGraphDebug: boolean
  showRerouteFlags: boolean
}

export type DemandHeatMode = 'household' | 'whitespace'

interface MapUiState {
  flyTarget: FlyTarget | null
  flyTo: (t: FlyTarget) => void
  v2Layers: V2LayerToggles
  toggleV2Layer: (k: keyof V2LayerToggles) => void
  demandHeatMode: DemandHeatMode
  setDemandHeatMode: (m: DemandHeatMode) => void
}

export const useMapUiStore = create<MapUiState>((set) => ({
  flyTarget: null,
  flyTo: (flyTarget) => set({ flyTarget }),
  v2Layers: {
    showConstraints: true,
    showFeeder: true,
    showDemandHeat: false,
    showPhaseColors: false,
    showRoadGraphDebug: false,
    showRerouteFlags: true,
  },
  toggleV2Layer: (k) =>
    set((s) => ({ v2Layers: { ...s.v2Layers, [k]: !s.v2Layers[k] } })),
  demandHeatMode: 'whitespace',
  setDemandHeatMode: (demandHeatMode) => set({ demandHeatMode }),
}))
