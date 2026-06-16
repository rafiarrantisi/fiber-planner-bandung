import {
  ShieldAlert,
  Route,
  Building2,
  Network,
  Home,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { STRINGS } from '@/lib/i18n-strings'

const ICONS: LucideIcon[] = [
  ShieldAlert,
  Route,
  Building2,
  Network,
  Home,
  TrendingUp,
]

export function MethodologySection() {
  return (
    <section id="metodologi" className="border-t border-line bg-paper-sunken">
      <div className="mx-auto max-w-[1600px] px-6 py-16">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle font-medium mb-3">
          {STRINGS.methodology.title}
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-ink max-w-4xl tracking-tight">
          {STRINGS.methodology.heading}
        </h2>
        <p className="mt-4 text-base text-ink-muted max-w-2xl leading-relaxed">
          {STRINGS.methodology.tagline}
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STRINGS.methodology.pillars.map((p, i) => {
            const Icon = ICONS[i] ?? ShieldAlert
            return (
              <div key={p.title} className="editorial-card p-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid place-items-center h-7 w-7 rounded-full bg-ink text-paper text-xs font-display tabular-nums">
                    {i + 1}
                  </span>
                  <Icon className="h-5 w-5 text-ink-muted" strokeWidth={1.5} />
                </div>
                <div className="mt-4 font-display text-xl text-ink leading-tight">
                  {p.title}
                </div>
                <p className="mt-3 text-sm text-ink-muted leading-relaxed">
                  {p.body}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
