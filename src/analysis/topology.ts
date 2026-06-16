import type {
  Cluster,
  FeederLink,
  NetworkTopology,
  PopSite,
  RoutedPath,
} from '@/types/domain'
import type { PathFinder } from 'ngraph.path'
import type { RouteGraph, RouteNodeData } from '@/analysis/routing/graph'
import {
  routeCostWeighted,
  haversineM,
} from '@/analysis/routing/route'
import {
  snapToValidNode,
  type HardBlockTest,
  type NodeSpatialIndex,
} from '@/analysis/routing/snap'

interface TreeNode {
  id: string
  kind: 'odp' | 'pop'
  nodeId: number
  lat: number
  lng: number
}

const emptyTopology: NetworkTopology = {
  links: [],
  totalFeederM: 0,
  totalFeederCostIdr: 0,
  homingByPop: {},
}

/**
 * Bangun pohon feeder: minimum spanning FOREST berakar di POP, di atas
 * road graph. Struktur pohon dihitung dgn jarak Euclidean (skala ribuan node),
 * lalu tiap edge pohon di-route cost-weighted untuk path feeder sebenarnya.
 *
 * Jaminan: tiap ODP terhubung ke tepat satu POP (tanpa siklus), edge tak
 * pernah melewati hard-block (A* sudah meng-skip edge hard).
 */
export function buildFeederTree(
  clusters: Cluster[],
  popSites: PopSite[],
  graph: RouteGraph,
  finder: PathFinder<RouteNodeData>,
  nodeIndex: NodeSpatialIndex | null,
  isHardBlock?: HardBlockTest,
): NetworkTopology {
  if (!nodeIndex || popSites.length === 0) return emptyTopology

  // Kumpulkan node pohon: POP (root) + ODP (snapped node)
  const nodes: TreeNode[] = []
  for (const pop of popSites) {
    const snap = snapToValidNode(pop, nodeIndex, isHardBlock)
    if (!snap) continue
    nodes.push({ id: pop.id, kind: 'pop', nodeId: snap.nodeId, lat: snap.lat, lng: snap.lng })
  }
  const popCount = nodes.length
  if (popCount === 0) return emptyTopology

  for (const c of clusters) {
    if (c.snapNodeId == null) continue
    const lat = nodeIndex.nodes[c.snapNodeId]?.lat ?? c.centroid.lat
    const lng = nodeIndex.nodes[c.snapNodeId]?.lng ?? c.centroid.lng
    nodes.push({ id: c.id, kind: 'odp', nodeId: c.snapNodeId, lat, lng })
  }

  const N = nodes.length
  if (N <= popCount) return { ...emptyTopology }

  // ── Multi-source Prim (root = semua POP, key 0) ──
  const inTree = new Array<boolean>(N).fill(false)
  const key = new Array<number>(N).fill(Infinity)
  const parent = new Array<number>(N).fill(-1)
  for (let i = 0; i < popCount; i++) key[i] = 0

  for (let iter = 0; iter < N; iter++) {
    let u = -1
    let best = Infinity
    for (let i = 0; i < N; i++) {
      if (!inTree[i] && key[i] < best) {
        best = key[i]
        u = i
      }
    }
    if (u === -1) break
    inTree[u] = true
    const nu = nodes[u]
    for (let v = 0; v < N; v++) {
      if (inTree[v]) continue
      const d = haversineM(nu.lat, nu.lng, nodes[v].lat, nodes[v].lng)
      if (d < key[v]) {
        key[v] = d
        parent[v] = u
      }
    }
  }

  // ── Homing: telusuri tiap ODP ke POP akarnya ──
  const rootPopOf = (i: number): string | null => {
    let cur = i
    let guard = 0
    while (cur !== -1 && guard++ < N) {
      if (nodes[cur].kind === 'pop') return nodes[cur].id
      cur = parent[cur]
    }
    return null
  }

  const homingByPop: Record<string, string[]> = {}
  for (const pop of nodes) {
    if (pop.kind === 'pop') homingByPop[pop.id] = []
  }

  // ── Route tiap edge pohon (cost-weighted) ──
  const links: FeederLink[] = []
  let totalFeederM = 0
  let totalFeederCostIdr = 0

  for (let v = 0; v < N; v++) {
    const p = parent[v]
    if (p === -1) continue
    const child = nodes[v]
    const par = nodes[p]

    let path: RoutedPath = routeCostWeighted(finder, graph, child.nodeId, par.nodeId)
    if (path.crossesHardBlock || path.coords.length === 0) {
      // tak ada rute valid → fallback garis lurus (ditandai)
      const straight = haversineM(child.lat, child.lng, par.lat, par.lng)
      path = {
        coords: [
          [child.lng, child.lat],
          [par.lng, par.lat],
        ],
        lengthM: straight,
        costIdr: 0,
        methodBreakdown: { aerialM: straight, undergroundM: 0, boringM: 0 },
        crossesHardBlock: true,
        reroutedAroundConstraint: false,
        detourRatio: 1,
      }
    }

    totalFeederM += path.lengthM
    totalFeederCostIdr += path.costIdr
    links.push({ fromId: child.id, toId: par.id, path })

    if (child.kind === 'odp') {
      const root = rootPopOf(v)
      if (root) homingByPop[root].push(child.id)
    }
  }

  return { links, totalFeederM, totalFeederCostIdr, homingByPop }
}
