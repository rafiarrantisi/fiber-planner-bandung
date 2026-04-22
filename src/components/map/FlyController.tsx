import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { useMapUiStore } from '@/store/map-ui'

export function FlyController() {
  const map = useMap()
  const target = useMapUiStore((s) => s.flyTarget)

  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], target.zoom ?? 16, {
      duration: 0.9,
      easeLinearity: 0.25,
    })
  }, [map, target])

  return null
}
