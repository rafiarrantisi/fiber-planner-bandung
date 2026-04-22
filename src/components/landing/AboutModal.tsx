import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { STRINGS } from '@/lib/i18n-strings'

interface Props {
  open: boolean
  onClose: () => void
}

export function AboutModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[2100] bg-ink/30 backdrop-blur-sm grid place-items-center p-6"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 12, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-paper-card rounded-xl shadow-floatCard border border-line w-[620px] max-w-full p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-subtle font-medium mb-1">
                  Tentang Proyek
                </div>
                <h3 className="font-display text-2xl text-ink leading-tight">
                  {STRINGS.brand.product}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-full hover:bg-paper-sunken transition"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm text-ink-muted leading-relaxed">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-subtle mb-1">
                  Dibuat oleh
                </div>
                <div className="text-ink font-medium">
                  {STRINGS.brand.author}
                </div>
                <div className="text-ink-subtle text-xs">
                  {STRINGS.brand.affiliation}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-subtle mb-1">
                  Ruang Lingkup
                </div>
                <p>{STRINGS.about.scope}</p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-subtle mb-1">
                  Teknologi
                </div>
                <p>
                  React · TypeScript · Vite · Leaflet · Turf.js · ml-kmeans ·
                  Recharts · Tailwind · Framer Motion · Zustand · OSRM
                </p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-subtle mb-1">
                  Catatan
                </div>
                <p>{STRINGS.about.disclaimer}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
