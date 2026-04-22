import { create } from 'zustand'
import type { AllData } from '@/data/loaders'

interface DataState {
  data: AllData | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error?: string
  setData: (data: AllData) => void
  setStatus: (status: DataState['status'], error?: string) => void
}

export const useDataStore = create<DataState>((set) => ({
  data: null,
  status: 'idle',
  setData: (data) => set({ data, status: 'ready' }),
  setStatus: (status, error) => set({ status, error }),
}))
