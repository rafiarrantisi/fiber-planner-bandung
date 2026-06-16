import { aStar } from 'ngraph.path'
import type { PathFinder } from 'ngraph.path'
import type { MethodBreakdown, RoutedPath } from '@/types/domain'
import { REROUTE_FLAG_RATIO } from '@/lib/constants'
import type { RouteGraph, RouteNodeData, RouteLinkData } from './graph'

const R = 6371000 // radius bumi (m)

export function haversineM(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

const emptyBreakdown = (): MethodBreakdown => ({
  aerialM: 0,
  undergroundM: 0,
  boringM: 0,
})

/** Buat pathfinder A* cost-weighted dengan heuristik haversine×tarif-min. */
export function makePathFinder(
  graph: RouteGraph,
  minRateIdrPerM: number,
): PathFinder<RouteNodeData> {
  return aStar<RouteNodeData, RouteLinkData>(graph, {
    distance: (_from, _to, link) => link.data.cost,
    heuristic: (from, to) =>
      haversineM(from.data.lat, from.data.lng, to.data.lat, to.data.lng) *
      minRateIdrPerM,
    oriented: false,
  })
}

function emptyPath(): RoutedPath {
  return {
    coords: [],
    lengthM: 0,
    costIdr: 0,
    methodBreakdown: emptyBreakdown(),
    crossesHardBlock: true,
    reroutedAroundConstraint: false,
    detourRatio: Infinity,
  }
}

/**
 * Route cost-weighted antar 2 node graph. Mengembalikan path lengkap +
 * breakdown metode + flag memutar. Path kosong → crossesHardBlock=true.
 */
export function routeCostWeighted(
  finder: PathFinder<RouteNodeData>,
  graph: RouteGraph,
  srcNodeId: number,
  dstNodeId: number,
): RoutedPath {
  if (srcNodeId === dstNodeId) {
    const n = graph.getNode(srcNodeId)
    const c: [number, number] = n ? [n.data.lng, n.data.lat] : [0, 0]
    return {
      coords: [c],
      lengthM: 0,
      costIdr: 0,
      methodBreakdown: emptyBreakdown(),
      crossesHardBlock: false,
      reroutedAroundConstraint: false,
      detourRatio: 1,
    }
  }

  const found = finder.find(srcNodeId, dstNodeId)
  if (!found || found.length === 0) return emptyPath()

  // ngraph mengembalikan path dari dst→src; normalisasi jadi src→dst
  const ordered =
    found[0].id === srcNodeId ? found : [...found].reverse()

  const coords: [number, number][] = ordered.map((n) => [
    n.data.lng,
    n.data.lat,
  ])

  const breakdown = emptyBreakdown()
  let lengthM = 0
  let costIdr = 0
  for (let i = 0; i + 1 < ordered.length; i++) {
    const a = ordered[i].id
    const b = ordered[i + 1].id
    const link = graph.getLink(a, b) ?? graph.getLink(b, a)
    if (!link) continue
    const d = link.data
    lengthM += d.lengthM
    costIdr += d.cost
    if (d.method === 'aerial') breakdown.aerialM += d.lengthM
    else if (d.method === 'underground') breakdown.undergroundM += d.lengthM
    else breakdown.boringM += d.lengthM
  }

  const src = ordered[0].data
  const dst = ordered[ordered.length - 1].data
  const straight = haversineM(src.lat, src.lng, dst.lat, dst.lng)
  const detourRatio = straight > 0 ? lengthM / straight : 1

  return {
    coords,
    lengthM,
    costIdr,
    methodBreakdown: breakdown,
    crossesHardBlock: false,
    reroutedAroundConstraint: detourRatio > REROUTE_FLAG_RATIO,
    detourRatio,
  }
}
