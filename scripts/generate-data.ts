import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loadBoundaries, writeBoundariesOutput } from './lib/boundaries'
import { seedPoI } from './lib/seed-poi'
import { seedSupply } from './lib/seed-supply'
import { routeFiberCables } from './lib/route-fiber'
import type { City } from '../src/types/domain'

const DATA_DIR = path.resolve('public/data')

const POI_COUNTS: Record<City, number> = {
  KOTA_BANDUNG: 2500,
  KOTA_CIMAHI: 600,
  KAB_BANDUNG_BARAT: 1200,
}

const SUPPLY_TARGETS = [
  { city: 'KOTA_BANDUNG' as City, odp: 250, menara: 50 },
  { city: 'KOTA_CIMAHI' as City, odp: 60, menara: 15 },
  { city: 'KAB_BANDUNG_BARAT' as City, odp: 120, menara: 30 },
]

const FIBER_K_NEIGHBORS = 2

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true })

  console.log('[1/4] Loading admin boundaries (Nominatim, cached)…')
  const boundaries = await loadBoundaries()
  await writeBoundariesOutput(boundaries)
  console.log(`  ✓ ${boundaries.features.length} boundaries written`)

  console.log('[2/4] Seeding PoI (demand)…')
  const poi = seedPoI(boundaries, POI_COUNTS, 'fiber-planner-poi-v1')
  await fs.writeFile(
    path.join(DATA_DIR, 'poi.json'),
    JSON.stringify(poi),
  )
  console.log(`  ✓ ${poi.length} PoI written`)

  console.log('[3/4] Seeding supply (ODP + menara fiberized)…')
  const supply = seedSupply(
    boundaries,
    SUPPLY_TARGETS,
    'fiber-planner-supply-v1',
  )
  await fs.writeFile(
    path.join(DATA_DIR, 'supply.json'),
    JSON.stringify(supply),
  )
  console.log(`  ✓ ${supply.length} supply points written`)

  console.log('[4/4] Routing fiber cables via OSRM (cached; may take a while on first run)…')
  const cables = await routeFiberCables(supply, FIBER_K_NEIGHBORS)
  await fs.writeFile(
    path.join(DATA_DIR, 'fiber-cables.geojson'),
    JSON.stringify({
      type: 'FeatureCollection',
      features: cables.map((c) => ({
        type: 'Feature',
        properties: {
          id: c.id,
          fromSupplyId: c.fromSupplyId,
          toSupplyId: c.toSupplyId,
          city: c.city,
          lengthM: c.lengthM,
        },
        geometry: c.geometry,
      })),
    }),
  )
  console.log(`  ✓ ${cables.length} fiber cables written`)

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
