import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import pLimit from 'p-limit'
import * as turf from '@turf/turf'
import type { LineString } from 'geojson'
import type { FiberCable, SupplyPoint } from '../../src/types/domain'

const CACHE_DIR = path.resolve('scripts/.cache/osrm')
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'
const limit = pLimit(1)

interface OsrmRoute {
  geometry: LineString
  distance: number
}

function hashKey(a: [number, number], b: [number, number]): string {
  const key = `${a[0].toFixed(5)},${a[1].toFixed(5)}|${b[0].toFixed(5)},${b[1].toFixed(5)}`
  return createHash('sha1').update(key).digest('hex').slice(0, 16)
}

async function readCache(key: string): Promise<OsrmRoute | null> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${key}.json`), 'utf8')
    return JSON.parse(raw) as OsrmRoute
  } catch {
    return null
  }
}

async function writeCache(key: string, route: OsrmRoute): Promise<void> {
  await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(route))
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function routeOnce(
  a: [number, number],
  b: [number, number],
  retries = 2,
): Promise<OsrmRoute | null> {
  const url = `${OSRM_BASE}/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url)
      if (res.status === 429) {
        await sleep(2500)
        continue
      }
      if (!res.ok) throw new Error(`OSRM ${res.status}`)
      const data = (await res.json()) as {
        routes?: Array<{ geometry: LineString; distance: number }>
      }
      const r = data.routes?.[0]
      if (!r) return null
      return { geometry: r.geometry, distance: r.distance }
    } catch (e: unknown) {
      if (attempt === retries) {
        console.warn(`  ! OSRM failed: ${(e as Error).message}`)
        return null
      }
      await sleep(1500)
    }
  }
  return null
}

function straightLine(
  a: [number, number],
  b: [number, number],
): OsrmRoute {
  const dist = turf.distance(turf.point(a), turf.point(b), { units: 'meters' })
  return {
    geometry: { type: 'LineString', coordinates: [a, b] },
    distance: dist,
  }
}

export async function routeFiberCables(
  supply: SupplyPoint[],
  k: number,
): Promise<FiberCable[]> {
  await fs.mkdir(CACHE_DIR, { recursive: true })

  const byCity = new Map<string, SupplyPoint[]>()
  for (const s of supply) {
    const arr = byCity.get(s.city) ?? []
    arr.push(s)
    byCity.set(s.city, arr)
  }

  const edges: Array<{ from: SupplyPoint; to: SupplyPoint }> = []
  const seen = new Set<string>()

  for (const list of byCity.values()) {
    for (const from of list) {
      const others = list
        .filter((o) => o.id !== from.id)
        .map((o) => ({
          o,
          d: turf.distance(
            turf.point([from.lng, from.lat]),
            turf.point([o.lng, o.lat]),
            { units: 'meters' },
          ),
        }))
        .sort((a, b) => a.d - b.d)
        .slice(0, k)

      for (const { o } of others) {
        const key = [from.id, o.id].sort().join('|')
        if (seen.has(key)) continue
        seen.add(key)
        edges.push({ from, to: o })
      }
    }
  }

  console.log(`  → routing ${edges.length} edges (cached requests reused)`)

  let processed = 0
  const REQUEST_DELAY_MS = 900

  const tasks = edges.map((edge) =>
    limit(async (): Promise<FiberCable | null> => {
      const a: [number, number] = [edge.from.lng, edge.from.lat]
      const b: [number, number] = [edge.to.lng, edge.to.lat]
      const key = hashKey(a, b)

      let route = await readCache(key)
      if (!route) {
        route = await routeOnce(a, b)
        if (route) {
          await writeCache(key, route)
        } else {
          route = straightLine(a, b)
        }
        await sleep(REQUEST_DELAY_MS)
      }

      processed++
      if (processed % 25 === 0) {
        console.log(`    ${processed}/${edges.length}`)
      }

      return {
        id: `cable-${edge.from.id}--${edge.to.id}`,
        fromSupplyId: edge.from.id,
        toSupplyId: edge.to.id,
        city: edge.from.city,
        lengthM: Math.round(route.distance),
        geometry: route.geometry,
      }
    }),
  )

  const results = await Promise.all(tasks)
  return results.filter((c): c is FiberCable => c !== null)
}
