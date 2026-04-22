import { Network } from 'lucide-react'
import { STRINGS } from '@/lib/i18n-strings'

export function Header() {
  return (
    <header className="sticky top-0 z-[1000] bg-paper/85 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-[1600px] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-ink text-paper grid place-items-center">
            <Network className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-ink text-lg">
              {STRINGS.brand.product}
            </div>
            <div className="text-xs text-ink-subtle">
              oleh {STRINGS.brand.author}
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <a
            href="#dashboard"
            className="px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunken transition"
          >
            {STRINGS.nav.dashboard}
          </a>
          <a
            href="#metodologi"
            className="px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunken transition"
          >
            {STRINGS.nav.methodology}
          </a>
          <a
            href="#tentang"
            className="px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-paper-sunken transition"
          >
            {STRINGS.nav.about}
          </a>
        </nav>
      </div>
    </header>
  )
}
