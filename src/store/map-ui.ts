import { create } from 'zustand'

interface FlyTarget {
  lat: number
  lng: number
  zoom?: number
  id: string
}

interface MapUiState {
  flyTarget: FlyTarget | null
  flyTo: (t: FlyTarget) => void
}

export const useMapUiStore = create<MapUiState>((set) => ({
  flyTarget: null,
  flyTo: (flyTarget) => set({ flyTarget }),
}))
