import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { PoI, SupplyPoint } from '@/types/domain'

export interface SpatialJoinResult {
  classifiedPoi: PoI[]
  enrichedSupply: SupplyPoint[]
}

export function classifyPoI(
  poi: PoI[],
  supply: SupplyPoint[],
  bufferUnion: Feature<Polygon | MultiPolygon>,
): SpatialJoinResult {
  const supplyFeatures = turf.featureCollection(
    supply.map((s) =>
      turf.point([s.lng, s.lat], { id: s.id }),
    ),
  )

  const classifiedPoi: PoI[] = poi.map((p) => {
    const pt = turf.point([p.lng, p.lat])
    const foReady = turf.booleanPointInPolygon(pt, bufferUnion)

    const nearest = turf.nearestPoint(pt, supplyFeatures)
    const nearestId = (nearest.properties as { id?: string }).id
    const distanceM = turf.distance(pt, nearest, { units: 'meters' })

    return {
      ...p,
      foStatus: foReady ? 'FO_READY' : 'NON_FO',
      nearestSupplyId: nearestId,
      distanceToNearestSupplyM: distanceM,
    }
  })

  const servedMap = new Map<string, number>()
  for (const p of classifiedPoi) {
    if (p.foStatus !== 'FO_READY' || !p.nearestSupplyId) continue
    servedMap.set(
      p.nearestSupplyId,
      (servedMap.get(p.nearestSupplyId) ?? 0) + 1,
    )
  }

  const enrichedSupply: SupplyPoint[] = supply.map((s) => ({
    ...s,
    servedPoICount: servedMap.get(s.id) ?? 0,
    utilization: s.usedPorts / s.maxPorts,
  }))

  return { classifiedPoi, enrichedSupply }
}
