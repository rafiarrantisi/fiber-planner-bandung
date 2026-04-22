import { Polyline } from 'react-leaflet'
import type { FiberCable } from '@/types/domain'

interface Props {
  cables: FiberCable[]
}

export function FiberLayer({ cables }: Props) {
  return (
    <>
      {cables.map((c) => (
        <Polyline
          key={c.id}
          positions={c.geometry.coordinates.map(([lng, lat]) => [lat, lng])}
          pathOptions={{
            color: '#f97316',
            weight: 2,
            opacity: 0.75,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          interactive={false}
        />
      ))}
    </>
  )
}
