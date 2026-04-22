import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { SupplyPoint } from '@/types/domain'
import { BUFFER_RADIUS_M } from '@/lib/constants'

export function buildSupplyBufferUnion(
  supply: SupplyPoint[],
): Feature<Polygon | MultiPolygon> {
  if (supply.length === 0) {
    return turf.feature({ type: 'Polygon', coordinates: [] })
  }

  const buffered = supply
    .map((s) =>
      turf.buffer(turf.point([s.lng, s.lat]), BUFFER_RADIUS_M, {
        units: 'meters',
      }),
    )
    .filter((f): f is Feature<Polygon> => Boolean(f))

  if (buffered.length === 0) {
    return turf.feature({ type: 'Polygon', coordinates: [] })
  }

  const fc = turf.featureCollection(buffered)
  const dissolved = turf.union(fc) as Feature<Polygon | MultiPolygon> | null

  return (
    dissolved ?? (buffered[0] as Feature<Polygon | MultiPolygon>)
  )
}
