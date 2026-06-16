import { useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { useAnalysisStore } from '@/store/analysis'
import { METHOD_COLORS, dominantMethod } from '@/lib/method-style'

/** Jaringan feeder (MST ODP→POP), polyline diwarnai per metode dominan. */
export function FeederLayer() {
  const topology = useAnalysisStore((s) => s.topology)

  const segments = useMemo(() => {
    if (!topology) return []
    return topology.links.map((l) => ({
      positions: l.path.coords.map(
        ([lng, lat]) => [lat, lng] as LatLngExpression,
      ),
      color: METHOD_COLORS[dominantMethod(l.path.methodBreakdown)],
    }))
  }, [topology])

  if (!topology) return null

  return (
    <>
      {segments.map((s, i) => (
        <Polyline
          key={i}
          positions={s.positions}
          pathOptions={{ color: s.color, weight: 1.4, opacity: 0.65 }}
          interactive={false}
        />
      ))}
    </>
  )
}
