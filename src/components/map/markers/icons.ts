import L from 'leaflet'
import type { PoICategory, SupplyType } from '@/types/domain'

const CATEGORY_COLOR: Record<PoICategory, string> = {
  PENDIDIKAN: '#2563eb',
  KESEHATAN: '#db2777',
  PEMERINTAHAN: '#0891b2',
  NIAGA: '#ea580c',
  LAYANAN_POS: '#4f46e5',
  MENARA_NON_FIBER: '#64748b',
}

const CATEGORY_SYMBOL: Record<PoICategory, string> = {
  PENDIDIKAN: '🎓',
  KESEHATAN: '✚',
  PEMERINTAHAN: '⬢',
  NIAGA: '◆',
  LAYANAN_POS: '✉',
  MENARA_NON_FIBER: '▲',
}

export function getPoIIcon(category: PoICategory): L.DivIcon {
  const color = CATEGORY_COLOR[category]
  const symbol = CATEGORY_SYMBOL[category]
  const size = 22
  return L.divIcon({
    className: 'poi-marker',
    html: `<span class="poi-dot" style="background:${color};width:${size}px;height:${size}px;">${symbol}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function getCategoryColor(category: PoICategory): string {
  return CATEGORY_COLOR[category]
}

export function getSupplyIcon(type: SupplyType): L.DivIcon {
  const color = type === 'ODP' ? '#059669' : '#7c3aed'
  const symbol = type === 'ODP' ? '●' : '▲'
  const size = type === 'ODP' ? 16 : 22
  return L.divIcon({
    className: 'supply-marker',
    html: `<span class="supply-dot" style="background:${color};width:${size}px;height:${size}px;">${symbol}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function clusterCentroidIcon(count: number): L.DivIcon {
  return L.divIcon({
    className: 'cluster-centroid',
    html: `<div class="cc-wrap"><span class="cc-pulse"></span><span class="cc-dot">${count}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  })
}
