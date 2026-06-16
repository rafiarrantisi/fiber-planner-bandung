import { useMemo } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { PathOptions } from 'leaflet'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import type { DemandCellProps } from '@/types/domain'
import { useDataStore } from '@/store/data'
import { useMapUiStore } from '@/store/map-ui'
import { whitespaceScore } from '@/analysis/demand'

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}
function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function ramp(t: number, from: string, to: string): string {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return `rgb(${lerp(a[0], b[0], t)},${lerp(a[1], b[1], t)},${lerp(a[2], b[2], t)})`
}

/** Heatmap permintaan: hex H3 diwarnai by householdEst atau whitespaceScore. */
export function DemandHeatLayer() {
  const demandGrid = useDataStore((s) => s.data?.demandGrid)
  const incumbentGrid = useDataStore((s) => s.data?.incumbentGrid)
  const mode = useMapUiStore((s) => s.demandHeatMode)

  const { fc, valueByH3, max } = useMemo(() => {
    const cells = demandGrid ?? []
    const incByH3 = new Map<string, number>()
    for (const f of incumbentGrid ?? [])
      incByH3.set(f.properties.h3, f.properties.incumbentScore)

    const maxHh = cells.reduce(
      (m, f) => Math.max(m, f.properties.householdEst),
      1,
    )
    const value = new Map<string, number>()
    for (const f of cells) {
      const hhNorm = f.properties.householdEst / maxHh
      value.set(
        f.properties.h3,
        mode === 'household'
          ? hhNorm
          : whitespaceScore(hhNorm, incByH3.get(f.properties.h3) ?? 0),
      )
    }
    return {
      fc: {
        type: 'FeatureCollection',
        features: cells,
      } as FeatureCollection<Polygon, DemandCellProps>,
      valueByH3: value,
      max: maxHh,
    }
  }, [demandGrid, incumbentGrid, mode])

  if (!demandGrid || demandGrid.length === 0) return null
  void max

  const style = (feature?: Feature<Polygon, DemandCellProps>): PathOptions => {
    const t = feature ? (valueByH3.get(feature.properties.h3) ?? 0) : 0
    const color =
      mode === 'household'
        ? ramp(Math.sqrt(t), '#e0f2fe', '#0c4a6e')
        : ramp(t, '#f1f5f9', '#b45309')
    return {
      color,
      weight: 0,
      fillColor: color,
      fillOpacity: mode === 'household' ? 0.5 : 0.55,
    }
  }

  return (
    <GeoJSON
      key={mode}
      data={fc}
      style={style as never}
      interactive={false}
    />
  )
}
