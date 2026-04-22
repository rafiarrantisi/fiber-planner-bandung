import type { FeatureCollection, Polygon, MultiPolygon, LineString } from 'geojson'
import type { PoI, SupplyPoint, FiberCable } from '@/types/domain'

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

export interface AllData {
  boundaries: BoundaryCollection
  poi: PoI[]
  supply: SupplyPoint[]
  cables: FiberCable[]
}

export async function loadAll(): Promise<AllData> {
  const [boundaries, poi, supply, cables] = await Promise.all([
    loadBoundaries(),
    loadPoI(),
    loadSupply(),
    loadFiberCables(),
  ])
  return { boundaries, poi, supply, cables }
}
