import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { useAnalysisStore, type AnalysisStep } from '@/store/analysis'
import { STRINGS } from '@/lib/i18n-strings'
import { useRunAnalysis } from '@/hooks/useAnalysis'

const STEPS: { key: AnalysisStep; label: string }[] = [
  { key: 'buffer', label: STRINGS.analysis.steps.buffer },
  { key: 'classify', label: STRINGS.analysis.steps.classify },
  { key: 'cluster', label: STRINGS.analysis.steps.cluster },
  { key: 'stats', label: STRINGS.analysis.steps.stats },
]

const ORDER: AnalysisStep[] = ['idle', 'buffer', 'classify', 'cluster', 'stats', 'done']

interface Props {
  open: boolean
  onClose: () => void
}

export function RunAnalysisDialog({ open, onClose }: Props) {
  const current = useAnalysisStore((s) => s.step)
  const run = useRunAnalysis()

  useEffect(() => {
    if (!open) return
    void run()
  }, [open, run])

  useEffect(() => {
    if (current === 'done') {
      const t = setTimeout(onClose, 900)
      return () => clearTimeout(t)
    }
  }, [current, onClose])

  const currentIdx = ORDER.indexOf(current)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-ink/30 backdrop-blur-sm grid place-items-center"
        >
          <motion.div
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-paper-card rounded-xl shadow-floatCard border border-line w-[480px] p-6"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle font-medium mb-1">
              {STRINGS.analysis.runLabel}
            </div>
            <h3 className="font-display text-xl text-ink mb-5">
              {current === 'done'
                ? STRINGS.analysis.done
                : STRINGS.analysis.running}
            </h3>

            <ol className="space-y-3">
              {STEPS.map((s, i) => {
                const stepIdx = ORDER.indexOf(s.key)
                const done = stepIdx < currentIdx
                const active = s.key === current
                return (
                  <li key={s.key} className="flex items-center gap-3 text-sm">
                    <span
                      className={[
                        'h-6 w-6 rounded-full grid place-items-center border',
                        done
                          ? 'bg-signal-fo text-white border-signal-fo'
                          : active
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-paper-sunken text-ink-subtle border-line',
                      ].join(' ')}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-[11px] tabular-nums">{i + 1}</span>
                      )}
                    </span>
                    <span
                      className={done || active ? 'text-ink' : 'text-ink-subtle'}
                    >
                      {s.label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
