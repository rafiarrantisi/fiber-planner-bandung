import { useFiltersStore, type LayerToggles as LayerTogglesType } from '@/store/filters'
import { STRINGS } from '@/lib/i18n-strings'

const ITEMS: { key: keyof LayerTogglesType; label: string }[] = [
  { key: 'boundary', label: STRINGS.sidebar.layerBoundary },
  { key: 'buffer', label: STRINGS.sidebar.layerBuffer },
  { key: 'fiber', label: STRINGS.sidebar.layerFiber },
  { key: 'supply', label: STRINGS.sidebar.layerSupply },
  { key: 'poi', label: STRINGS.sidebar.layerPoi },
  { key: 'clusters', label: STRINGS.sidebar.layerClusters },
]

export function LayerToggles() {
  const layers = useFiltersStore((s) => s.layers)
  const toggle = useFiltersStore((s) => s.toggleLayer)

  return (
    <div className="space-y-1.5">
      {ITEMS.map(({ key, label }) => (
        <label
          key={key}
          className="flex items-center gap-2.5 text-sm text-ink-muted hover:text-ink cursor-pointer select-none"
        >
          <input
            type="checkbox"
            checked={layers[key]}
            onChange={() => toggle(key)}
            className="h-4 w-4 rounded border-line text-ink focus:ring-ink"
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  )
}
