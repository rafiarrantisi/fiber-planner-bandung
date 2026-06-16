import type { ConstraintImpact } from '@/types/domain'
import { STRINGS } from '@/lib/i18n-strings'
import { formatIdrCompact, formatNumber } from '@/lib/formatters'

interface Props {
  impact: ConstraintImpact
}

export function ConstraintImpactCard({ impact }: Props) {
  const rows = [
    { label: STRINGS.routing.rerouted, value: formatNumber(impact.routesRerouted) },
    { label: STRINGS.routing.blocked, value: formatNumber(impact.routesBlocked) },
    {
      label: STRINGS.constraints.poiInRestricted,
      value: formatNumber(impact.poiInRestricted),
    },
    {
      label: STRINGS.capex.extraCost,
      value: formatIdrCompact(impact.extraCostFromConstraintsIdr),
      highlight: true,
    },
  ]

  return (
    <div className="editorial-card p-4 h-full">
      <div className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle font-medium mb-3">
        {STRINGS.capex.constraintImpactTitle}
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-ink-subtle leading-tight">{r.label}</span>
            <span
              className={[
                'font-display tabular-nums shrink-0',
                r.highlight ? 'text-lg text-signal-nonfo' : 'text-base text-ink',
              ].join(' ')}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
