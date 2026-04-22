import { CATEGORY_LABELS, type PoICategory } from '@/types/domain'

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

export function LegendControl() {
  return (
    <div className="absolute bottom-6 left-6 z-[400] editorial-card px-4 py-3 text-xs space-y-2 w-[240px]">
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
    </div>
  )
}
