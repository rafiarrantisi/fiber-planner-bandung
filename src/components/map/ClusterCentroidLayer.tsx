import { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import type { Cluster } from '@/types/domain'
import { CITY_LABELS } from '@/types/domain'
import { clusterCentroidIcon, PHASE_COLORS } from './markers/icons'
import { STRINGS } from '@/lib/i18n-strings'
import { useMapUiStore } from '@/store/map-ui'
import { useAnalysisStore } from '@/store/analysis'
import {
  formatIdrCompact,
  formatMbps,
  formatDistance,
  formatNumber,
  formatPercent,
  formatMonths,
} from '@/lib/formatters'

interface Props {
  clusters: Cluster[]
}

function clusterWarn(c: Cluster): boolean {
  return Boolean(c.inHardBlock) || (c.undeliverableDrops ?? 0) > 0
}

export function ClusterCentroidLayer({ clusters }: Props) {
  const showPhaseColors = useMapUiStore((s) => s.v2Layers.showPhaseColors)
  const activePhase = useAnalysisStore((s) => s.activePhaseFilter)

  const visible = useMemo(
    () =>
      activePhase === 'all'
        ? clusters
        : clusters.filter((c) => c.phase === activePhase),
    [clusters, activePhase],
  )

  return (
    <>
      {visible.map((c) => {
        const warn = clusterWarn(c)
        const cap = c.portCapacity ?? 0
        const phaseColor =
          showPhaseColors && c.phase ? PHASE_COLORS[c.phase] : undefined
        return (
          <Marker
            key={c.id}
            position={[c.centroid.lat, c.centroid.lng]}
            icon={clusterCentroidIcon(c.memberIds.length, warn, phaseColor)}
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
                  <div className="text-xs text-ink-muted">
                    {CITY_LABELS[c.city]}
                  </div>
                </div>
                <div className="rule-line" />
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">{STRINGS.popup.member}</span>
                    <span className="font-medium text-ink">
                      {formatNumber(c.memberIds.length)} PoI
                    </span>
                  </div>
                  {cap > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink-subtle">
                        {STRINGS.cluster.portCapacity}
                      </span>
                      <span className="font-medium text-ink">
                        {c.assignedPoiCount}/{cap} (
                        {formatPercent(c.capacityUtil ?? 0)})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">
                      {STRINGS.popup.totalCapacity}
                    </span>
                    <span className="font-medium text-ink">
                      {formatMbps(c.totalCapacityMbps)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">
                      {STRINGS.popup.totalRevenue}
                    </span>
                    <span className="font-medium text-ink">
                      {formatIdrCompact(c.totalMonthlyRevenueIdr)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-subtle">
                      {STRINGS.popup.nearestOdp}
                    </span>
                    <span className="font-medium text-ink">
                      {formatDistance(c.distanceToNearestSupplyM)}
                    </span>
                  </div>
                  {c.homesPassed != null && (
                    <div className="flex justify-between">
                      <span className="text-ink-subtle">
                        {STRINGS.demand.homesPassed}
                      </span>
                      <span className="font-medium text-ink">
                        {formatNumber(c.homesPassed)}
                      </span>
                    </div>
                  )}
                  {c.capexIdr != null && (
                    <>
                      <div className="rule-line" />
                      <div className="flex justify-between">
                        <span className="text-ink-subtle">
                          {STRINGS.capex.totalCapex}
                        </span>
                        <span className="font-medium text-ink">
                          {formatIdrCompact(c.capexIdr)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-subtle">
                          {STRINGS.capex.payback}
                        </span>
                        <span className="font-medium text-ink">
                          {formatMonths(c.paybackMonths ?? null)}
                        </span>
                      </div>
                      {c.phase != null && (
                        <div className="flex justify-between">
                          <span className="text-ink-subtle">
                            {STRINGS.capex.phase}
                          </span>
                          <span className="font-medium text-ink">
                            {STRINGS.capex[`phase${c.phase}` as 'phase1']}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {warn && (
                  <div className="rounded-md bg-signal-nonfo/10 border border-signal-nonfo/30 px-2 py-1.5 text-[11px] text-signal-nonfo space-y-0.5">
                    {c.inHardBlock && <div>⚠ {STRINGS.cluster.inHardBlock}</div>}
                    {(c.undeliverableDrops ?? 0) > 0 && (
                      <div>
                        ⚠ {c.undeliverableDrops} {STRINGS.cluster.undeliverable}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}
