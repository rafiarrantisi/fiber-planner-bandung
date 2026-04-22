import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { AnalysisResult, PoICategory } from '@/types/domain'
import { CATEGORY_LABELS } from '@/types/domain'
import { formatNumber } from '@/lib/formatters'

interface Props {
  result: AnalysisResult
}

const ORDER: PoICategory[] = [
  'PENDIDIKAN',
  'KESEHATAN',
  'PEMERINTAHAN',
  'NIAGA',
  'LAYANAN_POS',
  'MENARA_NON_FIBER',
]

export function CategoryBarChart({ result }: Props) {
  const data = ORDER.map((c) => ({
    category: CATEGORY_LABELS[c],
    'FO-Ready': result.byCategory[c].foReady,
    'Non-FO': result.byCategory[c].nonFo,
  }))

  return (
    <div className="h-[260px]">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 20, bottom: 4, left: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="#eeeee8" />
          <XAxis
            type="number"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickFormatter={(v: number) => formatNumber(v)}
            stroke="#d4d4cf"
          />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fill: '#1f2937', fontSize: 11 }}
            width={110}
            stroke="#d4d4cf"
          />
          <Tooltip
            formatter={(v: number) => formatNumber(v)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5e0',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          <Bar dataKey="FO-Ready" stackId="a" fill="#059669" />
          <Bar dataKey="Non-FO" stackId="a" fill="#dc2626" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
