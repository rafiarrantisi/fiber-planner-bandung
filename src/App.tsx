import { useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MapView } from '@/components/map/MapView'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { RunAnalysisDialog } from '@/components/analysis/RunAnalysisDialog'
import { Hero } from '@/components/landing/Hero'
import { AboutModal } from '@/components/landing/AboutModal'
import { MethodologySection } from '@/components/landing/MethodologySection'
import { STRINGS } from '@/lib/i18n-strings'
import { useLoadData } from '@/hooks/useLoadData'
import { useDataStore } from '@/store/data'
import { useAnalysisStore } from '@/store/analysis'
import { useMapUiStore } from '@/store/map-ui'
import type { Cluster } from '@/types/domain'

function App() {
  useLoadData()
  const status = useDataStore((s) => s.status)
  const error = useDataStore((s) => s.error)
  const analysisStep = useAnalysisStore((s) => s.step)
  const resetAnalysis = useAnalysisStore((s) => s.reset)
  const flyTo = useMapUiStore((s) => s.flyTo)

  const [runOpen, setRunOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  const analysisDone = analysisStep === 'done'

  const handleFocusCluster = (c: Cluster) => {
    flyTo({ lat: c.centroid.lat, lng: c.centroid.lng, zoom: 15, id: c.id })
  }

  const handleRun = () => {
    if (analysisDone) resetAnalysis()
    setRunOpen(true)
  }

  return (
    <AppShell>
      <Hero onOpenAbout={() => setAboutOpen(true)} />

      <section id="dashboard" className="border-t border-line">
        <div className="mx-auto max-w-[1600px] px-6 py-10">
          <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle font-medium mb-2">
                Dashboard
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-ink tracking-tight">
                Peta supply, demand, dan rekomendasi
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {analysisDone && (
                <button
                  onClick={() => resetAnalysis()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-line text-ink-soft text-sm font-medium hover:bg-paper-sunken transition"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
                  {STRINGS.analysis.reset}
                </button>
              )}
              <button
                onClick={handleRun}
                disabled={status !== 'ready'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" strokeWidth={2} fill="currentColor" />
                {analysisDone ? 'Jalankan Ulang' : STRINGS.analysis.runLabel}
              </button>
            </div>
          </div>

          <div className="editorial-card overflow-hidden flex h-[720px]">
            <Sidebar />
            <div className="flex-1 relative">
              {status === 'loading' && (
                <div className="h-full grid place-items-center text-ink-subtle text-sm">
                  Memuat data peta…
                </div>
              )}
              {status === 'error' && (
                <div className="h-full grid place-items-center text-signal-nonfo text-sm">
                  Gagal memuat data: {error}
                </div>
              )}
              {status === 'ready' && <MapView />}
            </div>
          </div>

          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle font-medium mb-3">
              {STRINGS.stats.panelTitle}
            </div>
            <StatsPanel onFocusCluster={handleFocusCluster} />
          </div>
        </div>
      </section>

      <MethodologySection />

      <RunAnalysisDialog open={runOpen} onClose={() => setRunOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </AppShell>
  )
}

export default App
