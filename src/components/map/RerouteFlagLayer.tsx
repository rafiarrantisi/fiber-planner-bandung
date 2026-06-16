import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { useAnalysisStore } from '@/store/analysis'

/**
 * Sorot feeder yang terpaksa memutar (reroutedAroundConstraint, garis putus
 * amber) atau tak punya rute valid (crossesHardBlock, merah tebal).
 */
export function RerouteFlagLayer() {
  const topology = useAnalysisStore((s) => s.topology)

  const flagged = useMemo(() => {
    if (!topology) return []
    return topology.links
      .filter(
        (l) => l.path.reroutedAroundConstraint || l.path.crossesHardBlock,
      )
      .map((l) => ({
        positions: l.path.coords.map(
          ([lng, lat]) => [lat, lng] as LatLngExpression,
        ),
        blocked: l.path.crossesHardBlock,
      }))
  }, [topology])

  if (flagged.length === 0) return null

  return (
    <>
      {flagged.map((f, i) => (
        <Polyline
          key={i}
          positions={f.positions}
          pathOptions={
            f.blocked
              ? { color: '#dc2626', weight: 2.5, opacity: 0.9 }
              : { color: '#d97706', weight: 2, opacity: 0.85, dashArray: '6 5' }
          }
          interactive={false}
        />
      ))}
    </>
  )
}
