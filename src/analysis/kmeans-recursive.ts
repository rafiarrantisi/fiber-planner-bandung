import { kmeans } from 'ml-kmeans'
import * as turf from '@turf/turf'
import type { Cluster, PoI, SupplyPoint, City } from '@/types/domain'
import {
  KMEANS_MAX_DEPTH,
  KMEANS_MAX_DIST_M,
  KMEANS_SEED,
} from '@/lib/constants'

function haversineM(a: [number, number], b: [number, number]): number {
  return turf.distance(turf.point(a), turf.point(b), { units: 'meters' })
}

function maxInternalDistance(points: PoI[]): number {
  if (points.length <= 1) return 0

  if (points.length > 180) {
    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    const cLat = lats.reduce((a, b) => a + b, 0) / lats.length
    const cLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
    const center: [number, number] = [cLng, cLat]
    let maxFromCenter = 0
    for (const p of points) {
      const d = haversineM(center, [p.lng, p.lat])
      if (d > maxFromCenter) maxFromCenter = d
    }
    return 2 * maxFromCenter
  }

  let maxD = 0
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = haversineM(
        [points[i].lng, points[i].lat],
        [points[j].lng, points[j].lat],
      )
      if (d > maxD) maxD = d
    }
  }
  return maxD
}

function computeCentroid(points: PoI[]): { lat: number; lng: number } {
  let lat = 0
  let lng = 0
  for (const p of points) {
    lat += p.lat
    lng += p.lng
  }
  return { lat: lat / points.length, lng: lng / points.length }
}

function splitKMeans(points: PoI[], k: number, depth: number): PoI[][] {
  if (points.length <= 1 || depth > KMEANS_MAX_DEPTH) return [points]
  const maxD = maxInternalDistance(points)
  if (maxD <= KMEANS_MAX_DIST_M) return [points]

  const actualK = Math.max(2, Math.min(k, points.length))
  const data = points.map((p) => [p.lng, p.lat])
  const result = kmeans(data, actualK, {
    seed: KMEANS_SEED + depth,
    maxIterations: 50,
    initialization: 'kmeans++',
  })

  const groups: PoI[][] = Array.from({ length: actualK }, () => [])
  result.clusters.forEach((c: number, i: number) => {
    groups[c].push(points[i])
  })

  const output: PoI[][] = []
  for (const g of groups) {
    if (g.length === 0) continue
    if (g.length <= 2 || maxInternalDistance(g) <= KMEANS_MAX_DIST_M) {
      output.push(g)
    } else {
      output.push(...splitKMeans(g, 2, depth + 1))
    }
  }
  return output
}

function nearestSupply(
  centroid: { lat: number; lng: number },
  supply: SupplyPoint[],
): { id: string; distanceM: number } {
  let bestId = supply[0]?.id ?? ''
  let bestD = Number.POSITIVE_INFINITY
  for (const s of supply) {
    const d = haversineM([centroid.lng, centroid.lat], [s.lng, s.lat])
    if (d < bestD) {
      bestD = d
      bestId = s.id
    }
  }
  return { id: bestId, distanceM: bestD }
}

export function recursiveKMeansByCity(
  nonFoPoi: PoI[],
  supply: SupplyPoint[],
): { clusters: Cluster[]; enrichedPoi: PoI[] } {
  const byCity = new Map<City, PoI[]>()
  for (const p of nonFoPoi) {
    const arr = byCity.get(p.city) ?? []
    arr.push(p)
    byCity.set(p.city, arr)
  }

  const clusters: Cluster[] = []
  const idByPoi = new Map<string, string>()

  for (const [city, pts] of byCity.entries()) {
    if (pts.length === 0) continue
    const initialK = Math.max(2, Math.ceil(Math.sqrt(pts.length / 2)))
    const groups = splitKMeans(pts, initialK, 0)

    groups.forEach((group, idx) => {
      if (group.length === 0) return
      const centroid = computeCentroid(group)
      const totalCapacity = group.reduce((a, p) => a + p.capacityMbps, 0)
      const totalRevenue = group.reduce((a, p) => a + p.monthlyRevenueIdr, 0)
      const nearest = nearestSupply(centroid, supply)
      const id = `cluster-${city}-${String(idx + 1).padStart(3, '0')}`

      clusters.push({
        id,
        city,
        centroid,
        memberIds: group.map((p) => p.id),
        totalCapacityMbps: totalCapacity,
        totalMonthlyRevenueIdr: totalRevenue,
        maxInternalDistanceM: maxInternalDistance(group),
        nearestSupplyId: nearest.id,
        distanceToNearestSupplyM: nearest.distanceM,
      })

      for (const p of group) idByPoi.set(p.id, id)
    })
  }

  const enrichedPoi = nonFoPoi.map((p) => ({
    ...p,
    clusterId: idByPoi.get(p.id),
  }))

  return { clusters, enrichedPoi }
}
