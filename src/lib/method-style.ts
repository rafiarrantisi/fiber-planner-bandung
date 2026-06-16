import type { DeploymentMethod, MethodBreakdown } from '@/types/domain'

/** Warna per metode deployment (feeder + road-graph debug). */
export const METHOD_COLORS: Record<DeploymentMethod, string> = {
  aerial: '#16a34a',
  underground: '#2563eb',
  boring: '#ea580c',
}

export const METHOD_LABELS: Record<DeploymentMethod, string> = {
  aerial: 'Udara (tiang)',
  underground: 'Bawah tanah',
  boring: 'Boring/HDD',
}

/** Metode dominan sebuah path (panjang terbesar). */
export function dominantMethod(b: MethodBreakdown): DeploymentMethod {
  if (b.boringM >= b.aerialM && b.boringM >= b.undergroundM) return 'boring'
  if (b.undergroundM >= b.aerialM && b.undergroundM >= b.boringM)
    return 'underground'
  return 'aerial'
}
