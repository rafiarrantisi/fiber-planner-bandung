import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type { Feature, LineString, MultiPolygon, Polygon, Position } from 'geojson'

const CACHE_DIR = path.resolve('scripts/.cache/overpass')
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
const UA = 'fiber-planner-bandung/0.2 (showcase demo; constraint layer)'

interface OverpassNode {
  type: 'node'
  id: number
  lat: number
  lon: number
  tags?: Record<string, string>
}
interface OverpassWay {
  type: 'way'
  id: number
  geometry?: { lat: number; lon: number }[]
  tags?: Record<string, string>
}
interface OverpassRelationMember {
  type: string
  role: string
  geometry?: { lat: number; lon: number }[]
}
interface OverpassRelation {
  type: 'relation'
  id: number
  members?: OverpassRelationMember[]
  tags?: Record<string, string>
}
type OverpassElement = OverpassNode | OverpassWay | OverpassRelation
interface OverpassResponse {
  elements: OverpassElement[]
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cacheKey(ql: string): string {
  return createHash('sha1').update(ql).digest('hex').slice(0, 16)
}

/** Query Overpass dengan cache file lokal (deterministik re-run). */
export async function overpassQuery(ql: string): Promise<OverpassResponse> {
  await fs.mkdir(CACHE_DIR, { recursive: true })
  const file = path.join(CACHE_DIR, `${cacheKey(ql)}.json`)
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as OverpassResponse
  } catch {
    // miss → fetch
  }

  let lastErr: unknown
  for (const endpoint of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': UA,
          },
          body: `data=${encodeURIComponent(ql)}`,
        })
        if (!res.ok) throw new Error(`Overpass ${res.status}`)
        const data = (await res.json()) as OverpassResponse
        await fs.writeFile(file, JSON.stringify(data))
        await sleep(1200) // hormati rate-limit
        return data
      } catch (err) {
        lastErr = err
        await sleep(2500)
      }
    }
  }
  throw new Error(
    `Overpass gagal di semua endpoint: ${String(
      lastErr instanceof Error ? lastErr.message : lastErr,
    )}`,
  )
}

function ring(geometry: { lat: number; lon: number }[]): Position[] {
  return geometry.map((g) => [g.lon, g.lat] as Position)
}

function isClosed(geom: { lat: number; lon: number }[]): boolean {
  if (geom.length < 4) return false
  const a = geom[0]
  const b = geom[geom.length - 1]
  return a.lat === b.lat && a.lon === b.lon
}

/**
 * Konversi elemen Overpass (`out geom`) → GeoJSON Feature kasar.
 * - way tertutup → Polygon; way terbuka → LineString
 * - relation multipolygon → MultiPolygon dari member outer (abaikan hole)
 */
export function elementsToFeatures(
  res: OverpassResponse,
): Feature<Polygon | MultiPolygon | LineString>[] {
  const out: Feature<Polygon | MultiPolygon | LineString>[] = []

  for (const el of res.elements) {
    if (el.type === 'way' && el.geometry && el.geometry.length >= 2) {
      const coords = ring(el.geometry)
      if (isClosed(el.geometry)) {
        out.push({
          type: 'Feature',
          properties: { ...(el.tags ?? {}), osmId: `way/${el.id}` },
          geometry: { type: 'Polygon', coordinates: [coords] },
        })
      } else {
        out.push({
          type: 'Feature',
          properties: { ...(el.tags ?? {}), osmId: `way/${el.id}` },
          geometry: { type: 'LineString', coordinates: coords },
        })
      }
    } else if (el.type === 'relation' && el.members) {
      const polys: Position[][][] = []
      for (const m of el.members) {
        if (m.role === 'outer' && m.geometry && m.geometry.length >= 4) {
          polys.push([ring(m.geometry)])
        }
      }
      if (polys.length > 0) {
        out.push({
          type: 'Feature',
          properties: { ...(el.tags ?? {}), osmId: `relation/${el.id}` },
          geometry: { type: 'MultiPolygon', coordinates: polys },
        })
      }
    }
  }
  return out
}

export type { OverpassResponse }
