import { useMemo } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { Layer, PathOptions } from 'leaflet'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { ConstraintProps } from '@/types/domain'
import { CONSTRAINT_CATEGORY_LABELS } from '@/types/domain'
import { useConstraintStore } from '@/store/constraints'
import {
  CONSTRAINT_COLORS,
  constraintDashArray,
  constraintFillOpacity,
  constraintWeight,
} from '@/lib/constraint-style'
import { STRINGS } from '@/lib/i18n-strings'

function provenanceBadge(props: ConstraintProps): string {
  if (props.realData) return STRINGS.constraints.realBadge
  if (props.source.startsWith('synthetic_fallback'))
    return STRINGS.constraints.syntheticBadge
  return STRINGS.constraints.approxBadge
}

function methodForceLabel(props: ConstraintProps): string {
  if (props.methodForce === 'underground') return STRINGS.constraints.forceUnderground
  if (props.methodForce === 'boring_only') return STRINGS.constraints.forceBoring
  return STRINGS.constraints.forceNone
}

function popupHtml(props: ConstraintProps): string {
  const severityLabel =
    props.severity === 'hard'
      ? STRINGS.constraints.hardLabel
      : STRINGS.constraints.softLabel
  const badge = provenanceBadge(props)
  return `
    <div style="min-width:200px;font-size:12px;line-height:1.5">
      <div style="font-weight:600;margin-bottom:2px">${props.name}</div>
      <div style="color:#6b7280;margin-bottom:6px">${CONSTRAINT_CATEGORY_LABELS[props.category]}</div>
      <div><b>${severityLabel}</b></div>
      <div>${STRINGS.constraints.methodForce}: ${methodForceLabel(props)}</div>
      ${
        props.severity === 'soft'
          ? `<div>${STRINGS.constraints.multiplier}: ×${props.costMultiplier}</div>`
          : ''
      }
      <div style="margin-top:6px;display:inline-block;padding:1px 6px;border-radius:9999px;background:#f3f4f6;color:#374151;font-size:10px">${badge}</div>
      <div style="margin-top:6px;color:#9ca3af;font-size:10px">${props.source}</div>
    </div>
  `
}

export function ConstraintLayer() {
  const features = useConstraintStore((s) => s.features)
  const visibleCategories = useConstraintStore((s) => s.visibleCategories)
  const severityFilter = useConstraintStore((s) => s.severityFilter)

  const filtered = useMemo<
    FeatureCollection<Polygon | MultiPolygon, ConstraintProps>
  >(() => {
    const feats = features.filter((f) => {
      if (!visibleCategories.has(f.properties.category)) return false
      if (severityFilter !== 'all' && f.properties.severity !== severityFilter)
        return false
      return true
    })
    return { type: 'FeatureCollection', features: feats }
  }, [features, visibleCategories, severityFilter])

  // key memaksa GeoJSON re-render saat filter berubah
  const filterKey = useMemo(
    () =>
      `${severityFilter}-${[...visibleCategories].sort().join(',')}-${filtered.features.length}`,
    [severityFilter, visibleCategories, filtered.features.length],
  )

  if (features.length === 0) return null

  const style = (
    feature?: Feature<Polygon | MultiPolygon, ConstraintProps>,
  ): PathOptions => {
    const p = feature?.properties
    if (!p) return {}
    const color = CONSTRAINT_COLORS[p.category]
    return {
      color,
      weight: constraintWeight(p.severity),
      fillColor: color,
      fillOpacity: constraintFillOpacity(p.severity),
      dashArray: constraintDashArray(p.severity),
    }
  }

  const onEachFeature = (
    feature: Feature<Polygon | MultiPolygon, ConstraintProps>,
    layer: Layer,
  ): void => {
    if (feature.properties) layer.bindPopup(popupHtml(feature.properties))
  }

  return (
    <GeoJSON
      key={filterKey}
      data={filtered}
      style={style as never}
      onEachFeature={onEachFeature as never}
    />
  )
}
