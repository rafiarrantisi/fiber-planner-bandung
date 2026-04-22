import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  label: string
  value: string
  sublabel?: string
  accent?: 'fo' | 'nonfo' | 'brand' | 'neutral'
  icon?: ReactNode
}

const ACCENT: Record<NonNullable<Props['accent']>, string> = {
  fo: 'text-signal-fo',
  nonfo: 'text-signal-nonfo',
  brand: 'text-brand',
  neutral: 'text-ink',
}

export function KpiCard({ label, value, sublabel, accent = 'neutral', icon }: Props) {
  return (
    <div className="editorial-card p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.15em] text-ink-subtle font-medium leading-tight">
          {label}
        </div>
        {icon && <div className="text-ink-subtle">{icon}</div>}
      </div>
      <div>
        <div
          className={cn(
            'font-display text-3xl leading-none tabular-nums',
            ACCENT[accent],
          )}
        >
          {value}
        </div>
        {sublabel && (
          <div className="text-[11px] text-ink-subtle mt-1">{sublabel}</div>
        )}
      </div>
    </div>
  )
}
