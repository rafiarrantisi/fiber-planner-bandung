import { useEffect } from 'react'
import { loadAll, loadConstraints } from '@/data/loaders'
import { useDataStore } from '@/store/data'
import { useConstraintStore } from '@/store/constraints'

export function useLoadData(): void {
  const setData = useDataStore((s) => s.setData)
  const setStatus = useDataStore((s) => s.setStatus)
  const status = useDataStore((s) => s.status)
  const setConstraints = useConstraintStore((s) => s.setFeatures)

  useEffect(() => {
    if (status !== 'idle') return
    setStatus('loading')
    Promise.all([loadAll(), loadConstraints()])
      .then(([all, constraints]) => {
        setData(all)
        // unionHard tidak dihitung di main thread (mahal). Snap pakai
        // predikat Flatbush di worker; viz hard-block pakai layer constraint.
        setConstraints(constraints, null)
      })
      .catch((err: Error) => setStatus('error', err.message))
  }, [status, setData, setStatus, setConstraints])
}
