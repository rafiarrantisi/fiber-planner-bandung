import type { CostAssumptions, DeploymentMethod, RoadEdge } from '@/types/domain'
import { HARD_BLOCK_COST_SENTINEL } from '@/lib/constants'

/** Tarif IDR/m per metode dari asumsi biaya (editable). */
export function rateForMethod(
  method: DeploymentMethod,
  a: CostAssumptions,
): number {
  switch (method) {
    case 'aerial':
      return a.aerialIdrPerM
    case 'underground':
      return a.undergroundIdrPerM
    case 'boring':
      return a.boringIdrPerM
  }
}

/**
 * Biaya total sebuah edge dengan asumsi biaya tertentu (recompute runtime).
 * Hard-block → Infinity (di-skip pathfinder). Soft → × multiplier.
 */
export function edgeTotalCost(edge: RoadEdge, a: CostAssumptions): number {
  if (edge.constraintClass === 'hard' || edge.totalCostIdr >= HARD_BLOCK_COST_SENTINEL) {
    return Infinity
  }
  const base = edge.lengthM * rateForMethod(edge.method, a)
  return base * edge.costMultiplier
}

/** Tarif minimum (untuk heuristik A* admissible). */
export function minRate(a: CostAssumptions): number {
  return Math.min(a.aerialIdrPerM, a.undergroundIdrPerM, a.boringIdrPerM)
}
