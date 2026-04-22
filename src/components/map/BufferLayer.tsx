import { GeoJSON } from 'react-leaflet'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

interface Props {
  buffer: Feature<Polygon | MultiPolygon>
}

export function BufferLayer({ buffer }: Props) {
  return (
    <GeoJSON
      key={buffer.properties?.key ?? 'buffer'}
      data={buffer}
      style={{
        color: '#3b82f6',
        weight: 0,
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
      }}
      interactive={false}
    />
  )
}
