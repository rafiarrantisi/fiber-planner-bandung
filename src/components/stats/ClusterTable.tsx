import { useMemo, useState } from 'react'
import type { Cluster } from '@/types/domain'
import { CITY_LABELS } from '@/types/domain'
import { formatDistance, formatIdrCompact, formatMbps, formatNumber } from '@/lib/formatters'

interface Props {
  clusters: Cluster[]
  onFocus?: (cluster: Cluster) => void
}

type SortKey = 'members' | 'revenue' | 'capacity' | 'distance'

export function ClusterTable({ clusters, onFocus }: Props) {
  const [sort, setSort] = useState<SortKey>('members')
  const [q, setQ] = useState('')

  const sorted = useMemo(() => {
    const filtered = q
      ? clusters.filter((c) =>
          `${c.id} ${CITY_LABELS[c.city]}`.toLowerCase().includes(q.toLowerCase()),
        )
      : clusters

    const cmp: Record<SortKey, (a: Cluster, b: Cluster) => number> = {
      members: (a, b) => b.memberIds.length - a.memberIds.length,
      revenue: (a, b) => b.totalMonthlyRevenueIdr - a.totalMonthlyRevenueIdr,
      capacity: (a, b) => b.totalCapacityMbps - a.totalCapacityMbps,
      distance: (a, b) => a.distanceToNearestSupplyM - b.distanceToNearestSupplyM,
    }
    return [...filtered].sort(cmp[sort])
  }, [clusters, q, sort])

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
          <option value="members">Urut: Anggota terbanyak</option>
          <option value="revenue">Urut: Revenue peluang</option>
          <option value="capacity">Urut: Kapasitas</option>
          <option value="distance">Urut: Jarak ke ODP</option>
        </select>
      </div>
      <div className="max-h-[340px] overflow-auto rounded-lg border border-line">
        <table className="w-full text-xs">
          <thead className="bg-paper-sunken text-ink-subtle sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-medium">No</th>
              <th className="text-left px-3 py-2 font-medium">Kota</th>
              <th className="text-right px-3 py-2 font-medium">Anggota</th>
              <th className="text-right px-3 py-2 font-medium">Kapasitas</th>
              <th className="text-right px-3 py-2 font-medium">Revenue</th>
              <th className="text-right px-3 py-2 font-medium">Jarak ODP</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr
                key={c.id}
                onClick={() => onFocus?.(c)}
                className="border-t border-line hover:bg-paper-sunken cursor-pointer tabular-nums"
              >
                <td className="px-3 py-2 text-ink-subtle">{i + 1}</td>
                <td className="px-3 py-2 text-ink-muted">
                  {CITY_LABELS[c.city].replace('Kabupaten ', 'Kab. ')}
                </td>
                <td className="px-3 py-2 text-right font-medium text-ink">
                  {formatNumber(c.memberIds.length)}
                </td>
                <td className="px-3 py-2 text-right text-ink-muted">
                  {formatMbps(c.totalCapacityMbps)}
                </td>
                <td className="px-3 py-2 text-right text-ink-muted">
                  {formatIdrCompact(c.totalMonthlyRevenueIdr)}
                </td>
                <td className="px-3 py-2 text-right text-ink-muted">
                  {formatDistance(c.distanceToNearestSupplyM)}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-subtle">
                  Tidak ada klaster.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
