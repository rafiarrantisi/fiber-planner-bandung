import createGraph from 'ngraph.graph'
import type { Graph } from 'ngraph.graph'
import type {
  CostAssumptions,
  DeploymentMethod,
  RoadGraphData,
} from '@/types/domain'
import { edgeTotalCost } from './cost-model'

export interface RouteNodeData {
  lat: number
  lng: number
}
export interface RouteLinkData {
  cost: number
  method: DeploymentMethod
  lengthM: number
}
export type RouteGraph = Graph<RouteNodeData, RouteLinkData>

/**
 * Bangun ngraph dari road graph statis. Edge hard-block (cost Infinity)
 * di-SKIP sepenuhnya → A* tak akan pernah melewatinya (rute memutar).
 */
export function buildGraph(
  rg: RoadGraphData,
  assumptions: CostAssumptions,
): RouteGraph {
  const g = createGraph<RouteNodeData, RouteLinkData>()
  for (const n of rg.nodes) g.addNode(n.id, { lat: n.lat, lng: n.lng })
  for (const e of rg.edges) {
    const cost = edgeTotalCost(e, assumptions)
    if (!Number.isFinite(cost)) continue // hard-block → tidak dimasukkan
    g.addLink(e.a, e.b, { cost, method: e.method, lengthM: e.lengthM })
  }
  return g
}
