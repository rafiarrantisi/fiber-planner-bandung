import { STRINGS } from '@/lib/i18n-strings'

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-[1600px] px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-ink-subtle">
        <div>
          <div className="text-ink-muted">
            © {new Date().getFullYear()} {STRINGS.brand.author} ·{' '}
            {STRINGS.brand.affiliation}
          </div>
          <div className="mt-1">{STRINGS.about.disclaimer}</div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/"
            className="hover:text-ink transition"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/"
            className="hover:text-ink transition"
            target="_blank"
            rel="noreferrer noopener"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  )
}
