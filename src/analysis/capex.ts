import type {
  CapexSummary,
  Cluster,
  NetworkTopology,
} from '@/types/domain'
import {
  ANALYSIS_HORIZON_MONTHS,
  COST_AERIAL_IDR_PER_M,
  COST_PER_HOME_PASSED_IDR,
  DISCOUNT_RATE_MONTHLY,
  DROP_PER_HOME_IDR,
  ODP_HARDWARE_IDR,
  TAKE_UP_RATE_DEFAULT,
} from '@/lib/constants'

/** NPV arus kas bulanan konstan selama horizon, dikurangi capex awal. */
function npv(
  monthlyRevenue: number,
  capex: number,
  rate: number,
  horizon: number,
): number {
  let pv = 0
  for (let t = 1; t <= horizon; t++) pv += monthlyRevenue / (1 + rate) ** t
  return Math.round(pv - capex)
}

export interface CapexResult {
  clusters: Cluster[]
  summary: CapexSummary
  extraCostFromConstraintsIdr: number
}

/**
 * Hitung capex, payback, NPV, ROI per cluster + fasing greedy by budget.
 * Capex = ODP hardware + drops (PoI + residential terhubung) + alokasi feeder
 * (biaya edge feeder milik cluster). Revenue dari pilar #5 (sudah residential
 * + enterprise). Juga hitung extra cost akibat constraint (vs baseline aerial).
 */
export function computeCapex(
  clusters: Cluster[],
  topology: NetworkTopology | null,
  budgetIdr: number,
): CapexResult {
  // Biaya feeder per cluster = biaya edge yg keluar dari cluster (fromId)
  const feederCostByCluster = new Map<string, number>()
  let extraCost = 0
  if (topology) {
    for (const l of topology.links) {
      feederCostByCluster.set(l.fromId, l.path.costIdr)
      // premium vs baseline all-aerial tanpa multiplier
      const baseline = l.path.lengthM * COST_AERIAL_IDR_PER_M
      const extra = l.path.costIdr - baseline
      if (extra > 0) extraCost += extra
    }
  }

  const withEconomics: Cluster[] = clusters.map((c) => {
    const feederCost = feederCostByCluster.get(c.id) ?? 0
    const homesPassed = c.homesPassed ?? 0
    const connectedHomes = Math.round(homesPassed * TAKE_UP_RATE_DEFAULT)
    // drop+ONT untuk yg tersambung (PoI enterprise + residential take-up)
    const dropCount = (c.assignedPoiCount ?? c.memberIds.length) + connectedHomes
    const capexIdr = Math.round(
      ODP_HARDWARE_IDR +
        homesPassed * COST_PER_HOME_PASSED_IDR + // distribusi melewati semua home
        dropCount * DROP_PER_HOME_IDR + // drop+ONT yg tersambung
        feederCost, // alokasi feeder/backbone
    )
    const revenue = c.monthlyRevenueIdr ?? c.totalMonthlyRevenueIdr
    const paybackMonths = revenue > 0 ? capexIdr / revenue : null
    return {
      ...c,
      capexIdr,
      paybackMonths,
      npvIdr: npv(revenue, capexIdr, DISCOUNT_RATE_MONTHLY, ANALYSIS_HORIZON_MONTHS),
      roiScore: capexIdr > 0 ? revenue / capexIdr : 0,
    }
  })

  const phased = phaseClusters(withEconomics, budgetIdr)
  return {
    clusters: phased.clusters,
    summary: phased.summary,
    extraCostFromConstraintsIdr: Math.round(extraCost),
  }
}

/**
 * Fasing greedy: urut desc by ROI; isi Phase 1 sampai budget habis, Phase 2
 * tranche berikutnya, Phase 3 sisanya. MURAH — dipakai ulang saat slider geser.
 */
export function phaseClusters(
  clusters: Cluster[],
  budgetIdr: number,
): { clusters: Cluster[]; summary: CapexSummary } {
  const order = [...clusters].sort(
    (a, b) => (b.roiScore ?? 0) - (a.roiScore ?? 0),
  )

  const phaseOf = new Map<string, 1 | 2 | 3>()
  let cum = 0
  for (const c of order) {
    const capex = c.capexIdr ?? 0
    cum += capex
    const phase: 1 | 2 | 3 = cum <= budgetIdr ? 1 : cum <= budgetIdr * 2 ? 2 : 3
    phaseOf.set(c.id, phase)
  }

  const byPhase: CapexSummary['byPhase'] = {
    1: { clusters: 0, capexIdr: 0, revenueIdr: 0 },
    2: { clusters: 0, capexIdr: 0, revenueIdr: 0 },
    3: { clusters: 0, capexIdr: 0, revenueIdr: 0 },
  }

  let totalCapex = 0
  let totalRevenue = 0
  let totalHomesPassed = 0

  const out = clusters.map((c) => {
    const phase = phaseOf.get(c.id) ?? 3
    const capex = c.capexIdr ?? 0
    const revenue = c.monthlyRevenueIdr ?? c.totalMonthlyRevenueIdr
    byPhase[phase].clusters++
    byPhase[phase].capexIdr += capex
    byPhase[phase].revenueIdr += revenue
    totalCapex += capex
    totalRevenue += revenue
    totalHomesPassed += c.homesPassed ?? 0
    return { ...c, phase }
  })

  return {
    clusters: out,
    summary: {
      totalCapexIdr: Math.round(totalCapex),
      totalMonthlyRevenueIdr: Math.round(totalRevenue),
      blendedPaybackMonths: totalRevenue > 0 ? totalCapex / totalRevenue : null,
      totalHomesPassed,
      byPhase,
    },
  }
}
