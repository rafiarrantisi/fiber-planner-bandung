const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('id-ID')

const percentFormatter = new Intl.NumberFormat('id-ID', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatIdr(value: number): string {
  return idrFormatter.format(value)
}

export function formatIdrCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(2).replace('.', ',')} M`
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} Jt`
  }
  return formatIdr(value)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatMbps(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')} Gbps`
  }
  return `${formatNumber(value)} Mbps`
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value)
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2).replace('.', ',')} km`
  }
  return `${Math.round(meters)} m`
}
