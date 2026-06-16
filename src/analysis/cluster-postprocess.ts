import type { Cluster, PoI } from '@/types/domain'
import { MAX_DROP_ROUTED_M } from '@/lib/constants'
import {
  snapToValidNode,
  type HardBlockTest,
  type NodeSpatialIndex,
} from '@/analysis/routing/snap'
import { haversineM } from '@/analysis/routing/route'

/**
 * Snap tiap centroid cluster ke node jalan valid (tidak di hard-block) +
 * validasi drop.
 *
 * - ODP centroid TIDAK dipindah (tetap pusat geometris cluster); `snapNodeId`
 *   menyimpan node jalan tempat hardware ODP & origin feeder berada (Fase 4).
 * - undeliverableDrops: PoI yg jarak ke pusat cluster > MAX_DROP_ROUTED_M
 *   (mencerminkan kekompakan cluster — drop tak terlayani 1 ODP).
 * - snappedToRoad/snapNodeId: hasil snap; inHardBlock: snap gagal (semua
 *   kandidat di hard-block) → ODP perlu relokasi.
 */
export function postProcessClusters(
  clusters: Cluster[],
  poiById: Map<string, PoI>,
  nodeIndex: NodeSpatialIndex | null,
  isHardBlock?: HardBlockTest,
): Cluster[] {
  return clusters.map((c) => {
    const snap = nodeIndex
      ? snapToValidNode(c.centroid, nodeIndex, isHardBlock)
      : null

    let undeliverable = 0
    for (const id of c.memberIds) {
      const p = poiById.get(id)
      if (!p) continue
      const d = haversineM(p.lat, p.lng, c.centroid.lat, c.centroid.lng)
      if (d > MAX_DROP_ROUTED_M) undeliverable++
    }

    return {
      ...c,
      snappedToRoad: snap !== null,
      snapNodeId: snap ? snap.nodeId : null,
      inHardBlock: snap === null,
      undeliverableDrops: undeliverable,
    }
  })
}
