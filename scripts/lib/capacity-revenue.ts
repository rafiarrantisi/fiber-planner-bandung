import type { PoISubtype } from '../../src/types/domain'
import type { Rng } from './utils/random'

interface CapacityRevenueSpec {
  capacityMbps: [number, number]
  revenueIdr: [number, number]
}

const SPEC: Record<PoISubtype, CapacityRevenueSpec> = {
  SD: { capacityMbps: [50, 50], revenueIdr: [1_500_000, 1_500_000] },
  SMP: { capacityMbps: [50, 50], revenueIdr: [1_500_000, 1_500_000] },
  SMA: { capacityMbps: [100, 100], revenueIdr: [3_000_000, 3_000_000] },
  PT: { capacityMbps: [500, 1000], revenueIdr: [15_000_000, 40_000_000] },
  PUSKESMAS: { capacityMbps: [50, 50], revenueIdr: [1_800_000, 1_800_000] },
  RS: { capacityMbps: [300, 500], revenueIdr: [12_000_000, 25_000_000] },
  KELURAHAN: { capacityMbps: [30, 30], revenueIdr: [1_000_000, 1_000_000] },
  KECAMATAN: { capacityMbps: [100, 100], revenueIdr: [3_500_000, 3_500_000] },
  KABUPATEN: { capacityMbps: [300, 300], revenueIdr: [10_000_000, 10_000_000] },
  PASAR: { capacityMbps: [100, 100], revenueIdr: [4_000_000, 4_000_000] },
  PUSAT_PERDAGANGAN: {
    capacityMbps: [500, 500],
    revenueIdr: [20_000_000, 20_000_000],
  },
  KANTOR_POS: { capacityMbps: [50, 50], revenueIdr: [2_000_000, 2_000_000] },
  MENARA: { capacityMbps: [200, 200], revenueIdr: [8_000_000, 8_000_000] },
}

const JITTER_PCT = 0.2

export function computeCapacityRevenue(
  subtype: PoISubtype,
  rng: Rng,
): { capacityMbps: number; monthlyRevenueIdr: number } {
  const spec = SPEC[subtype]
  const baseCapacity = rng.range(spec.capacityMbps[0], spec.capacityMbps[1])
  const baseRevenue = rng.range(spec.revenueIdr[0], spec.revenueIdr[1])

  const capacity = Math.round(rng.jitter(baseCapacity, JITTER_PCT) / 10) * 10
  const revenue =
    Math.round(rng.jitter(baseRevenue, JITTER_PCT) / 100_000) * 100_000

  return {
    capacityMbps: Math.max(10, capacity),
    monthlyRevenueIdr: Math.max(500_000, revenue),
  }
}
