import type { Feature, LineString, Polygon, MultiPolygon } from 'geojson'

export type City = 'KOTA_BANDUNG' | 'KOTA_CIMAHI' | 'KAB_BANDUNG_BARAT'

export const CITY_LABELS: Record<City, string> = {
  KOTA_BANDUNG: 'Kota Bandung',
  KOTA_CIMAHI: 'Kota Cimahi',
  KAB_BANDUNG_BARAT: 'Kabupaten Bandung Barat',
}

export type PoICategory =
  | 'PENDIDIKAN'
  | 'KESEHATAN'
  | 'PEMERINTAHAN'
  | 'NIAGA'
  | 'LAYANAN_POS'
  | 'MENARA_NON_FIBER'

export const CATEGORY_LABELS: Record<PoICategory, string> = {
  PENDIDIKAN: 'Pendidikan',
  KESEHATAN: 'Kesehatan',
  PEMERINTAHAN: 'Pemerintahan',
  NIAGA: 'Niaga',
  LAYANAN_POS: 'Layanan Pos',
  MENARA_NON_FIBER: 'Menara Non-Fiber',
}

export type PoISubtype =
  | 'SD'
  | 'SMP'
  | 'SMA'
  | 'PT'
  | 'PUSKESMAS'
  | 'RS'
  | 'KELURAHAN'
  | 'KECAMATAN'
  | 'KABUPATEN'
  | 'PASAR'
  | 'PUSAT_PERDAGANGAN'
  | 'KANTOR_POS'
  | 'MENARA'

export const SUBTYPE_LABELS: Record<PoISubtype, string> = {
  SD: 'SD',
  SMP: 'SMP',
  SMA: 'SMA',
  PT: 'Perguruan Tinggi',
  PUSKESMAS: 'Puskesmas',
  RS: 'Rumah Sakit',
  KELURAHAN: 'Kantor Kelurahan',
  KECAMATAN: 'Kantor Kecamatan',
  KABUPATEN: 'Kantor Kabupaten',
  PASAR: 'Pasar',
  PUSAT_PERDAGANGAN: 'Pusat Perdagangan',
  KANTOR_POS: 'Kantor Pos',
  MENARA: 'Menara Telekomunikasi',
}

export type FoStatus = 'FO_READY' | 'NON_FO'

export interface PoI {
  id: string
  name: string
  category: PoICategory
  subtype: PoISubtype
  city: City
  lat: number
  lng: number
  capacityMbps: number
  monthlyRevenueIdr: number
  foStatus?: FoStatus
  nearestSupplyId?: string
  distanceToNearestSupplyM?: number
  clusterId?: string
}

export type SupplyType = 'ODP' | 'MENARA_FIBERIZED'

/** Peran supply dalam hierarki jaringan (pilar #4). POP = homing target feeder. */
export type SupplyRole = 'odp' | 'fiberized_tower'

export interface SupplyPoint {
  id: string
  type: SupplyType
  name: string
  city: City
  lat: number
  lng: number
  maxPorts: number
  usedPorts: number
  utilization?: number
  servedPoICount?: number
  /** Diturunkan dari `type`; `fiberized_tower` jadi kandidat POP (pilar #4). */
  role?: SupplyRole
}

export interface FiberCable {
  id: string
  fromSupplyId: string
  toSupplyId: string
  city: City
  lengthM: number
  geometry: LineString
}

export interface Cluster {
  id: string
  city: City
  centroid: { lat: number; lng: number }
  memberIds: string[]
  totalCapacityMbps: number
  totalMonthlyRevenueIdr: number
  maxInternalDistanceM: number
  nearestSupplyId: string
  distanceToNearestSupplyM: number

  // ── ClusterExt (pilar #3,#4,#6) — opsional, diisi progresif per fase ──
  /** Kapasitas port ODP (8 | 16). */
  portCapacity?: number
  assignedPoiCount?: number
  /** assigned / portCapacity. */
  capacityUtil?: number
  snappedToRoad?: boolean
  snapNodeId?: number | null
  /** Centroid tervalidasi tidak berada di hard-block. */
  inHardBlock?: boolean
  /** Jumlah PoI yang drop ter-route > MAX_DROP_ROUTED_M. */
  undeliverableDrops?: number
  /** Rute feeder ke POP terdekat (sebelum MST global). */
  feeder?: RoutedPath | null
  homingPopId?: string | null
  // ekonomi (pilar #6)
  homesPassed?: number
  demandMbps?: number
  monthlyRevenueIdr?: number
  capexIdr?: number
  paybackMonths?: number | null
  npvIdr?: number
  roiScore?: number
  phase?: 1 | 2 | 3 | null
}

export interface CategoryStats {
  total: number
  foReady: number
  nonFo: number
  revenueIdr: number
}

export interface AnalysisResult {
  runAt: string
  bufferRadiusM: 200
  maxClusterDistM: 300
  totalPoI: number
  foReadyCount: number
  foReadyPct: number
  nonFoCount: number
  nonFoPct: number
  clusters: Cluster[]
  revenueCapturedIdr: number
  revenueLostIdr: number
  byCategory: Record<PoICategory, CategoryStats>

  // ── AnalysisResultExt (pilar #4,#5,#6) — opsional, diisi progresif ──
  topology?: NetworkTopology
  capex?: CapexSummary
  constraintImpact?: ConstraintImpact
}

// ════════════════════════════════════════════════════════════════════
//  Tambahan v2 — Constraint-aware & cost-aware rollout engine
// ════════════════════════════════════════════════════════════════════

// ── Geo & constraint (pilar #1) ──────────────────────────────────────
export type Wilayah = 'kota_bandung' | 'kota_cimahi' | 'kab_bandung_barat'

