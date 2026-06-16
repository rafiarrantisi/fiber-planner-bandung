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
import type { CapexSummary } from '@/types/domain'
import { STRINGS } from '@/lib/i18n-strings'
import { formatIdrCompact } from '@/lib/formatters'

interface Props {
  capex: CapexSummary
}

export function CapexByPhaseChart({ capex }: Props) {
  const data = ([1, 2, 3] as const).map((p) => ({
    phase: `Fase ${p}`,
    Capex: Math.round(capex.byPhase[p].capexIdr),
    'Revenue/bln': Math.round(capex.byPhase[p].revenueIdr),
  }))

  return (
    <div className="h-[240px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 4, right: 12, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke="#eeeee8" />
          <XAxis
            dataKey="phase"
            tick={{ fill: '#1f2937', fontSize: 11 }}
            stroke="#d4d4cf"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickFormatter={(v: number) => formatIdrCompact(v)}
            width={64}
            stroke="#d4d4cf"
          />
          <Tooltip
            formatter={(v: number) => formatIdrCompact(v)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5e0',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
          <Bar dataKey="Capex" fill="#b45309" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Revenue/bln" fill="#059669" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="sr-only">{STRINGS.capex.capexByPhase}</p>
    </div>
  )
}
