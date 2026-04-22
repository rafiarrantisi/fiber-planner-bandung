import { useFiltersStore, type FoStatusFilter as FoVal } from '@/store/filters'
import { STRINGS } from '@/lib/i18n-strings'

const OPTIONS: { value: FoVal; label: string }[] = [
  { value: 'ALL', label: STRINGS.sidebar.foAll },
  { value: 'FO_READY', label: STRINGS.sidebar.foReady },
  { value: 'NON_FO', label: STRINGS.sidebar.nonFo },
]

export function FoStatusFilter() {
  const value = useFiltersStore((s) => s.foStatus)
  const set = useFiltersStore((s) => s.setFoStatus)

  return (
    <div className="flex rounded-full border border-line bg-paper-sunken p-0.5 text-xs">
      {OPTIONS.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            onClick={() => set(o.value)}
            className={[
              'flex-1 px-3 py-1.5 rounded-full transition',
              active
                ? 'bg-paper-card text-ink shadow-sm'
                : 'text-ink-subtle hover:text-ink',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
