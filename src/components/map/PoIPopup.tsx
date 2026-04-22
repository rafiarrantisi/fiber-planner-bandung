import type { PoI } from '@/types/domain'
import { CITY_LABELS, SUBTYPE_LABELS, CATEGORY_LABELS } from '@/types/domain'
import { STRINGS } from '@/lib/i18n-strings'
import { formatIdr, formatMbps, formatDistance } from '@/lib/formatters'

interface Props {
  poi: PoI
}

export function PoIPopup({ poi }: Props) {
  return (
    <div className="p-3 space-y-2">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-subtle">
          {CATEGORY_LABELS[poi.category]} · {SUBTYPE_LABELS[poi.subtype]}
        </div>
        <div className="font-display text-base text-ink leading-tight">
          {poi.name}
        </div>
        <div className="text-xs text-ink-muted">{CITY_LABELS[poi.city]}</div>
      </div>
      <div className="rule-line" />
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-ink-subtle">{STRINGS.popup.capacity}</span>
          <span className="font-medium text-ink">
            {formatMbps(poi.capacityMbps)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-subtle">{STRINGS.popup.revenue}</span>
          <span className="font-medium text-ink">
            {formatIdr(poi.monthlyRevenueIdr)}
            <span className="text-ink-subtle">{STRINGS.stats.perMonth}</span>
          </span>
        </div>
        {poi.foStatus && (
          <div className="flex justify-between">
            <span className="text-ink-subtle">{STRINGS.popup.foStatus}</span>
            <span
              className={`pill !px-2 !py-0.5 ${
                poi.foStatus === 'FO_READY'
                  ? '!border-signal-fo/30 !text-signal-fo !bg-signal-fo/10'
                  : '!border-signal-nonfo/30 !text-signal-nonfo !bg-signal-nonfo/10'
              }`}
            >
              {poi.foStatus === 'FO_READY' ? STRINGS.sidebar.foReady : STRINGS.sidebar.nonFo}
            </span>
          </div>
        )}
        {poi.distanceToNearestSupplyM !== undefined && (
          <div className="flex justify-between">
            <span className="text-ink-subtle">{STRINGS.popup.distance}</span>
            <span className="font-medium text-ink">
              {formatDistance(poi.distanceToNearestSupplyM)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
