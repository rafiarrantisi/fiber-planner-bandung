import { getAnalysisWorker } from './analysis-worker'
import { useDataStore } from '@/store/data'
import { useConstraintStore } from '@/store/constraints'
import { useAnalysisStore } from '@/store/analysis'
import { DEFAULT_COST_ASSUMPTIONS, ODP_PORT_CAPACITY } from './constants'
import type { RoutedPath } from '@/types/domain'

interface FiberDevBridge {
  route: (
    srcLat: number,
    srcLng: number,
    dstLat: number,
    dstLng: number,
  ) => Promise<RoutedPath | null | { error: string }>
  graphInfo: () => { nodes: number; edges: number } | { error: string }
  debug: (lat: number, lng: number) => Promise<unknown>
  analysisSummary: () => unknown
}

declare global {
  interface Window {
    __fiber?: FiberDevBridge
  }
}

/**
 * Bridge debug (DEV only) untuk verifikasi routing dari konsol/preview.
 * Bukan bagian dari UI produksi.
 */
export function installRoutingProbe(): void {
  let inited = false
  window.__fiber = {
    async route(srcLat, srcLng, dstLat, dstLng) {
      const rg = useDataStore.getState().data?.roadGraph
      const constraints = useConstraintStore.getState().features
      if (!rg) return { error: 'road graph belum dimuat' }
      const w = getAnalysisWorker()
      if (!inited) {
        await w.initRouting(rg, constraints, DEFAULT_COST_ASSUMPTIONS)
        inited = true
      }
      return w.route(srcLat, srcLng, dstLat, dstLng)
    },
    graphInfo() {
      const rg = useDataStore.getState().data?.roadGraph
      if (!rg) return { error: 'road graph belum dimuat' }
      return { nodes: rg.nodes.length, edges: rg.edges.length }
    },
    async debug(lat, lng) {
      const rg = useDataStore.getState().data?.roadGraph
      const constraints = useConstraintStore.getState().features
      if (!rg) return { error: 'road graph belum dimuat' }
      const w = getAnalysisWorker()
      if (!inited) {
        await w.initRouting(rg, constraints, DEFAULT_COST_ASSUMPTIONS)
        inited = true
      }
      return w.debug(lat, lng)
    },
    analysisSummary() {
      const s = useAnalysisStore.getState()
      const cl = s.clusters
      if (cl.length === 0) return { step: s.step, clusters: 0 }
      const sizes = cl.map((c) => c.memberIds.length)
      const overCap = cl.filter(
        (c) => (c.assignedPoiCount ?? 0) > (c.portCapacity ?? ODP_PORT_CAPACITY),
      ).length
      return {
        step: s.step,
        clusters: cl.length,
        snapped: cl.filter((c) => c.snappedToRoad).length,
        inHardBlock: cl.filter((c) => c.inHardBlock).length,
        withUndeliverable: cl.filter((c) => (c.undeliverableDrops ?? 0) > 0).length,
        totalUndeliverable: cl.reduce((a, c) => a + (c.undeliverableDrops ?? 0), 0),
        overCapacity: overCap,
        maxClusterSize: Math.max(...sizes),
        portCaps: Array.from(new Set(cl.map((c) => c.portCapacity))).sort(),
        foReadyPct: s.result ? +(s.result.foReadyPct * 100).toFixed(1) : null,
        nonFoCount: s.result?.nonFoCount ?? null,
        routesBlocked: s.constraintImpact?.routesBlocked ?? null,
        routesRerouted: s.constraintImpact?.routesRerouted ?? null,
        poiInRestricted: s.constraintImpact?.poiInRestricted ?? null,
        feederLinks: s.topology?.links.length ?? null,
        feederKm: s.topology
          ? +(s.topology.totalFeederM / 1000).toFixed(1)
          : null,
        popsWithHoming: s.topology
          ? Object.values(s.topology.homingByPop).filter((a) => a.length > 0)
              .length
          : null,
        totalHomesPassed: cl.reduce((a, c) => a + (c.homesPassed ?? 0), 0),
        totalRevenueJt: +(
          cl.reduce((a, c) => a + (c.monthlyRevenueIdr ?? 0), 0) / 1e6
        ).toFixed(0),
        clustersWithHomes: cl.filter((c) => (c.homesPassed ?? 0) > 0).length,
        capexM: s.capex ? +(s.capex.totalCapexIdr / 1e9).toFixed(1) : null,
        blendedPayback: s.capex
          ? +(s.capex.blendedPaybackMonths ?? 0).toFixed(1)
          : null,
        extraCostM: s.constraintImpact
          ? +(s.constraintImpact.extraCostFromConstraintsIdr / 1e9).toFixed(2)
          : null,
        phase1: s.capex?.byPhase[1].clusters ?? null,
        phase2: s.capex?.byPhase[2].clusters ?? null,
        phase3: s.capex?.byPhase[3].clusters ?? null,
        budget: s.budgetIdr,
      }
    },
  }
}
