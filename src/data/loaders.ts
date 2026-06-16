import type { FeatureCollection, Polygon, MultiPolygon, LineString } from 'geojson'
import type {
  PoI,
  SupplyPoint,
  FiberCable,
  RoadGraphData,
  PopSite,
  ConstraintFeature,
  ConstraintProps,
  DemandFeature,
  IncumbentFeature,
} from '@/types/domain'

/**
 * Fetch JSON yang boleh tidak ada (file v2 di-generate bertahap).
 * Mengembalikan `fallback` jika 404 / gagal — degradasi anggun (§1.9),
 * app harus selalu bisa jalan walau layer real belum di-generate.
 */
async function fetchOptional<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url)
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

export type BoundaryCollection = FeatureCollection<
  Polygon | MultiPolygon,
  { city: string; name: string }
>

export async function loadBoundaries(): Promise<BoundaryCollection> {
  const res = await fetch('/data/admin-boundaries.geojson')
  if (!res.ok) throw new Error(`admin-boundaries ${res.status}`)
  return (await res.json()) as BoundaryCollection
}

export async function loadPoI(): Promise<PoI[]> {
  const res = await fetch('/data/poi.json')
  if (!res.ok) throw new Error(`poi ${res.status}`)
  return (await res.json()) as PoI[]
}

export async function loadSupply(): Promise<SupplyPoint[]> {
  const res = await fetch('/data/supply.json')
  if (!res.ok) throw new Error(`supply ${res.status}`)
  return (await res.json()) as SupplyPoint[]
}

export async function loadFiberCables(): Promise<FiberCable[]> {
  const res = await fetch('/data/fiber-cables.geojson')
  if (!res.ok) throw new Error(`fiber-cables ${res.status}`)
  const fc = (await res.json()) as FeatureCollection<
    LineString,
    {
      id: string
      fromSupplyId: string
      toSupplyId: string
      city: FiberCable['city']
      lengthM: number
    }
  >
  return fc.features.map((f) => ({
    id: f.properties.id,
    fromSupplyId: f.properties.fromSupplyId,
    toSupplyId: f.properties.toSupplyId,
    city: f.properties.city,
    lengthM: f.properties.lengthM,
    geometry: f.geometry,
  }))
}

// ── Loader v2 (degradasi anggun bila file belum di-generate) ─────────

export async function loadRoadGraph(): Promise<RoadGraphData | null> {
  return fetchOptional<RoadGraphData | null>('/data/road-graph.json', null)
}

export async function loadPopSites(): Promise<PopSite[]> {
  return fetchOptional<PopSite[]>('/data/pop-sites.json', [])
}

export async function loadConstraints(): Promise<ConstraintFeature[]> {
  const fc = await fetchOptional<FeatureCollection<
    Polygon | MultiPolygon,
    ConstraintProps
  > | null>('/data/constraints.geojson', null)
  return (fc?.features as ConstraintFeature[] | undefined) ?? []
}

export async function loadDemandGrid(): Promise<DemandFeature[]> {
  const fc = await fetchOptional<FeatureCollection<
    Polygon,
    DemandFeature['properties']
  > | null>('/data/population-grid.geojson', null)
  return (fc?.features as DemandFeature[] | undefined) ?? []
}

export async function loadIncumbentGrid(): Promise<IncumbentFeature[]> {
  const fc = await fetchOptional<FeatureCollection<
    Polygon,
    IncumbentFeature['properties']
  > | null>('/data/incumbent-coverage.geojson', null)
  return (fc?.features as IncumbentFeature[] | undefined) ?? []
}

export interface AllData {
  boundaries: BoundaryCollection
  poi: PoI[]
  supply: SupplyPoint[]
  cables: FiberCable[]
  // ── v2 (opsional; [] / null bila belum di-generate) ──
  roadGraph: RoadGraphData | null
  popSites: PopSite[]
  demandGrid: DemandFeature[]
  incumbentGrid: IncumbentFeature[]
}

export async function loadAll(): Promise<AllData> {
  const [
    boundaries,
    poi,
    supply,
    cables,
    roadGraph,
    popSites,
    demandGrid,
    incumbentGrid,
  ] = await Promise.all([
    loadBoundaries(),
    loadPoI(),
    loadSupply(),
    loadFiberCables(),
    loadRoadGraph(),
    loadPopSites(),
    loadDemandGrid(),
    loadIncumbentGrid(),
  ])
  return {
    boundaries,
    poi,
    supply,
    cables,
    roadGraph,
    popSites,
    demandGrid,
    incumbentGrid,
  }
}
