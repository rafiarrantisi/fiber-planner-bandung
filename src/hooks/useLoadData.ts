import { useEffect } from 'react'
import { loadAll } from '@/data/loaders'
import { useDataStore } from '@/store/data'

export function useLoadData(): void {
  const setData = useDataStore((s) => s.setData)
  const setStatus = useDataStore((s) => s.setStatus)
  const status = useDataStore((s) => s.status)

  useEffect(() => {
    if (status !== 'idle') return
    setStatus('loading')
    loadAll()
      .then(setData)
      .catch((err: Error) => setStatus('error', err.message))
  }, [status, setData, setStatus])
}
