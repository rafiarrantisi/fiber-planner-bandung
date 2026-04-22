import { MapContainer } from 'react-leaflet'
import { BANDUNG_RAYA_CENTER, BANDUNG_RAYA_ZOOM } from '@/lib/constants'
import { BaseTileLayer } from './BaseTileLayer'
import { CityBoundaryLayer } from './CityBoundaryLayer'
import { FiberLayer } from './FiberLayer'
import { SupplyLayer } from './SupplyLayer'
import { DemandLayer } from './DemandLayer'
import { BufferLayer } from './BufferLayer'
import { ClusterCentroidLayer } from './ClusterCentroidLayer'
import { FlyController } from './FlyController'
import { LegendControl } from './LegendControl'
import { useDataStore } from '@/store/data'
import { useFiltersStore } from '@/store/filters'
import { useAnalysisStore } from '@/store/analysis'
import { useFilteredCables, useFilteredPoI, useFilteredSupply } from '@/hooks/useFilteredData'
import type { PoI } from '@/types/domain'

export function MapView() {
  const data = useDataStore((s) => s.data)
  const layers = useFiltersStore((s) => s.layers)
  const bufferUnion = useAnalysisStore((s) => s.bufferUnion)
  const analyzedPoi = useAnalysisStore((s) => s.classifiedPoi)
  const clusters = useAnalysisStore((s) => s.clusters)
  const step = useAnalysisStore((s) => s.step)

  const basePoi: PoI[] = step === 'done' ? analyzedPoi : (data?.poi ?? [])
  const filteredPoi = useFilteredPoI(basePoi)
  const filteredSupply = useFilteredSupply(data?.supply ?? [])
  const filteredCables = useFilteredCables(data?.cables ?? [])

  if (!data) return null

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={BANDUNG_RAYA_CENTER}
        zoom={BANDUNG_RAYA_ZOOM}
        preferCanvas
        zoomControl
        className="h-full w-full"
        style={{ background: '#f5f5f0' }}
      >
        <BaseTileLayer />
        <FlyController />
        {layers.boundary && <CityBoundaryLayer boundaries={data.boundaries} />}
        {layers.buffer && bufferUnion && <BufferLayer buffer={bufferUnion} />}
        {layers.fiber && <FiberLayer cables={filteredCables} />}
        {layers.supply && <SupplyLayer supply={filteredSupply} />}
        {layers.poi && <DemandLayer poi={filteredPoi} />}
        {layers.clusters && step === 'done' && (
          <ClusterCentroidLayer clusters={clusters} />
        )}
      </MapContainer>
      <LegendControl />
    </div>
  )
}
