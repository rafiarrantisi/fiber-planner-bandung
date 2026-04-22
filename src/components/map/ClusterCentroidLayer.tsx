import { Marker, Popup } from 'react-leaflet'
import type { Cluster } from '@/types/domain'
import { CITY_LABELS } from '@/types/domain'
import { clusterCentroidIcon } from './markers/icons'
import { STRINGS } from '@/lib/i18n-strings'
import { formatIdrCompact, formatMbps, formatDistance, formatNumber } from '@/lib/formatters'

interface Props {
  clusters: Cluster[]
}

export function ClusterCentroidLayer({ clusters }: Props) {
  return (
    <>
      {clusters.map((c) => (
        <Marker
          key={c.id}
          position={[c.centroid.lat, c.centroid.lng]}
          icon={clusterCentroidIcon(c.memberIds.length)}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="p-3 space-y-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-signal-nonfo">
                  {STRINGS.popup.recommendOdp}
                </div>
                <div className="font-display text-base text-ink leading-tight">
                  Klaster #{c.id.split('-').pop()}
                </div>
                <div className="text-xs text-ink-muted">{CITY_LABELS[c.city]}</div>
              </div>
              <div className="rule-line" />
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-subtle">{STRINGS.popup.member}</span>
                  <span className="font-medium text-ink">
                    {formatNumber(c.memberIds.length)} PoI
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-subtle">{STRINGS.popup.totalCapacity}</span>
                  <span className="font-medium text-ink">
                    {formatMbps(c.totalCapacityMbps)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-subtle">{STRINGS.popup.totalRevenue}</span>
                  <span className="font-medium text-ink">
                    {formatIdrCompact(c.totalMonthlyRevenueIdr)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-subtle">{STRINGS.popup.nearestOdp}</span>
                  <span className="font-medium text-ink">
                    {formatDistance(c.distanceToNearestSupplyM)}
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
