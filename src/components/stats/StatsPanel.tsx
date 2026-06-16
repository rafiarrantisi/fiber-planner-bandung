import { motion } from 'framer-motion'
import {
  Activity,
  Building2,
  PiggyBank,
  Wifi,
  WifiOff,
  MapPin,
  ShieldAlert,
  Cable,
  CornerUpRight,
  Home,
  Banknote,
  Timer,
} from 'lucide-react'
import { useAnalysisStore } from '@/store/analysis'
import { STRINGS } from '@/lib/i18n-strings'
import {
  formatIdrCompact,
  formatKm,
  formatMonths,
  formatNumber,
  formatPercent,
} from '@/lib/formatters'
import { useConstraintStats } from '@/hooks/useConstraintStats'
import { KpiCard } from './KpiCard'
import { FoStatusDonut } from './FoStatusDonut'
import { CategoryBarChart } from './CategoryBarChart'
import { CapexByPhaseChart } from './CapexByPhaseChart'
import { ConstraintImpactCard } from './ConstraintImpactCard'
import { RankedClusterTable } from './RankedClusterTable'
import { ClusterTable } from './ClusterTable'
import type { Cluster } from '@/types/domain'

interface Props {
  onFocusCluster?: (cluster: Cluster) => void
}

function ConstraintKpi() {
  const stats = useConstraintStats()
  if (!stats.loaded) return null
  return (
    <KpiCard
      label={STRINGS.constraints.poiInRestricted}
      value={formatNumber(stats.poiInRestricted)}
      sublabel={STRINGS.constraints.summary
        .replace('{hard}', String(stats.hardCount))
        .replace('{soft}', String(stats.softCount))}
      accent="nonfo"
      icon={<ShieldAlert className="h-4 w-4" strokeWidth={1.5} />}
    />
  )
}

export function StatsPanel({ onFocusCluster }: Props) {
  const result = useAnalysisStore((s) => s.result)
  const clusters = useAnalysisStore((s) => s.clusters)
  const topology = useAnalysisStore((s) => s.topology)
  const capex = useAnalysisStore((s) => s.capex)
  const constraintImpact = useAnalysisStore((s) => s.constraintImpact)
  const totalHomesPassed = clusters.reduce(
    (sum, c) => sum + (c.homesPassed ?? 0),
    0,
  )

  if (!result) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ConstraintKpi />
        </div>
        <div className="editorial-card p-6 text-center text-sm text-ink-subtle">
          {STRINGS.stats.empty}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard
          label={STRINGS.stats.totalPoi}
          value={formatNumber(result.totalPoI)}
          sublabel="titik minat"
          icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label={STRINGS.stats.foReady}
          value={formatNumber(result.foReadyCount)}
          sublabel={formatPercent(result.foReadyPct)}
          accent="fo"
          icon={<Wifi className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label={STRINGS.stats.nonFo}
          value={formatNumber(result.nonFoCount)}
          sublabel={formatPercent(result.nonFoPct)}
          accent="nonfo"
          icon={<WifiOff className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label={STRINGS.stats.clusters}
          value={formatNumber(result.clusters.length)}
          sublabel="kandidat ODP baru"
          accent="brand"
          icon={<Building2 className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label={STRINGS.stats.revenueCaptured}
          value={formatIdrCompact(result.revenueCapturedIdr)}
          sublabel={STRINGS.stats.perMonth}
          accent="fo"
          icon={<PiggyBank className="h-4 w-4" strokeWidth={1.5} />}
        />
        <KpiCard
          label={STRINGS.stats.revenueLost}
          value={formatIdrCompact(result.revenueLostIdr)}
          sublabel={STRINGS.stats.perMonth}
          accent="nonfo"
          icon={<Activity className="h-4 w-4" strokeWidth={1.5} />}
        />
        <ConstraintKpi />
        {topology && (
          <KpiCard
            label={STRINGS.topology.totalFeeder}
            value={formatKm(topology.totalFeederM)}
            sublabel={`${formatNumber(topology.links.length)} segmen`}
            accent="brand"
            icon={<Cable className="h-4 w-4" strokeWidth={1.5} />}
          />
        )}
        {totalHomesPassed > 0 && (
          <KpiCard
            label={STRINGS.demand.homesPassed}
            value={formatNumber(totalHomesPassed)}
            sublabel="rumah terlewati"
            accent="fo"
            icon={<Home className="h-4 w-4" strokeWidth={1.5} />}
          />
        )}
        {constraintImpact && (
          <KpiCard
            label={STRINGS.routing.rerouted}
            value={formatNumber(constraintImpact.routesRerouted)}
            sublabel={`${formatNumber(constraintImpact.routesBlocked)} terblokir`}
            accent="nonfo"
            icon={<CornerUpRight className="h-4 w-4" strokeWidth={1.5} />}
          />
        )}
        {capex && (
          <KpiCard
            label={STRINGS.capex.totalCapex}
            value={formatIdrCompact(capex.totalCapexIdr)}
            sublabel={`${formatNumber(clusters.length)} ODP`}
            accent="brand"
            icon={<Banknote className="h-4 w-4" strokeWidth={1.5} />}
          />
        )}
        {capex && (
          <KpiCard
            label={STRINGS.capex.blendedPayback}
            value={formatMonths(capex.blendedPaybackMonths)}
            sublabel={STRINGS.capex.payback}
            accent="fo"
            icon={<Timer className="h-4 w-4" strokeWidth={1.5} />}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="editorial-card p-4 lg:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle font-medium mb-2">
            {STRINGS.stats.foDistribution}
          </div>
          <FoStatusDonut result={result} />
        </div>
        <div className="editorial-card p-4 lg:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle font-medium mb-2">
            {STRINGS.stats.byCategory}
          </div>
          <CategoryBarChart result={result} />
        </div>
      </div>

      {capex && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="editorial-card p-4 lg:col-span-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle font-medium mb-2">
              {STRINGS.capex.capexByPhase}
            </div>
            <CapexByPhaseChart capex={capex} />
          </div>
          <div className="lg:col-span-1">
            {constraintImpact && (
              <ConstraintImpactCard impact={constraintImpact} />
            )}
          </div>
        </div>
      )}

      <div className="editorial-card p-4">
        <div className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle font-medium mb-3">
          {capex ? STRINGS.capex.rankedTable : STRINGS.stats.clusterTable}
        </div>
        {capex ? (
          <RankedClusterTable clusters={clusters} onFocus={onFocusCluster} />
        ) : (
          <ClusterTable clusters={clusters} onFocus={onFocusCluster} />
        )}
      </div>
    </motion.div>
  )
}
