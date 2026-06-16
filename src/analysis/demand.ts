import { latLngToCell } from 'h3-js'
import type { Cluster, DemandFeature } from '@/types/domain'
import {
  ARPU_IDR_DEFAULT,
  H3_RESOLUTION,
  HOMES_PASSED_BUFFER_M,
  MBPS_PER_HOME_DEFAULT,
  TAKE_UP_RATE_DEFAULT,
} from '@/lib/constants'

// Luas rata-rata hex H3 (km²) per resolusi (res 8 ≈ 0.737).
const HEX_AREA_KM2: Record<number, number> = { 7: 5.161, 8: 0.737, 9: 0.105 }
const BUFFER_AREA_KM2 = Math.PI * (HOMES_PASSED_BUFFER_M / 1000) ** 2

export interface DemandParams {
  takeUpRate: number
  mbpsPerHome: number
  arpuIdr: number
}

export const DEFAULT_DEMAND_PARAMS: DemandParams = {
  takeUpRate: TAKE_UP_RATE_DEFAULT,
  mbpsPerHome: MBPS_PER_HOME_DEFAULT,
  arpuIdr: ARPU_IDR_DEFAULT,
}

/**
 * Homes-passed per cluster = densitas RT hex pemuat centroid × luas buffer ODP.
 * Revenue & demand cluster = residential (homes-passed × take-up) + enterprise
 * (PoI anggota). Mengembalikan cluster yang diperkaya field ekonomi demand.
 */
export function computeClusterDemand(
  clusters: Cluster[],
  demandGrid: DemandFeature[],
  params: DemandParams = DEFAULT_DEMAND_PARAMS,
): Cluster[] {
  const hhByCell = new Map<string, number>()
  for (const f of demandGrid) hhByCell.set(f.properties.h3, f.properties.householdEst)

  const hexArea = HEX_AREA_KM2[H3_RESOLUTION] ?? 0.737
  const coverRatio = Math.min(1, BUFFER_AREA_KM2 / hexArea)

  return clusters.map((c) => {
    const cell = latLngToCell(c.centroid.lat, c.centroid.lng, H3_RESOLUTION)
    const hh = hhByCell.get(cell) ?? 0
    const homesPassed = Math.round(hh * coverRatio)
    const resiMbps = homesPassed * params.takeUpRate * params.mbpsPerHome
    const resiRevenue = homesPassed * params.takeUpRate * params.arpuIdr
    return {
      ...c,
      homesPassed,
      demandMbps: Math.round(resiMbps + c.totalCapacityMbps),
      monthlyRevenueIdr: Math.round(resiRevenue + c.totalMonthlyRevenueIdr),
    }
  })
}

/**
 * Skor whitespace per hex (untuk heatmap): tinggi bila permintaan tinggi &
 * presensi incumbent rendah → area underserved layak dibangun.
 */
export function whitespaceScore(
  householdNorm: number,
  incumbentScore: number,
): number {
  return Math.max(0, Math.min(1, householdNorm * (1 - incumbentScore)))
}
