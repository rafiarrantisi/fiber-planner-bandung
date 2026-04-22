import type { City } from '../../src/types/domain'

export interface DensityCenter {
  name: string
  lat: number
  lng: number
  sigmaKm: number
  weight: number
}

export const DENSITY_CENTERS: Record<City, DensityCenter[]> = {
  KOTA_BANDUNG: [
    { name: 'Alun-alun Bandung', lat: -6.9215, lng: 107.6072, sigmaKm: 3.2, weight: 1.0 },
    { name: 'Dago', lat: -6.8841, lng: 107.6145, sigmaKm: 2.5, weight: 0.8 },
    { name: 'Gedebage', lat: -6.9483, lng: 107.6938, sigmaKm: 2.8, weight: 0.55 },
    { name: 'Cibiru', lat: -6.9202, lng: 107.7144, sigmaKm: 2.0, weight: 0.45 },
  ],
  KOTA_CIMAHI: [
    { name: 'Cimahi Tengah', lat: -6.8712, lng: 107.5423, sigmaKm: 2.2, weight: 1.0 },
    { name: 'Cimahi Selatan', lat: -6.9001, lng: 107.5456, sigmaKm: 1.8, weight: 0.7 },
  ],
  KAB_BANDUNG_BARAT: [
    { name: 'Ngamprah', lat: -6.8412, lng: 107.5192, sigmaKm: 2.6, weight: 1.0 },
    { name: 'Lembang', lat: -6.8119, lng: 107.6177, sigmaKm: 2.4, weight: 0.85 },
    { name: 'Padalarang', lat: -6.8505, lng: 107.4741, sigmaKm: 2.4, weight: 0.75 },
    { name: 'Batujajar', lat: -6.9030, lng: 107.4831, sigmaKm: 2.0, weight: 0.55 },
    { name: 'Cisarua', lat: -6.7403, lng: 107.5819, sigmaKm: 1.8, weight: 0.4 },
  ],
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function densityAt(lat: number, lng: number, city: City): number {
  const centers = DENSITY_CENTERS[city]
  let total = 0
  for (const c of centers) {
    const d = haversineKm([lat, lng], [c.lat, c.lng])
    const g = Math.exp(-(d * d) / (2 * c.sigmaKm * c.sigmaKm))
    total += c.weight * g
  }
  return total
}
