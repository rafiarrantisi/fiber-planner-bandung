import { useMemo } from 'react'
import {
  CATEGORY_LABELS,
  CONSTRAINT_CATEGORY_LABELS,
  type ConstraintCategory,
  type PoICategory,
} from '@/types/domain'
import { useConstraintStore } from '@/store/constraints'
import { useMapUiStore } from '@/store/map-ui'
import { CONSTRAINT_COLORS } from '@/lib/constraint-style'

const ORDER: PoICategory[] = [
  'PENDIDIKAN',
  'KESEHATAN',
  'PEMERINTAHAN',
  'NIAGA',
  'LAYANAN_POS',
  'MENARA_NON_FIBER',
]

const COLORS: Record<PoICategory, string> = {
  PENDIDIKAN: '#2563eb',
  KESEHATAN: '#db2777',
  PEMERINTAHAN: '#0891b2',
  NIAGA: '#ea580c',
  LAYANAN_POS: '#4f46e5',
  MENARA_NON_FIBER: '#64748b',
}

function ConstraintLegend() {
  const features = useConstraintStore((s) => s.features)
  const show = useMapUiStore((s) => s.v2Layers.showConstraints)
  const present = useMemo(() => {
    const set = new Set<ConstraintCategory>()
    for (const f of features) set.add(f.properties.category)
    return [...set].sort()
  }, [features])

  if (!show || present.length === 0) return null

  return (
    <>
      <div className="rule-line" />
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
        Kendala (RoW)
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        {present.map((c) => (
          <div key={c} className="flex items-center gap-2 text-ink-muted">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: CONSTRAINT_COLORS[c] }}
            />
            <span className="truncate">{CONSTRAINT_CATEGORY_LABELS[c]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export function LegendControl() {
  return (
    <div className="absolute bottom-6 left-6 z-[400] editorial-card px-4 py-3 text-xs space-y-2 w-[240px] max-h-[60%] overflow-y-auto">
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle font-medium">
        Legenda
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
        {ORDER.map((c) => (
          <div key={c} className="flex items-center gap-2 text-ink-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: COLORS[c] }}
            />
            <span className="truncate">{CATEGORY_LABELS[c]}</span>
          </div>
        ))}
      </div>
      <div className="rule-line" />
      <div className="space-y-1 text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal-fo" />
          <span>ODP (supply)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal-supply" />
          <span>Menara Fiberized</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded bg-signal-fiber" />
          <span>Kabel fiber</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal-buffer/40 border border-signal-buffer/60" />
          <span>Buffer 200 m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal-nonfo border-2 border-white shadow" />
          <span>Rekomendasi ODP baru</span>
        </div>
      </div>
      <ConstraintLegend />
    </div>
  )
}
