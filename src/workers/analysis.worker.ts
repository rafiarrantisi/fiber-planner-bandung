import * as Comlink from 'comlink'
import type {
  ConstraintFeature,
  CostAssumptions,
  DemandFeature,
  PoI,
  PopSite,
  RoadGraphData,
  RoutedPath,
  SupplyPoint,
} from '@/types/domain'
import { buildGraph, type RouteGraph } from '@/analysis/routing/graph'
import {
  makePathFinder,
  routeCostWeighted,
} from '@/analysis/routing/route'
import {
  buildNodeIndex,
  snapToValidNode,
  type HardBlockTest,
  type NodeSpatialIndex,
} from '@/analysis/routing/snap'
import { minRate } from '@/analysis/routing/cost-model'
import { buildIndex, makeHardBlockTest } from '@/analysis/constraints'
import {
  runPipeline,
  type PipelineProgress,
  type PipelineResult,
} from '@/analysis/pipeline'
import type { PathFinder } from 'ngraph.path'
import type { RouteNodeData } from '@/analysis/routing/graph'

interface RoutingState {
  graph: RouteGraph
  finder: PathFinder<RouteNodeData>
  nodeIndex: NodeSpatialIndex
  isHardBlock: HardBlockTest
  constraints: ConstraintFeature[]
}

let routing: RoutingState | null = null

export interface InitRoutingResult {
  nodes: number
  edges: number
}

function initRoutingState(
  roadGraph: RoadGraphData,
  constraints: ConstraintFeature[],
  assumptions: CostAssumptions,
): InitRoutingResult {
  const graph = buildGraph(roadGraph, assumptions)
  const finder = makePathFinder(graph, minRate(assumptions))
  const nodeIndex = buildNodeIndex(roadGraph.nodes)
  const isHardBlock = makeHardBlockTest(buildIndex(constraints))
  if (!nodeIndex) throw new Error('road graph kosong')
  routing = { graph, finder, nodeIndex, isHardBlock, constraints }
  return { nodes: roadGraph.nodes.length, edges: roadGraph.edges.length }
}

export interface RunAnalysisPayload {
  poi: PoI[]
  supply: SupplyPoint[]
  popSites: PopSite[]
  demandGrid: DemandFeature[]
  roadGraph: RoadGraphData | null
  constraints: ConstraintFeature[]
  assumptions: CostAssumptions
  budgetIdr: number
}

const api = {
  /** Bangun graph + index dari data statis (sekali; berat → di worker). */
  initRouting(
    roadGraph: RoadGraphData,
    constraints: ConstraintFeature[],
    assumptions: CostAssumptions,
  ): InitRoutingResult {
    return initRoutingState(roadGraph, constraints, assumptions)
  },

  /**
   * Jalankan pipeline analisis lengkap di worker, emit progress via callback
   * (di-proxy Comlink dari main thread). Routing di-init bila road graph ada.
   */
  runAnalysis(
    payload: RunAnalysisPayload,
    onProgress: (p: PipelineProgress) => void,
  ): PipelineResult {
    if (payload.roadGraph && !routing) {
      initRoutingState(payload.roadGraph, payload.constraints, payload.assumptions)
    }
    return runPipeline(
      {
        poi: payload.poi,
        supply: payload.supply,
        popSites: payload.popSites,
        demandGrid: payload.demandGrid,
        constraints: payload.constraints,
        nodeIndex: routing?.nodeIndex ?? null,
        graph: routing?.graph ?? null,
        finder: routing?.finder ?? null,
        budgetIdr: payload.budgetIdr,
      },
      (p) => {
        // callback di-proxy; panggil tanpa await (fire-and-forget)
        void onProgress(p)
      },
    )
  },

  /** Route cost-weighted antar dua koordinat (snap → A*). */
  route(
    srcLat: number,
    srcLng: number,
    dstLat: number,
    dstLng: number,
  ): RoutedPath | null {
    if (!routing) throw new Error('routing belum di-init')
    const s = snapToValidNode(
      { lat: srcLat, lng: srcLng },
      routing.nodeIndex,
      routing.isHardBlock,
    )
    const d = snapToValidNode(
      { lat: dstLat, lng: dstLng },
      routing.nodeIndex,
      routing.isHardBlock,
    )
    if (!s || !d) return null
    return routeCostWeighted(routing.finder, routing.graph, s.nodeId, d.nodeId)
  },

  isReady(): boolean {
    return routing !== null
  },

  /** Debug: snap + adjacency + komponen graph. */
  debug(lat: number, lng: number) {
    if (!routing) return { error: 'belum init' }
    const snap = snapToValidNode({ lat, lng }, routing.nodeIndex, routing.isHardBlock)
    let degree = 0
    let sampleNeighbor: number | null = null
    if (snap) {
      const node = routing.graph.getNode(snap.nodeId)
      degree = node?.links ? node.links.size : 0
      if (node?.links) {
        for (const l of node.links) {
          sampleNeighbor = l.fromId === snap.nodeId ? (l.toId as number) : (l.fromId as number)
          break
        }
      }
    }
    let graphNodeCount = 0
    let graphLinkCount = 0
    routing.graph.forEachNode(() => {
      graphNodeCount++
    })
    routing.graph.forEachLink(() => {
      graphLinkCount++
    })
    return { snap, degree, sampleNeighbor, graphNodeCount, graphLinkCount }
  },
}

export type AnalysisWorkerApi = typeof api

Comlink.expose(api)
