import { useFiltersStore } from '@/store/filters'
import { CITY_LABELS, type City } from '@/types/domain'

const CITIES: City[] = ['KOTA_BANDUNG', 'KOTA_CIMAHI', 'KAB_BANDUNG_BARAT']

export function CityFilter() {
  const cities = useFiltersStore((s) => s.cities)
  const toggle = useFiltersStore((s) => s.toggleCity)

  return (
    <div className="flex flex-wrap gap-1.5">
      {CITIES.map((c) => {
        const active = cities.has(c)
        return (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={[
              'pill transition text-[11px]',
              active
                ? '!bg-ink !text-paper !border-ink'
                : '!bg-paper-sunken !text-ink-subtle hover:!text-ink',
            ].join(' ')}
          >
            {CITY_LABELS[c]}
          </button>
        )
      })}
    </div>
  )
}
