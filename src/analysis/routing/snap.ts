import Flatbush from 'flatbush'
import type { RoadNode } from '@/types/domain'
import { SNAP_KNN_CANDIDATES } from '@/lib/constants'

export interface NodeSpatialIndex {
  flatbush: Flatbush
  nodes: RoadNode[]
}

/** Predikat: apakah titik [lng,lat] berada di hard-block? */
export type HardBlockTest = (lng: number, lat: number) => boolean

/** Index spasial node graph untuk lookup KNN saat snap. */
export function buildNodeIndex(nodes: RoadNode[]): NodeSpatialIndex | null {
  if (nodes.length === 0) return null
  const fb = new Flatbush(nodes.length)
  for (const n of nodes) fb.add(n.lng, n.lat, n.lng, n.lat)
  fb.finish()
  return { flatbush: fb, nodes }
}

export interface SnapResult {
  nodeId: number
  lat: number
  lng: number
}

/**
 * Snap sebuah centroid ke node jalan terdekat yang VALID (tidak di hard-block).
 * Mengembalikan null jika semua kandidat KNN berada di hard-block
 * → cluster harus dipecah / ditandai inHardBlock.
 *
 * `isHardBlock` adalah predikat cepat (mis. via Flatbush constraint index),
 * menghindari union poligon hard yang mahal.
 */
export function snapToValidNode(
  centroid: { lat: number; lng: number },
  idx: NodeSpatialIndex,
  isHardBlock?: HardBlockTest,
): SnapResult | null {
  const neighbors = idx.flatbush.neighbors(
    centroid.lng,
    centroid.lat,
    SNAP_KNN_CANDIDATES,
  )
  for (const i of neighbors) {
    const n = idx.nodes[i]
    if (isHardBlock && isHardBlock(n.lng, n.lat)) continue
    return { nodeId: n.id, lat: n.lat, lng: n.lng }
  }
  return null
}
