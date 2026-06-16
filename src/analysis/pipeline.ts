import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type {
  AnalysisResult,
  CapexSummary,
  Cluster,
  ConstraintFeature,
  ConstraintImpact,
  DemandFeature,
  NetworkTopology,
  PoI,
  PopSite,
  SupplyPoint,
} from '@/types/domain'
import { buildSupplyBufferUnion } from '@/analysis/buffer'
import { classifyPoI } from '@/analysis/spatial-join'
import { recursiveKMeansByCity } from '@/analysis/kmeans-recursive'
import { postProcessClusters } from '@/analysis/cluster-postprocess'
import { buildFeederTree } from '@/analysis/topology'
import {
  computeClusterDemand,
  DEFAULT_DEMAND_PARAMS,
  type DemandParams,
} from '@/analysis/demand'
import { computeCapex } from '@/analysis/capex'
import { computeStats } from '@/analysis/stats'
import {
  buildIndex,
  countPoiInRestricted,
  makeHardBlockTest,
} from '@/analysis/constraints'
import type { NodeSpatialIndex } from '@/analysis/routing/snap'
import type { RouteGraph, RouteNodeData } from '@/analysis/routing/graph'
import type { PathFinder } from 'ngraph.path'

export type PipelineStep =
  | 'buffer'
  | 'classify'
  | 'cluster'
  | 'route'
  | 'topology'
  | 'demand'
  | 'capex'
  | 'stats'

export interface PipelineProgress {
  step: PipelineStep
  pct: number
}

export type ProgressFn = (p: PipelineProgress) => void

export interface PipelineInput {
  poi: PoI[]
  supply: SupplyPoint[]
  popSites: PopSite[]
  demandGrid: DemandFeature[]
  constraints: ConstraintFeature[]
  nodeIndex: NodeSpatialIndex | null
  graph: RouteGraph | null
  finder: PathFinder<RouteNodeData> | null
  demandParams?: DemandParams
  budgetIdr: number
}

export interface PipelineResult {
  result: AnalysisResult
  bufferUnion: Feature<Polygon | MultiPolygon>
  classifiedPoi: PoI[]
  enrichedSupply: SupplyPoint[]
  clusters: Cluster[]
  topology: NetworkTopology | null
  capex: CapexSummary | null
  constraintImpact: ConstraintImpact
}

/**
 * Orkestrasi analisis end-to-end (dijalankan di Web Worker).
 * Fase 3: buffer → classify → cluster(+snap+drop) → stats.
 * Fase 4–6 (topology/demand/capex) ditambahkan berikutnya.
 */
export function runPipeline(
  input: PipelineInput,
  onProgress: ProgressFn,
): PipelineResult {
  const {
    poi,
    supply,
    popSites,
    demandGrid,
    constraints,
    nodeIndex,
    graph,
    finder,
    demandParams = DEFAULT_DEMAND_PARAMS,
    budgetIdr,
  } = input

  // Index constraint sekali (dipakai snap hard-block test + poiInRestricted)
  const cidx = buildIndex(constraints)
  const isHardBlock = makeHardBlockTest(cidx)

  // 1. Buffer 200 m di sekitar supply
  onProgress({ step: 'buffer', pct: 0.1 })
  const bufferUnion = buildSupplyBufferUnion(supply)

  // 2. Klasifikasi FO-Ready vs Non-FO
  onProgress({ step: 'classify', pct: 0.35 })
  const { classifiedPoi, enrichedSupply } = classifyPoI(
    poi,
    supply,
    bufferUnion,
  )

  // 3. Cluster capacity-aware pada Non-FO
  onProgress({ step: 'cluster', pct: 0.55 })
  const nonFo = classifiedPoi.filter((p) => p.foStatus === 'NON_FO')
  const { clusters: rawClusters, enrichedPoi } = recursiveKMeansByCity(
    nonFo,
    supply,
  )

  // 3b. Snap centroid ke node jalan valid + validasi drop
  onProgress({ step: 'cluster', pct: 0.7 })
  const poiById = new Map(nonFo.map((p) => [p.id, p]))
  const clusters = postProcessClusters(
    rawClusters,
    poiById,
    nodeIndex,
    isHardBlock,
  )

  const clusterIdByPoi = new Map(
    enrichedPoi.map((p) => [p.id, p.clusterId] as const),
  )
  const finalPoi = classifiedPoi.map((p) => ({
    ...p,
    clusterId: clusterIdByPoi.get(p.id),
  }))

  // 4. Topologi feeder (MST ODP→POP) di atas road graph
  onProgress({ step: 'topology', pct: 0.78 })
  const topology =
    graph && finder
      ? buildFeederTree(clusters, popSites, graph, finder, nodeIndex, isHardBlock)
      : null

  // 5. Demand: homes-passed, demand Mbps, revenue (residential + enterprise)
  onProgress({ step: 'demand', pct: 0.82 })
  const demandClusters =
    demandGrid.length > 0
      ? computeClusterDemand(clusters, demandGrid, demandParams)
      : clusters

  // 6. Capex, payback, NPV, ROI + fasing greedy by budget
  onProgress({ step: 'capex', pct: 0.9 })
  const capexResult = computeCapex(demandClusters, topology, budgetIdr)
  const finalClusters = capexResult.clusters

  // 7. Stats + dampak constraint
  onProgress({ step: 'stats', pct: 0.96 })
  const result = computeStats(finalPoi, finalClusters)

  const constraintImpact: ConstraintImpact = {
    routesRerouted: topology
      ? topology.links.filter((l) => l.path.reroutedAroundConstraint).length
      : 0,
    routesBlocked: topology
      ? topology.links.filter((l) => l.path.crossesHardBlock).length
      : 0,
    extraCostFromConstraintsIdr: capexResult.extraCostFromConstraintsIdr,
    poiInRestricted: countPoiInRestricted(poi, cidx),
  }
  result.constraintImpact = constraintImpact
  result.topology = topology ?? undefined
  result.capex = capexResult.summary

  return {
    result,
    bufferUnion,
    classifiedPoi: finalPoi,
    enrichedSupply,
    clusters: finalClusters,
    topology,
    capex: capexResult.summary,
    constraintImpact,
  }
}
