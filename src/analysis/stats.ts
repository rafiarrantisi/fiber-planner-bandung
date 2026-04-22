import type {
  AnalysisResult,
  CategoryStats,
  Cluster,
  PoI,
  PoICategory,
} from '@/types/domain'
import { BUFFER_RADIUS_M, KMEANS_MAX_DIST_M } from '@/lib/constants'

const EMPTY_BY_CATEGORY = (): Record<PoICategory, CategoryStats> => ({
  PENDIDIKAN: { total: 0, foReady: 0, nonFo: 0, revenueIdr: 0 },
  KESEHATAN: { total: 0, foReady: 0, nonFo: 0, revenueIdr: 0 },
  PEMERINTAHAN: { total: 0, foReady: 0, nonFo: 0, revenueIdr: 0 },
  NIAGA: { total: 0, foReady: 0, nonFo: 0, revenueIdr: 0 },
  LAYANAN_POS: { total: 0, foReady: 0, nonFo: 0, revenueIdr: 0 },
  MENARA_NON_FIBER: { total: 0, foReady: 0, nonFo: 0, revenueIdr: 0 },
})

export function computeStats(
  classifiedPoi: PoI[],
  clusters: Cluster[],
): AnalysisResult {
  const byCategory = EMPTY_BY_CATEGORY()
  let foReadyCount = 0
  let nonFoCount = 0
  let revenueCaptured = 0
  let revenueLost = 0

  for (const p of classifiedPoi) {
    const cat = byCategory[p.category]
    cat.total++
    cat.revenueIdr += p.monthlyRevenueIdr
    if (p.foStatus === 'FO_READY') {
      foReadyCount++
      revenueCaptured += p.monthlyRevenueIdr
      cat.foReady++
    } else {
      nonFoCount++
      revenueLost += p.monthlyRevenueIdr
      cat.nonFo++
    }
  }

  const totalPoI = classifiedPoi.length
  const foReadyPct = totalPoI > 0 ? foReadyCount / totalPoI : 0
  const nonFoPct = totalPoI > 0 ? nonFoCount / totalPoI : 0

  return {
    runAt: new Date().toISOString(),
    bufferRadiusM: BUFFER_RADIUS_M,
    maxClusterDistM: KMEANS_MAX_DIST_M,
    totalPoI,
    foReadyCount,
    foReadyPct,
    nonFoCount,
    nonFoPct,
    clusters,
    revenueCapturedIdr: revenueCaptured,
    revenueLostIdr: revenueLost,
    byCategory,
  }
}
