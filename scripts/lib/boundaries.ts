import { promises as fs } from 'node:fs'
import path from 'node:path'
import type {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
} from 'geojson'
import type { City } from '../../src/types/domain'

const CACHE_DIR = path.resolve('scripts/.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'boundaries.json')
const OUTPUT_FILE = path.resolve('public/data/admin-boundaries.geojson')

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA = 'fiber-planner-bandung/0.1 (showcase demo)'

const QUERIES: Record<City, string> = {
  KOTA_BANDUNG: 'Kota Bandung, Jawa Barat, Indonesia',
  KOTA_CIMAHI: 'Kota Cimahi, Jawa Barat, Indonesia',
  KAB_BANDUNG_BARAT: 'Kabupaten Bandung Barat, Jawa Barat, Indonesia',
}

export type BoundaryGeometry = Polygon | MultiPolygon
export interface BoundaryFeature extends Feature<BoundaryGeometry> {
  properties: { city: City; name: string }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchBoundary(city: City): Promise<BoundaryFeature> {
  const q = QUERIES[city]
  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&polygon_geojson=1&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })

  if (!res.ok) {
    throw new Error(`Nominatim ${res.status} for ${city}`)
  }

  const data = (await res.json()) as Array<{
    display_name: string
    geojson: BoundaryGeometry
  }>

  if (!data[0]?.geojson) {
    throw new Error(`No geojson returned for ${city}`)
  }

  return {
    type: 'Feature',
    properties: { city, name: data[0].display_name.split(',')[0] },
    geometry: data[0].geojson,
  }
}

export async function loadBoundaries(): Promise<FeatureCollection<BoundaryGeometry>> {
  await fs.mkdir(CACHE_DIR, { recursive: true })

  try {
    const cached = await fs.readFile(CACHE_FILE, 'utf8')
    return JSON.parse(cached) as FeatureCollection<BoundaryGeometry>
  } catch {
    // proceed to fetch
  }

  const features: BoundaryFeature[] = []
  for (const city of Object.keys(QUERIES) as City[]) {
    console.log(`  → fetching boundary: ${city}`)
    const feat = await fetchBoundary(city)
    features.push(feat)
    await sleep(1100)
  }

  const collection: FeatureCollection<BoundaryGeometry> = {
    type: 'FeatureCollection',
    features,
  }

  await fs.writeFile(CACHE_FILE, JSON.stringify(collection))
  return collection
}

export async function writeBoundariesOutput(
  fc: FeatureCollection<BoundaryGeometry>,
): Promise<void> {
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(fc))
}
