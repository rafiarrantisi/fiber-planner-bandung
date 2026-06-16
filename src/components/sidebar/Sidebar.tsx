import { STRINGS } from '@/lib/i18n-strings'
import { LayerToggles } from './LayerToggles'
import { CategoryFilter } from './CategoryFilter'
import { FoStatusFilter } from './FoStatusFilter'
import { CityFilter } from './CityFilter'
import { ConstraintPanel } from './ConstraintPanel'
import { LayerTogglesV2 } from './LayerTogglesV2'
import { CapexPanel } from './CapexPanel'
import { useMapUiStore } from '@/store/map-ui'

function SectionHead({ title }: { title: string }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle font-medium">
      {title}
    </div>
  )
}

function ConstraintSectionHead() {
  const show = useMapUiStore((s) => s.v2Layers.showConstraints)
  const toggle = useMapUiStore((s) => s.toggleV2Layer)
  return (
    <label className="flex items-center justify-between cursor-pointer select-none">
      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle font-medium">
        {STRINGS.constraints.panelTitle}
      </span>
      <input
        type="checkbox"
        checked={show}
        onChange={() => toggle('showConstraints')}
        className="h-4 w-4 rounded border-line text-ink focus:ring-ink"
      />
    </label>
  )
}

export function Sidebar() {
  return (
    <aside className="w-[280px] shrink-0 border-r border-line bg-paper-card overflow-y-auto">
      <div className="p-5 space-y-6">
        <div className="space-y-2">
          <SectionHead title={STRINGS.sidebar.layers} />
          <LayerToggles />
        </div>
        <div className="space-y-2">
          <SectionHead title={STRINGS.topology.title} />
          <LayerTogglesV2 />
        </div>
        <div className="rule-line" />
        <div className="space-y-2">
          <SectionHead title={STRINGS.capex.panelTitle} />
          <CapexPanel />
        </div>
        <div className="rule-line" />
        <div className="space-y-3">
          <ConstraintSectionHead />
          <ConstraintPanel />
        </div>
        <div className="rule-line" />
        <div className="space-y-2">
          <SectionHead title={STRINGS.sidebar.city} />
          <CityFilter />
        </div>
        <div className="space-y-2">
          <SectionHead title={STRINGS.sidebar.foStatus} />
          <FoStatusFilter />
        </div>
        <div className="space-y-2">
          <SectionHead title={STRINGS.sidebar.category} />
          <CategoryFilter />
        </div>
      </div>
    </aside>
  )
}
