import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  cellToBoundary,
  cellToLatLng,
  latLngToCell,
  polygonToCells,
} from 'h3-js'
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from 'geojson'
import type {
  City,
  PoI,
  SupplyPoint,
  Wilayah,
} from '../../src/types/domain'
import { WILAYAH_BY_CITY } from '../../src/types/domain'
import { createRng } from './utils/random'

const POP_GRID_FILE = path.resolve('public/data/population-grid.geojson')
const INCUMBENT_FILE = path.resolve('public/data/incumbent-coverage.geojson')

const H3_RES = 8 // ~0.46 km edge; mirror H3_RESOLUTION di constants
const AVG_HH_SIZE = 3.8

// Total populasi resmi (≈ BPS 2023) untuk kalibrasi distribusi.
const POP_TOTAL: Record<Wilayah, number> = {
  kota_bandung: 2_450_000,
  kota_cimahi: 570_000,
  kab_bandung_barat: 1_750_000,
}

interface CellAgg {
  cell: string
  wilayah: Wilayah
  poiCount: number
  supplyCount: number
  fiberCount: number
}

async function loadJson<T>(p: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.resolve(p), 'utf8')) as T
}

function ringsOf(geom: Polygon | MultiPolygon): number[][][] {
  // Kembalikan array of outer rings (GeoJSON [lng,lat]) untuk polygonToCells
  if (geom.type === 'Polygon') return [geom.coordinates[0]]
  return geom.coordinates.map((poly) => poly[0])
}

export async function buildDemand(): Promise<void> {
  const boundaries = await loadJson<
    FeatureCollection<Polygon | MultiPolygon, { city: City }>
  >('public/data/admin-boundaries.geojson')
  const poi = await loadJson<PoI[]>('public/data/poi.json')
  const supply = await loadJson<SupplyPoint[]>('public/data/supply.json')

  // 1. Kumpulkan sel H3 per wilayah (dedup)
  const cellWilayah = new Map<string, Wilayah>()
  for (const f of boundaries.features) {
    const wil = WILAYAH_BY_CITY[f.properties.city]
    for (const ring of ringsOf(f.geometry)) {
      const cells = polygonToCells([ring], H3_RES, true)
      for (const c of cells) if (!cellWilayah.has(c)) cellWilayah.set(c, wil)
    }
  }
  console.log(`  → ${cellWilayah.size} sel H3 (res ${H3_RES})`)

  // 2. Agregasi PoI & supply per sel
  const agg = new Map<string, CellAgg>()
  const ensure = (cell: string): CellAgg => {
    let a = agg.get(cell)
    if (!a) {
      a = {
        cell,
        wilayah: cellWilayah.get(cell)!,
        poiCount: 0,
        supplyCount: 0,
        fiberCount: 0,
      }
      agg.set(cell, a)
    }
    return a
  }
  for (const c of cellWilayah.keys()) ensure(c)

  for (const p of poi) {
    const c = latLngToCell(p.lat, p.lng, H3_RES)
    if (cellWilayah.has(c)) ensure(c).poiCount++
  }
  for (const s of supply) {
    const c = latLngToCell(s.lat, s.lng, H3_RES)
    if (!cellWilayah.has(c)) continue
    const a = ensure(c)
    a.supplyCount++
    if (s.type === 'MENARA_FIBERIZED') a.fiberCount++
  }

  // 3. Bobot per sel (PoI density + baseline) → distribusi populasi terkalibrasi
  const rng = createRng('fiber-demand-v1')
  const cellsByWil = new Map<Wilayah, CellAgg[]>()
  for (const a of agg.values()) {
    const arr = cellsByWil.get(a.wilayah) ?? []
    arr.push(a)
    cellsByWil.set(a.wilayah, arr)
  }

  const popFeatures: Feature<Polygon, Record<string, unknown>>[] = []
  const incFeatures: Feature<Polygon, Record<string, unknown>>[] = []

  let maxIncumbentRaw = 0
  const incumbentRaw = new Map<string, number>()

  for (const [wil, cells] of cellsByWil) {
    const weights = cells.map((a) => {
      const base = 0.4 // baseline agar area tanpa PoI tetap berpenghuni
      const w = base + a.poiCount + 0.3 * a.supplyCount
      return w * (0.8 + 0.4 * rng.next()) // jitter ±20%
    })
    const sumW = weights.reduce((s, w) => s + w, 0)
    const totalHh = POP_TOTAL[wil] / AVG_HH_SIZE

    cells.forEach((a, i) => {
      const householdEst = Math.max(1, Math.round((totalHh * weights[i]) / sumW))
      const popEst = Math.round(householdEst * AVG_HH_SIZE)
      const [lat, lng] = cellToLatLng(a.cell)
      const boundary = cellToBoundary(a.cell, true) // [lng,lat] closed? perlu tutup
      const ring = [...boundary]
      if (
        ring.length &&
        (ring[0][0] !== ring[ring.length - 1][0] ||
          ring[0][1] !== ring[ring.length - 1][1])
      ) {
        ring.push(ring[0])
      }
      const geom: Polygon = { type: 'Polygon', coordinates: [ring] }

      popFeatures.push({
        type: 'Feature',
        geometry: geom,
        properties: {
          h3: a.cell,
          householdEst,
          popEst,
          wilayah: wil,
          source: 'modeled_from_osm_poi_density (BPS totals)',
          realData: false,
          lat,
          lng,
        },
      })

      // incumbent proxy: fiber & populasi padat → diasumsikan sudah dilayani
      const raw = a.fiberCount + 0.7 * a.supplyCount + 0.0000015 * popEst
      incumbentRaw.set(a.cell, raw)
      if (raw > maxIncumbentRaw) maxIncumbentRaw = raw
    })
  }

  // 4. Normalisasi incumbentScore 0..1
  for (const a of agg.values()) {
    const raw = incumbentRaw.get(a.cell) ?? 0
    const score = maxIncumbentRaw > 0 ? raw / maxIncumbentRaw : 0
    const boundary = cellToBoundary(a.cell, true)
    const ring = [...boundary]
    if (
      ring.length &&
      (ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1])
    ) {
      ring.push(ring[0])
    }
    incFeatures.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {
        h3: a.cell,
        incumbentScore: Math.round(score * 1000) / 1000,
        method: 'modeled_from_supply_density',
        realData: false,
      },
    })
  }

  await fs.writeFile(
    POP_GRID_FILE,
    JSON.stringify({ type: 'FeatureCollection', features: popFeatures }),
  )
  await fs.writeFile(
    INCUMBENT_FILE,
    JSON.stringify({ type: 'FeatureCollection', features: incFeatures }),
  )

  const totalHh = popFeatures.reduce(
    (s, f) => s + (f.properties.householdEst as number),
    0,
  )
  console.log(
    `  ✓ population-grid.geojson: ${popFeatures.length} hex, ${totalHh.toLocaleString('id-ID')} RT`,
  )
  console.log(`  ✓ incumbent-coverage.geojson: ${incFeatures.length} hex`)
}
