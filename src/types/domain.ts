import type { LineString } from 'geojson'

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
}
