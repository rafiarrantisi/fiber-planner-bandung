import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PoI } from '@/types/domain'
import { getPoIIcon } from './markers/icons'
import { PoIPopup } from './PoIPopup'

interface Props {
  poi: PoI[]
}

export function DemandLayer({ poi }: Props) {
  const map = useMap()

  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      disableClusteringAtZoom: 17,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      maxClusterRadius: 55,
    })

    for (const p of poi) {
      const marker = L.marker([p.lat, p.lng], { icon: getPoIIcon(p.category) })
      marker.bindPopup(
        renderToStaticMarkup(<PoIPopup poi={p} />),
        { maxWidth: 280, minWidth: 220 },
      )
      group.addLayer(marker)
    }

    map.addLayer(group)
    return () => {
      map.removeLayer(group)
    }
  }, [map, poi])

  return null
}
