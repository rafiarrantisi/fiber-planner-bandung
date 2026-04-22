import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { STRINGS } from '@/lib/i18n-strings'

interface Props {
  onOpenAbout: () => void
}

export function Hero({ onOpenAbout }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-paper to-paper-sunken">
      <div className="mx-auto max-w-[1600px] px-6 pt-20 pb-28 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-xs uppercase tracking-[0.25em] text-ink-subtle mb-6">
            {STRINGS.hero.eyebrow}
          </div>
          <h1 className="font-display text-[3rem] md:text-[5.5rem] leading-[0.95] whitespace-pre-line text-ink max-w-5xl tracking-tighter">
            {STRINGS.hero.title}
          </h1>
          <p className="mt-8 max-w-2xl text-ink-muted text-lg leading-relaxed">
            {STRINGS.hero.tagline}
          </p>
          <div className="mt-3 text-sm text-ink-subtle italic">
            {STRINGS.hero.signature}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:opacity-90 transition"
            >
              {STRINGS.hero.ctaPrimary}
              <ArrowDown className="h-4 w-4" strokeWidth={2} />
            </a>
            <button
              onClick={onOpenAbout}
              className="px-6 py-3 rounded-full border border-line text-ink-soft text-sm font-medium hover:bg-paper-card transition"
            >
              {STRINGS.hero.ctaSecondary}
            </button>
          </div>
        </motion.div>

        <FiberDecorativeSvg />
      </div>
    </section>
  )
}

function FiberDecorativeSvg() {
  return (
    <svg
      viewBox="0 0 1600 520"
      className="absolute right-0 top-0 h-full w-[60%] opacity-[0.14] pointer-events-none hidden md:block"
      fill="none"
    >
      <defs>
        <linearGradient id="fiberGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {Array.from({ length: 18 }).map((_, i) => {
        const y1 = 30 + i * 28
        const y2 = 520 - i * 12
        return (
          <motion.path
            key={i}
            d={`M ${-20 + i * 10} ${y1} C ${400 + i * 22} ${y1 + 60}, ${900 + i * 8} ${y2 - 80}, ${1650} ${y2}`}
            stroke="url(#fiberGrad)"
            strokeWidth={1.2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.4, delay: i * 0.04, ease: 'easeOut' }}
          />
        )
      })}
    </svg>
  )
}
