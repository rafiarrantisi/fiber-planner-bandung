import { STRINGS } from '@/lib/i18n-strings'
import { LayerToggles } from './LayerToggles'
import { CategoryFilter } from './CategoryFilter'
import { FoStatusFilter } from './FoStatusFilter'
import { CityFilter } from './CityFilter'

function SectionHead({ title }: { title: string }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-ink-subtle font-medium">
      {title}
    </div>
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
