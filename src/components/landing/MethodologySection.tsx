import { Ruler, Target, TrendingUp } from 'lucide-react'
import { STRINGS } from '@/lib/i18n-strings'

const CARDS = [
  {
    icon: Ruler,
    title: 'Buffer 200 m',
    body: STRINGS.methodology.bufferRationale,
  },
  {
    icon: Target,
    title: 'Recursive K-Means (≤300 m)',
    body: STRINGS.methodology.clusterRationale,
  },
  {
    icon: TrendingUp,
    title: 'Kapasitas & Revenue',
    body: STRINGS.methodology.capacityRationale,
  },
]

export function MethodologySection() {
  return (
    <section id="metodologi" className="border-t border-line bg-paper-sunken">
      <div className="mx-auto max-w-[1600px] px-6 py-16">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle font-medium mb-3">
          {STRINGS.methodology.title}
        </div>
        <h2 className="font-display text-3xl md:text-5xl text-ink max-w-3xl tracking-tight">
          Tiga keputusan analitis yang membentuk rekomendasi
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <div key={c.title} className="editorial-card p-6">
              <c.icon className="h-5 w-5 text-ink-muted" strokeWidth={1.5} />
              <div className="mt-4 font-display text-xl text-ink leading-tight">
                {c.title}
              </div>
              <p className="mt-3 text-sm text-ink-muted leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
