import { GeoJSON } from 'react-leaflet'
import type { BoundaryCollection } from '@/data/loaders'

interface Props {
  boundaries: BoundaryCollection
}

export function CityBoundaryLayer({ boundaries }: Props) {
  return (
    <GeoJSON
      data={boundaries}
      style={{
        color: '#1f2937',
        weight: 1.25,
        opacity: 0.7,
        fill: false,
        dashArray: '4 3',
      }}
      interactive={false}
    />
  )
}
