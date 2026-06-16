import type { ConstraintCategory, ConstraintSeverity } from '@/types/domain'

/** Warna per kategori constraint (dipakai layer peta + legend). */
export const CONSTRAINT_COLORS: Record<ConstraintCategory, string> = {
  airport_kkop: '#d97706',
  heritage_zone: '#7c3aed',
  military: '#dc2626',
  rail_row: '#475569',
  toll_row: '#ea580c',
  hsr_row: '#db2777',
  conservation_forest: '#16a34a',
  water_body: '#2563eb',
  river_setback: '#0891b2',
  national_road: '#92400e',
  steep_slope: '#78716c',
}

/** Hard-block lebih pekat + garis solid; soft transparan + garis putus. */
export function constraintFillOpacity(severity: ConstraintSeverity): number {
  return severity === 'hard' ? 0.32 : 0.16
}

export function constraintDashArray(severity: ConstraintSeverity): string | undefined {
  return severity === 'soft' ? '5 4' : undefined
}

export function constraintWeight(severity: ConstraintSeverity): number {
  return severity === 'hard' ? 1.5 : 1
}
