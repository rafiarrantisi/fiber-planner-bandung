import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { AnalysisResult } from '@/types/domain'
import { formatNumber, formatPercent } from '@/lib/formatters'

interface Props {
  result: AnalysisResult
}

export function FoStatusDonut({ result }: Props) {
  const data = [
    { name: 'FO-Ready', value: result.foReadyCount, color: '#059669' },
    { name: 'Non-FO', value: result.nonFoCount, color: '#dc2626' },
  ]
  return (
    <div className="h-[220px] relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={60}
            outerRadius={90}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatNumber(v)}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5e0',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="font-display text-2xl text-ink leading-none tabular-nums">
            {formatPercent(result.foReadyPct)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-subtle mt-1">
            FO-Ready
          </div>
        </div>
      </div>
    </div>
  )
}
