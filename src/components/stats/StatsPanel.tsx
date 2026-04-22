import { motion } from 'framer-motion'
import { Activity, Building2, PiggyBank, Wifi, WifiOff, MapPin } from 'lucide-react'
import { useAnalysisStore } from '@/store/analysis'
import { STRINGS } from '@/lib/i18n-strings'
import { formatIdrCompact, formatNumber, formatPercent } from '@/lib/formatters'
import { KpiCard } from './KpiCard'
import { FoStatusDonut } from './FoStatusDonut'
import { CategoryBarChart } from './CategoryBarChart'
import { ClusterTable } from './ClusterTable'
import type { Cluster } from '@/types/domain'

interface Props {
  onFocusCluster?: (cluster: Cluster) => void
}

export function StatsPanel({ onFocusCluster }: Props) {
  const result = useAnalysisStore((s) => s.result)
  const clusters = useAnalysisStore((s) => s.clusters)

  if (!result) {
    return (
      <div className="editorial-card p-6 text-center text-sm text-ink-subtle">
        {STRINGS.stats.empty}
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

      <div className="editorial-card p-4">
        <div className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle font-medium mb-3">
          {STRINGS.stats.clusterTable}
        </div>
        <ClusterTable clusters={clusters} onFocus={onFocusCluster} />
      </div>
    </motion.div>
  )
}
