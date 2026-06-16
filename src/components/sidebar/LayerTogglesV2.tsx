import { useMapUiStore, type V2LayerToggles } from '@/store/map-ui'
import { STRINGS } from '@/lib/i18n-strings'

const ITEMS: { key: keyof V2LayerToggles; label: string }[] = [
  { key: 'showFeeder', label: STRINGS.topology.feederLayer },
  { key: 'showRerouteFlags', label: STRINGS.routing.rerouted },
  { key: 'showDemandHeat', label: STRINGS.demand.heatLayer },
  { key: 'showPhaseColors', label: STRINGS.capex.phaseColors },
  { key: 'showRoadGraphDebug', label: STRINGS.routing.graphDebug },
]

const DEMAND_MODES = [
  { value: 'household' as const, label: STRINGS.demand.modeHousehold },
  { value: 'whitespace' as const, label: STRINGS.demand.modeWhitespace },
]

export function LayerTogglesV2() {
  const v2 = useMapUiStore((s) => s.v2Layers)
  const toggle = useMapUiStore((s) => s.toggleV2Layer)
  const demandMode = useMapUiStore((s) => s.demandHeatMode)
  const setDemandMode = useMapUiStore((s) => s.setDemandHeatMode)

  return (
    <div className="space-y-1.5">
      {ITEMS.map(({ key, label }) => (
        <div key={key}>
          <label className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={v2[key]}
              onChange={() => toggle(key)}
              className="h-4 w-4 rounded border-line text-ink focus:ring-ink"
            />
            <span>{label}</span>
          </label>
          {key === 'showDemandHeat' && v2.showDemandHeat && (
            <div className="ml-6 mt-1.5 flex rounded-full border border-line bg-paper-sunken p-0.5 text-[11px]">
              {DEMAND_MODES.map((m) => {
                const active = demandMode === m.value
                return (
                  <button
                    key={m.value}
                    onClick={() => setDemandMode(m.value)}
                    className={[
                      'flex-1 px-2 py-1 rounded-full transition',
                      active
                        ? 'bg-paper-card text-ink shadow-sm'
                        : 'text-ink-subtle hover:text-ink',
                    ].join(' ')}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          )}
          {key === 'showDemandHeat' &&
            v2.showDemandHeat &&
            demandMode === 'whitespace' && (
              <p className="ml-6 mt-1.5 text-[10px] leading-snug text-ink-subtle">
                {STRINGS.demand.incumbentNote}
              </p>
            )}
        </div>
      ))}
    </div>
  )
}
