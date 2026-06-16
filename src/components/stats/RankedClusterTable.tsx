import { useMemo, useState } from 'react'
import type { Cluster } from '@/types/domain'
import { CITY_LABELS } from '@/types/domain'
import { useAnalysisStore } from '@/store/analysis'
import { PHASE_COLORS } from '@/components/map/markers/icons'
import { STRINGS } from '@/lib/i18n-strings'
import {
  formatIdrCompact,
  formatMonths,
  formatNumber,
  formatPercent,
} from '@/lib/formatters'

interface Props {
  clusters: Cluster[]
  onFocus?: (cluster: Cluster) => void
}

type SortKey = 'roi' | 'capex' | 'revenue' | 'payback' | 'homes'

const SORTERS: Record<SortKey, (a: Cluster, b: Cluster) => number> = {
  roi: (a, b) => (b.roiScore ?? 0) - (a.roiScore ?? 0),
  capex: (a, b) => (b.capexIdr ?? 0) - (a.capexIdr ?? 0),
  revenue: (a, b) => (b.monthlyRevenueIdr ?? 0) - (a.monthlyRevenueIdr ?? 0),
  payback: (a, b) => (a.paybackMonths ?? Infinity) - (b.paybackMonths ?? Infinity),
  homes: (a, b) => (b.homesPassed ?? 0) - (a.homesPassed ?? 0),
}

const MAX_ROWS = 200

function statusBadge(c: Cluster): { label: string; cls: string } | null {
  if (c.inHardBlock)
    return { label: 'hard-block', cls: 'bg-signal-nonfo/15 text-signal-nonfo' }
  if ((c.undeliverableDrops ?? 0) > 0)
    return { label: 'drop', cls: 'bg-amber-500/15 text-amber-700' }
  return null
}

export function RankedClusterTable({ clusters, onFocus }: Props) {
  const [sort, setSort] = useState<SortKey>('roi')
  const [q, setQ] = useState('')
  const activePhase = useAnalysisStore((s) => s.activePhaseFilter)

  const sorted = useMemo(() => {
    let list = clusters
    if (activePhase !== 'all') list = list.filter((c) => c.phase === activePhase)
    if (q)
      list = list.filter((c) =>
        `${c.id} ${CITY_LABELS[c.city]}`.toLowerCase().includes(q.toLowerCase()),
      )
    return [...list].sort(SORTERS[sort]).slice(0, MAX_ROWS)
  }, [clusters, q, sort, activePhase])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari klaster / kota…"
          className="flex-1 px-3 py-1.5 rounded-md border border-line bg-paper-card text-xs focus:outline-none focus:ring-1 focus:ring-ink"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-1.5 rounded-md border border-line bg-paper-card text-xs focus:outline-none focus:ring-1 focus:ring-ink"
        >
          <option value="roi">Urut: ROI tertinggi</option>
          <option value="payback">Urut: Payback tercepat</option>
          <option value="revenue">Urut: Revenue/bln</option>
          <option value="capex">Urut: Capex terbesar</option>
          <option value="homes">Urut: Homes passed</option>
        </select>
      </div>
      <div className="max-h-[360px] overflow-auto rounded-lg border border-line">
        <table className="w-full text-xs">
          <thead className="bg-paper-sunken text-ink-subtle sticky top-0">
            <tr>
              <th className="text-left px-2.5 py-2 font-medium">Kota</th>
              <th className="text-right px-2.5 py-2 font-medium">Homes</th>
              <th className="text-right px-2.5 py-2 font-medium">Revenue</th>
              <th className="text-right px-2.5 py-2 font-medium">Capex</th>
              <th className="text-right px-2.5 py-2 font-medium">
                {STRINGS.capex.payback}
              </th>
              <th className="text-right px-2.5 py-2 font-medium">ROI</th>
              <th className="text-center px-2.5 py-2 font-medium">
                {STRINGS.capex.phase}
              </th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const badge = statusBadge(c)
              return (
                <tr
                  key={c.id}
                  onClick={() => onFocus?.(c)}
                  className="border-t border-line hover:bg-paper-sunken cursor-pointer tabular-nums"
                >
                  <td className="px-2.5 py-2 text-ink-muted">
                    {CITY_LABELS[c.city].replace('Kabupaten ', 'Kab. ')}
                  </td>
                  <td className="px-2.5 py-2 text-right text-ink-muted">
                    {formatNumber(c.homesPassed ?? 0)}
                  </td>
                  <td className="px-2.5 py-2 text-right text-ink-muted">
                    {formatIdrCompact(c.monthlyRevenueIdr ?? 0)}
                  </td>
                  <td className="px-2.5 py-2 text-right text-ink-muted">
                    {formatIdrCompact(c.capexIdr ?? 0)}
                  </td>
                  <td className="px-2.5 py-2 text-right text-ink-muted">
                    {formatMonths(c.paybackMonths ?? null)}
                  </td>
                  <td className="px-2.5 py-2 text-right font-medium text-ink">
                    {formatPercent(c.roiScore ?? 0)}
                  </td>
                  <td className="px-2.5 py-2 text-center">
                    {c.phase && (
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: PHASE_COLORS[c.phase] }}
                        title={`Fase ${c.phase}`}
                      />
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-ink-subtle">
                  Tidak ada klaster.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {clusters.length > MAX_ROWS && (
        <p className="text-[10px] text-ink-subtle">
          Menampilkan {MAX_ROWS} teratas dari {formatNumber(clusters.length)} klaster.
        </p>
      )}
    </div>
  )
}
