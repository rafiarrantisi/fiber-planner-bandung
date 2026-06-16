import { useAnalysisStore, type PhaseFilter } from '@/store/analysis'
import { phaseClusters } from '@/analysis/capex'
import { STRINGS } from '@/lib/i18n-strings'
import { formatCapexIdr, formatMonths, formatNumber } from '@/lib/formatters'
import {
  CAPEX_BUDGET_MAX_IDR,
  CAPEX_BUDGET_MIN_IDR,
  CAPEX_BUDGET_STEP_IDR,
} from '@/lib/constants'

const PHASES: { value: PhaseFilter; label: string }[] = [
  { value: 'all', label: STRINGS.capex.phaseAll },
  { value: 1, label: STRINGS.capex.phase1 },
  { value: 2, label: STRINGS.capex.phase2 },
  { value: 3, label: STRINGS.capex.phase3 },
]

export function CapexPanel() {
  const step = useAnalysisStore((s) => s.step)
  const budgetIdr = useAnalysisStore((s) => s.budgetIdr)
  const setBudget = useAnalysisStore((s) => s.setBudget)
  const clusters = useAnalysisStore((s) => s.clusters)
  const capex = useAnalysisStore((s) => s.capex)
  const rephase = useAnalysisStore((s) => s.rephase)
  const activePhase = useAnalysisStore((s) => s.activePhaseFilter)
  const setActivePhase = useAnalysisStore((s) => s.setActivePhase)

  const done = step === 'done'

  const handleBudget = (value: number) => {
    setBudget(value)
    // Re-fasing MURAH (tanpa re-route) atas capex yg sudah dihitung
    if (done && clusters.length > 0 && clusters[0].capexIdr != null) {
      const res = phaseClusters(clusters, value)
      rephase(res.clusters, res.summary)
    }
  }

  if (!done || !capex) {
    return (
      <p className="text-xs text-ink-subtle leading-relaxed">
        Jalankan analisis untuk mengaktifkan fasing capex berbasis budget.
      </p>
    )
  }

  const phase1 = capex.byPhase[1]

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-ink-muted">{STRINGS.capex.budget}</span>
          <span className="text-sm font-medium text-ink tabular-nums">
            {formatCapexIdr(budgetIdr)}
          </span>
        </div>
        <input
          type="range"
          min={CAPEX_BUDGET_MIN_IDR}
          max={CAPEX_BUDGET_MAX_IDR}
          step={CAPEX_BUDGET_STEP_IDR}
          value={budgetIdr}
          onChange={(e) => handleBudget(Number(e.target.value))}
          className="w-full accent-brand"
        />
        <div className="mt-2 rounded-md bg-paper-sunken px-2.5 py-2 text-[11px] text-ink-muted space-y-0.5">
          <div className="flex justify-between">
            <span>{STRINGS.capex.phase1}</span>
            <span className="font-medium text-ink">
              {formatNumber(phase1.clusters)} ODP
            </span>
          </div>
          <div className="flex justify-between">
            <span>{STRINGS.capex.blendedPayback}</span>
            <span className="font-medium text-ink">
              {formatMonths(capex.blendedPaybackMonths)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] text-ink-subtle mb-1.5">
          {STRINGS.capex.phase}
        </div>
        <div className="flex rounded-full border border-line bg-paper-sunken p-0.5 text-[11px]">
          {PHASES.map((p) => {
            const active = activePhase === p.value
            return (
              <button
                key={String(p.value)}
                onClick={() => setActivePhase(p.value)}
                className={[
                  'flex-1 px-2 py-1 rounded-full transition',
                  active
                    ? 'bg-paper-card text-ink shadow-sm'
                    : 'text-ink-subtle hover:text-ink',
                ].join(' ')}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
