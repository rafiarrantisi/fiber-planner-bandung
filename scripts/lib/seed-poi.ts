import * as turf from '@turf/turf'
import type { Feature, FeatureCollection } from 'geojson'
import type {
  City,
  PoI,
  PoICategory,
  PoISubtype,
} from '../../src/types/domain'
import { createRng, type Rng } from './utils/random'
import { densityAt } from './density'
import { computeCapacityRevenue } from './capacity-revenue'
import type { BoundaryGeometry } from './boundaries'

const CATEGORY_DISTRIBUTION: { value: PoICategory; weight: number }[] = [
  { value: 'PENDIDIKAN', weight: 40 },
  { value: 'KESEHATAN', weight: 10 },
  { value: 'PEMERINTAHAN', weight: 15 },
  { value: 'NIAGA', weight: 20 },
  { value: 'LAYANAN_POS', weight: 5 },
  { value: 'MENARA_NON_FIBER', weight: 10 },
]

const SUBTYPES_BY_CATEGORY: Record<
  PoICategory,
  { value: PoISubtype; weight: number }[]
> = {
  PENDIDIKAN: [
    { value: 'SD', weight: 55 },
    { value: 'SMP', weight: 25 },
    { value: 'SMA', weight: 15 },
    { value: 'PT', weight: 5 },
  ],
  KESEHATAN: [
    { value: 'PUSKESMAS', weight: 80 },
    { value: 'RS', weight: 20 },
  ],
  PEMERINTAHAN: [
    { value: 'KELURAHAN', weight: 65 },
    { value: 'KECAMATAN', weight: 30 },
    { value: 'KABUPATEN', weight: 5 },
  ],
  NIAGA: [
    { value: 'PASAR', weight: 70 },
    { value: 'PUSAT_PERDAGANGAN', weight: 30 },
  ],
  LAYANAN_POS: [{ value: 'KANTOR_POS', weight: 100 }],
  MENARA_NON_FIBER: [{ value: 'MENARA', weight: 100 }],
}

const NAME_TEMPLATES: Record<PoISubtype, (i: number, area: string) => string> = {
  SD: (i, area) => `SDN ${area} ${i}`,
  SMP: (i, area) => `SMPN ${i} ${area}`,
  SMA: (i, area) => `SMAN ${i} ${area}`,
  PT: (i, area) => `Kampus ${area} ${i}`,
  PUSKESMAS: (_i, area) => `Puskesmas ${area}`,
  RS: (_i, area) => `RS ${area}`,
  KELURAHAN: (_i, area) => `Kantor Kelurahan ${area}`,
  KECAMATAN: (_i, area) => `Kantor Kecamatan ${area}`,
  KABUPATEN: (_i, area) => `Kantor Kabupaten ${area}`,
  PASAR: (_i, area) => `Pasar ${area}`,
  PUSAT_PERDAGANGAN: (_i, area) => `Plaza ${area}`,
  KANTOR_POS: (_i, area) => `Kantor Pos ${area}`,
  MENARA: (i, area) => `Menara ${area}-${String(i).padStart(3, '0')}`,
}

const AREA_POOL = [
  'Sukajadi', 'Cicendo', 'Coblong', 'Bandung Wetan', 'Lengkong', 'Regol',
  'Batununggal', 'Kiaracondong', 'Arcamanik', 'Ujung Berung', 'Cibiru',
  'Antapani', 'Buahbatu', 'Bojongloa', 'Astanaanyar', 'Sumur Bandung',
  'Andir', 'Cidadap', 'Mandalajati', 'Rancasari', 'Gedebage',
  'Cimahi Utara', 'Cimahi Tengah', 'Cimahi Selatan',
  'Ngamprah', 'Padalarang', 'Lembang', 'Cisarua', 'Parongpong', 'Batujajar',
  'Cipongkor', 'Cililin', 'Rongga', 'Gununghalu', 'Sindangkerta',
]

function randomPointInBbox(
  bbox: [number, number, number, number],
  rng: Rng,
): [number, number] {
  const [minX, minY, maxX, maxY] = bbox
  return [rng.range(minX, maxX), rng.range(minY, maxY)]
}

function samplePoint(
  polygon: Feature<BoundaryGeometry>,
  bbox: [number, number, number, number],
  city: City,
  rng: Rng,
  maxAttempts = 60,
): [number, number] | null {
  let maxDensityLocal = 0
  for (const c of Array.from({ length: 6 })) {
    void c
    const [lng, lat] = randomPointInBbox(bbox, rng)
    maxDensityLocal = Math.max(maxDensityLocal, densityAt(lat, lng, city))
  }
  const target = Math.max(maxDensityLocal, 0.1)

  for (let i = 0; i < maxAttempts; i++) {
    const [lng, lat] = randomPointInBbox(bbox, rng)
    const pt = turf.point([lng, lat])
    if (!turf.booleanPointInPolygon(pt, polygon.geometry)) continue

    const d = densityAt(lat, lng, city)
    if (rng.next() < d / target) return [lng, lat]
  }
  return null
}

export function seedPoI(
  boundaries: FeatureCollection<BoundaryGeometry>,
  counts: Record<City, number>,
  seed: string,
): PoI[] {
  const rng = createRng(seed)
  const poi: PoI[] = []
  const subtypeCounter: Record<PoISubtype, number> = {
    SD: 0, SMP: 0, SMA: 0, PT: 0,
    PUSKESMAS: 0, RS: 0,
    KELURAHAN: 0, KECAMATAN: 0, KABUPATEN: 0,
    PASAR: 0, PUSAT_PERDAGANGAN: 0,
    KANTOR_POS: 0, MENARA: 0,
  }

  for (const feature of boundaries.features) {
    const city = (feature.properties as { city: City }).city
    const target = counts[city]
    const bbox = turf.bbox(feature) as [number, number, number, number]

    let produced = 0
    let safety = 0
    while (produced < target && safety < target * 80) {
      safety++
      const p = samplePoint(feature, bbox, city, rng)
      if (!p) continue
      const [lng, lat] = p

      const category = rng.weightedPick(CATEGORY_DISTRIBUTION)
      const subtype = rng.weightedPick(SUBTYPES_BY_CATEGORY[category])
      subtypeCounter[subtype]++
      const area = rng.pick(AREA_POOL)
      const name = NAME_TEMPLATES[subtype](subtypeCounter[subtype], area)

      const { capacityMbps, monthlyRevenueIdr } = computeCapacityRevenue(
        subtype,
        rng,
      )

      poi.push({
        id: `poi-${city}-${produced.toString(36)}-${subtypeCounter[subtype]}`,
        name,
        category,
        subtype,
        city,
        lat,
        lng,
        capacityMbps,
        monthlyRevenueIdr,
      })
      produced++
    }
  }

  return poi
}
