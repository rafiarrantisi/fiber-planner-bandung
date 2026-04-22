import { TileLayer } from 'react-leaflet'
import { CARTO_POSITRON_TILE, CARTO_ATTRIBUTION } from '@/lib/constants'

export function BaseTileLayer() {
  return (
    <TileLayer
      url={CARTO_POSITRON_TILE}
      attribution={CARTO_ATTRIBUTION}
      subdomains={['a', 'b', 'c', 'd']}
      maxZoom={19}
    />
  )
}
