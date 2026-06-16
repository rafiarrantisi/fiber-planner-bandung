import { STRINGS } from '@/lib/i18n-strings'

type Status = 'real' | 'derived' | 'approx' | 'modeled' | 'synthetic' | 'illustrative'

const STATUS_STYLE: Record<Status, { label: string; cls: string }> = {
  real: { label: STRINGS.provenance.statusReal, cls: 'bg-emerald-100 text-emerald-700' },
  derived: {
    label: STRINGS.provenance.statusDerived,
    cls: 'bg-emerald-50 text-emerald-600',
  },
  approx: { label: STRINGS.provenance.statusApprox, cls: 'bg-amber-100 text-amber-700' },
  modeled: { label: STRINGS.provenance.statusModeled, cls: 'bg-sky-100 text-sky-700' },
  synthetic: {
    label: STRINGS.provenance.statusSynthetic,
    cls: 'bg-stone-200 text-stone-600',
  },
  illustrative: {
    label: STRINGS.provenance.statusIllustrative,
    cls: 'bg-violet-100 text-violet-700',
  },
}

const ROWS: { layer: string; status: Status; source: string }[] = [
  { layer: 'Batas administrasi', status: 'real', source: 'GADM L2 / Nominatim' },
  {
    layer: 'Jaringan jalan / graph',
    status: 'real',
    source: 'OpenStreetMap © OpenStreetMap contributors',
  },
  {
    layer: 'Kendala — militer / rel / tol / HSR / air',
    status: 'derived',
    source: 'OSM tags + buffer RoW',
  },
  {
    layer: 'Kendala — KKOP Husein',
    status: 'approx',
    source: 'Aproksimasi parameter KKOP publik (bukan poligon resmi)',
  },
  {
    layer: 'Kendala — kawasan cagar budaya',
    status: 'approx',
    source: 'Hand-curated dari landmark + Perda (indikatif)',
  },
  {
    layer: 'Grid populasi / demand',
    status: 'modeled',
    source: 'H3 dimodelkan dari densitas OSM, dikalibrasi total BPS',
  },
  {
    layer: 'Cakupan incumbent',
    status: 'modeled',
    source: 'Proxy densitas supply (tak ada data publik footprint ISP)',
  },
  { layer: 'Supply (ODP / menara)', status: 'synthetic', source: 'Seeded RNG' },
  {
    layer: 'PoI + revenue / kapasitas',
    status: 'synthetic',
    source: 'Seeded RNG (demo metodologi)',
  },
  {
    layer: 'Tarif biaya konstruksi',
    status: 'illustrative',
    source: 'Rasio FBA 2024/2025; absolut perlu kalibrasi',
  },
]

export function ProvenanceTable() {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <table className="w-full text-xs">
        <thead className="bg-paper-sunken text-ink-subtle">
          <tr>
            <th className="text-left px-3 py-2 font-medium">Layer</th>
            <th className="text-left px-3 py-2 font-medium">Status</th>
            <th className="text-left px-3 py-2 font-medium">Sumber</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.layer} className="border-t border-line align-top">
              <td className="px-3 py-2 text-ink font-medium">{r.layer}</td>
              <td className="px-3 py-2">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap ${STATUS_STYLE[r.status].cls}`}
                >
                  {STATUS_STYLE[r.status].label}
                </span>
              </td>
              <td className="px-3 py-2 text-ink-subtle leading-snug">{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
