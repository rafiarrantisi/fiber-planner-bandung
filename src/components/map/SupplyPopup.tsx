import type { SupplyPoint } from '@/types/domain'
import { CITY_LABELS } from '@/types/domain'
import { STRINGS } from '@/lib/i18n-strings'
import { formatNumber } from '@/lib/formatters'

interface Props {
  supply: SupplyPoint
}

export function SupplyPopup({ supply }: Props) {
  const utilization = supply.usedPorts / supply.maxPorts
  const pct = Math.round(utilization * 100)
  const barColor =
    utilization > 0.85 ? 'bg-signal-nonfo' : utilization > 0.6 ? 'bg-signal-fiber' : 'bg-signal-fo'

  return (
    <div className="p-3 space-y-2">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-subtle">
          {supply.type === 'ODP' ? 'ODP' : 'Menara Fiberized'}
        </div>
        <div className="font-display text-base text-ink leading-tight">
          {supply.name}
        </div>
        <div className="text-xs text-ink-muted">{CITY_LABELS[supply.city]}</div>
      </div>
      <div className="rule-line" />
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-subtle">Port terpakai</span>
          <span className="font-medium text-ink">
            {formatNumber(supply.usedPorts)} / {formatNumber(supply.maxPorts)}
          </span>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-ink-subtle">{STRINGS.popup.utilization}</span>
            <span className="font-medium text-ink">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-paper-sunken overflow-hidden">
            <div
              className={`h-full ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {supply.servedPoICount !== undefined && (
          <div className="flex justify-between">
            <span className="text-ink-subtle">{STRINGS.popup.servedPoi}</span>
            <span className="font-medium text-ink">
              {formatNumber(supply.servedPoICount)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
