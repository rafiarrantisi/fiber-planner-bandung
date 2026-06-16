import { useMemo } from 'react'
import {
  useConstraintStore,
  type ConstraintSeverityFilter,
} from '@/store/constraints'
import type { ConstraintCategory } from '@/types/domain'
import { CONSTRAINT_CATEGORY_LABELS } from '@/types/domain'
import { CONSTRAINT_COLORS } from '@/lib/constraint-style'
import { STRINGS } from '@/lib/i18n-strings'

const SEVERITY_OPTIONS: { value: ConstraintSeverityFilter; label: string }[] = [
  { value: 'all', label: STRINGS.constraints.severityAll },
  { value: 'hard', label: STRINGS.constraints.severityHard },
  { value: 'soft', label: STRINGS.constraints.severitySoft },
]

export function ConstraintPanel() {
  const features = useConstraintStore((s) => s.features)
  const visible = useConstraintStore((s) => s.visibleCategories)
  const toggle = useConstraintStore((s) => s.toggleCategory)
  const severityFilter = useConstraintStore((s) => s.severityFilter)
  const setSeverity = useConstraintStore((s) => s.setSeverityFilter)

  const { presentCategories, hardCount, softCount } = useMemo(() => {
    const present = new Set<ConstraintCategory>()
    let hard = 0
    let soft = 0
    for (const f of features) {
      present.add(f.properties.category)
      if (f.properties.severity === 'hard') hard++
      else soft++
    }
    return {
      presentCategories: [...present].sort(),
      hardCount: hard,
      softCount: soft,
    }
  }, [features])

  if (features.length === 0) {
    return (
      <p className="text-xs text-ink-subtle leading-relaxed">
        Layer kendala belum di-generate. Jalankan{' '}
        <code className="text-ink-muted">npm run gen:constraints</code>.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-full border border-line bg-paper-sunken p-0.5 text-xs">
        {SEVERITY_OPTIONS.map((o) => {
          const active = severityFilter === o.value
          return (
            <button
              key={o.value}
              onClick={() => setSeverity(o.value)}
              className={[
                'flex-1 px-3 py-1.5 rounded-full transition',
                active
                  ? 'bg-paper-card text-ink shadow-sm'
                  : 'text-ink-subtle hover:text-ink',
              ].join(' ')}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        {presentCategories.map((cat) => (
          <label
            key={cat}
            className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={visible.has(cat)}
              onChange={() => toggle(cat)}
              className="h-4 w-4 rounded border-line text-ink focus:ring-ink"
            />
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: CONSTRAINT_COLORS[cat] }}
            />
            <span>{CONSTRAINT_CATEGORY_LABELS[cat]}</span>
          </label>
        ))}
      </div>

      <p className="text-[11px] text-ink-subtle">
        {STRINGS.constraints.summary
          .replace('{hard}', String(hardCount))
          .replace('{soft}', String(softCount))}
      </p>
    </div>
  )
}