export const WILAYAH_BY_CITY: Record<City, Wilayah> = {
  KOTA_BANDUNG: 'kota_bandung',
  KOTA_CIMAHI: 'kota_cimahi',
  KAB_BANDUNG_BARAT: 'kab_bandung_barat',
}

export type ConstraintCategory =
  | 'airport_kkop'
  | 'heritage_zone'
  | 'military'
  | 'rail_row'
  | 'toll_row'
  | 'hsr_row'
  | 'conservation_forest'
  | 'water_body'
  | 'river_setback'
  | 'national_road'
  | 'steep_slope'

export const CONSTRAINT_CATEGORY_LABELS: Record<ConstraintCategory, string> = {
  airport_kkop: 'KKOP Bandara',
  heritage_zone: 'Kawasan Cagar Budaya',
  military: 'Instalasi Militer',
  rail_row: 'RoW Kereta Api',
  toll_row: 'RoW Jalan Tol',
  hsr_row: 'RoW Kereta Cepat',
  conservation_forest: 'Hutan Konservasi',
  water_body: 'Badan Air',
  river_setback: 'Sempadan Sungai',
  national_road: 'Jalan Nasional',
  steep_slope: 'Lereng Curam',
}

export type ConstraintSeverity = 'hard' | 'soft'
export type MethodForce = 'underground' | 'boring_only' | null

export interface ConstraintProps {
  id: string
  name: string
  category: ConstraintCategory
  severity: ConstraintSeverity
  methodForce: MethodForce
  costMultiplier: number
  wilayah: Wilayah[]
  source: string
  /** true = real/derived dari OSM dll; false = placeholder sintetis. */
  realData: boolean
}

export type ConstraintFeature = Feature<Polygon | MultiPolygon, ConstraintProps>

// ── Deployment & routing (pilar #2,#3,#4) ────────────────────────────
export type DeploymentMethod = 'aerial' | 'underground' | 'boring'
export type ConstraintClass = 'none' | 'soft' | 'hard'

export interface RoadNode {
  id: number
  lat: number
  lng: number
}

export interface RoadEdge {
  id: number
  a: number
  b: number
  lengthM: number
  highway: string
  method: DeploymentMethod
  constraintClass: ConstraintClass
  costMultiplier: number
  baseCostIdr: number
  /** Hard-block disimpan sebagai sentinel besar; dikonversi Infinity saat load. */
  totalCostIdr: number
  /**
   * Polyline [lng,lat] sepanjang jalan (hasil kompresi degree-2). Berisi
   * intermediate antar 2 junction; endpoint = posisi node a & b. Untuk render.
   */
  geom?: [number, number][]
}

export interface RoadGraphData {
  meta: { generatedAt: string; bbox: [number, number, number, number]; crs: string }
  nodes: RoadNode[]
  edges: RoadEdge[]
}

export interface MethodBreakdown {
  aerialM: number
  undergroundM: number
  boringM: number
}

export interface RoutedPath {
  /** [lng, lat] sepanjang jalan. */
  coords: [number, number][]
  lengthM: number
  costIdr: number
  methodBreakdown: MethodBreakdown
  /** true jika tak ada rute valid → flag. */
  crossesHardBlock: boolean
  /** true jika rute terpaksa memutar. */
  reroutedAroundConstraint: boolean
  /** panjang ter-route / panjang garis lurus. */
  detourRatio: number
}

// ── Topologi jaringan (pilar #4) ─────────────────────────────────────
export interface PopSite {
  id: string
  lat: number
  lng: number
  name: string
  capacityPorts: number
  wilayah: Wilayah
}

export interface FeederLink {
  fromId: string
  toId: string
  path: RoutedPath
}

export interface NetworkTopology {
  links: FeederLink[]
  totalFeederM: number
  totalFeederCostIdr: number
  /** popId → [clusterId...] */
  homingByPop: Record<string, string[]>
}

// ── Demand (pilar #5) ────────────────────────────────────────────────
export interface DemandCell {
  h3: string
  householdEst: number
  takeUpRate: number
  demandMbps: number
  incumbentScore: number
  whitespaceScore: number
  wilayah: Wilayah
}

export interface DemandCellProps {
  h3: string
  householdEst: number
  popEst: number
  wilayah: Wilayah
  source: string
  realData: boolean
}

export type DemandFeature = Feature<Polygon, DemandCellProps>

export interface IncumbentCellProps {
  h3: string
  incumbentScore: number
  method: string
  realData: boolean
}

export type IncumbentFeature = Feature<Polygon, IncumbentCellProps>

// ── Capex & phasing (pilar #6) ───────────────────────────────────────
export interface CapexSummary {
  totalCapexIdr: number
  totalMonthlyRevenueIdr: number
  blendedPaybackMonths: number | null
  totalHomesPassed: number
  byPhase: Record<1 | 2 | 3, { clusters: number; capexIdr: number; revenueIdr: number }>
}

export interface ConstraintImpact {
  routesRerouted: number
  routesBlocked: number
  /** selisih total biaya rute dengan vs tanpa constraint multiplier. */
  extraCostFromConstraintsIdr: number
  poiInRestricted: number
}

// ── Asumsi biaya (editable, default dari constants) ──────────────────
export interface CostAssumptions {
  aerialIdrPerM: number
  undergroundIdrPerM: number
  boringIdrPerM: number
  /** 0..1 diskon reuse konduit pada underground. */
  conduitReuseDiscount: number
  /** 0..1 make-ready ditambahkan ke segmen aerial bertiang sewa. */
  makeReadyShare: number
}
