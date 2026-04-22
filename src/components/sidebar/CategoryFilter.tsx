import { useFiltersStore } from '@/store/filters'
import { CATEGORY_LABELS, type PoICategory } from '@/types/domain'

const CATEGORY_COLORS: Record<PoICategory, string> = {
  PENDIDIKAN: '#2563eb',
  KESEHATAN: '#db2777',
  PEMERINTAHAN: '#0891b2',
  NIAGA: '#ea580c',
  LAYANAN_POS: '#4f46e5',
  MENARA_NON_FIBER: '#64748b',
}

const ORDER: PoICategory[] = [
  'PENDIDIKAN',
  'KESEHATAN',
  'PEMERINTAHAN',
  'NIAGA',
  'LAYANAN_POS',
  'MENARA_NON_FIBER',
]

export function CategoryFilter() {
  const categories = useFiltersStore((s) => s.categories)
  const toggle = useFiltersStore((s) => s.toggleCategory)

  return (
    <div className="flex flex-wrap gap-1.5">
      {ORDER.map((c) => {
        const active = categories.has(c)
        return (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={[
              'pill transition',
              active
                ? '!bg-paper-card !border-ink !text-ink'
                : '!bg-paper-sunken !text-ink-subtle hover:!text-ink',
            ].join(' ')}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: active ? CATEGORY_COLORS[c] : '#cbd5e1' }}
            />
            {CATEGORY_LABELS[c]}
          </button>
        )
      })}
    </div>
  )
}
