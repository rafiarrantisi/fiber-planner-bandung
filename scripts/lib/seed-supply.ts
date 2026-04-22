import * as turf from '@turf/turf'
import type { Feature, FeatureCollection } from 'geojson'
import type { City, SupplyPoint, SupplyType } from '../../src/types/domain'
import { createRng } from './utils/random'
import { densityAt } from './density'
import type { BoundaryGeometry } from './boundaries'

interface SupplyTarget {
  city: City
  odp: number
  menara: number
}

const MIN_INTER_ODP_M = 120
const MIN_INTER_MENARA_M = 350

function distanceM(a: [number, number], b: [number, number]): number {
  return turf.distance(turf.point(a), turf.point(b), { units: 'meters' })
}

function tooCloseTo(
  candidate: [number, number],
  others: SupplyPoint[],
  minM: number,
): boolean {
  for (const o of others) {
    if (distanceM(candidate, [o.lng, o.lat]) < minM) return true
  }
  return false
}

function seedOne(
  feature: Feature<BoundaryGeometry>,
  city: City,
  type: SupplyType,
  count: number,
  existing: SupplyPoint[],
  seedOffset: number,
  rng: ReturnType<typeof createRng>,
): SupplyPoint[] {
  const bbox = turf.bbox(feature) as [number, number, number, number]
  const minM = type === 'ODP' ? MIN_INTER_ODP_M : MIN_INTER_MENARA_M

  const produced: SupplyPoint[] = []
  let safety = 0
  const maxAttempts = count * 120

  while (produced.length < count && safety < maxAttempts) {
    safety++
    const lng = rng.range(bbox[0], bbox[2])
    const lat = rng.range(bbox[1], bbox[3])
    const pt = turf.point([lng, lat])
    if (!turf.booleanPointInPolygon(pt, feature.geometry)) continue

    const density = densityAt(lat, lng, city)
    // Supply skewed harder toward density centers
    if (rng.next() > Math.min(1, density * 1.3)) continue

    if (tooCloseTo([lng, lat], [...existing, ...produced], minM)) continue

    const idx = seedOffset + produced.length + 1
    const name =
      type === 'ODP'
        ? `ODP-${city.split('_')[0]}-${idx.toString().padStart(4, '0')}`
        : `Menara Fiberized ${city.split('_')[0]}-${idx.toString().padStart(3, '0')}`

    const maxPorts = type === 'ODP' ? rng.pick([8, 16] as const) : 48
    const usedPorts = Math.floor(rng.range(0.3, 0.9) * maxPorts)

    produced.push({
      id: `sup-${type.toLowerCase()}-${city}-${idx}`,
      type,
      name,
      city,
      lat,
      lng,
      maxPorts,
      usedPorts,
    })
  }

  return produced
}

export function seedSupply(
  boundaries: FeatureCollection<BoundaryGeometry>,
  targets: SupplyTarget[],
  seed: string,
): SupplyPoint[] {
  const rng = createRng(seed)
  const all: SupplyPoint[] = []

  for (const t of targets) {
    const feature = boundaries.features.find(
      (f) => (f.properties as { city: City }).city === t.city,
    )
    if (!feature) continue

    const odps = seedOne(feature, t.city, 'ODP', t.odp, all, 0, rng)
    all.push(...odps)

    const menaras = seedOne(feature, t.city, 'MENARA_FIBERIZED', t.menara, all, 0, rng)
    all.push(...menaras)
  }

  return all
}
