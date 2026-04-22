import { Marker, Popup } from 'react-leaflet'
import type { SupplyPoint } from '@/types/domain'
import { getSupplyIcon } from './markers/icons'
import { SupplyPopup } from './SupplyPopup'

interface Props {
  supply: SupplyPoint[]
}

export function SupplyLayer({ supply }: Props) {
  return (
    <>
      {supply.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={getSupplyIcon(s.type)}
        >
          <Popup>
            <SupplyPopup supply={s} />
          </Popup>
        </Marker>
      ))}
    </>
  )
}
