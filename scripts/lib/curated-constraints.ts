import * as turf from '@turf/turf'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { ConstraintProps } from '../../src/types/domain'

/**
 * Constraint hand-curated (aproksimasi dari landmark/parameter publik).
 * Bukan poligon resmi — `realData:false` + `source` jujur (§13).
 */

interface CuratedPoint {
  props: Omit<ConstraintProps, 'wilayah'> & { wilayah: ConstraintProps['wilayah'] }
  center: [number, number] // [lng, lat]
  radiusM: number
}

interface CuratedLine {
  props: Omit<ConstraintProps, 'wilayah'> & { wilayah: ConstraintProps['wilayah'] }
  line: [number, number][] // [[lng,lat],...]
  bufferM: number
}

// ── Kota Bandung — heritage & KKOP ──────────────────────────────────
const HERITAGE: CuratedPoint[] = [
  {
    props: {
      id: 'heritage-braga',
      name: 'Kawasan Cagar Budaya Braga',
      category: 'heritage_zone',
      severity: 'soft',
      methodForce: 'underground',
      costMultiplier: 1.8,
      source: 'hand-curated dari landmark Braga + Perda cagar budaya (indikatif)',
      realData: false,
      wilayah: ['kota_bandung'],
    },
    center: [107.6090, -6.9175],
    radiusM: 250,
  },
  {
    props: {
      id: 'heritage-asia-afrika',
      name: 'Asia-Afrika / Gedung Merdeka',
      category: 'heritage_zone',
      severity: 'soft',
      methodForce: 'underground',
      costMultiplier: 1.8,
      source: 'hand-curated dari landmark Gedung Merdeka (indikatif)',
      realData: false,
      wilayah: ['kota_bandung'],
    },
    center: [107.6096, -6.9211],
    radiusM: 300,
  },
  {
    props: {
      id: 'heritage-gedung-sate',
      name: 'Kawasan Gedung Sate',
      category: 'heritage_zone',
      severity: 'soft',
      methodForce: 'underground',
      costMultiplier: 1.8,
      source: 'hand-curated dari landmark Gedung Sate (indikatif)',
      realData: false,
      wilayah: ['kota_bandung'],
    },
    center: [107.6187, -6.9025],
    radiusM: 400,
  },
  {
    props: {
      id: 'heritage-cipaganti',
      name: 'Jalan Cipaganti (heritage)',
      category: 'heritage_zone',
      severity: 'soft',
      methodForce: 'underground',
      costMultiplier: 1.8,
      source: 'hand-curated dari koridor Cipaganti (indikatif)',
      realData: false,
      wilayah: ['kota_bandung'],
    },
    center: [107.6060, -6.8930],
    radiusM: 280,
  },
]

const KKOP: CuratedPoint[] = [
  {
    props: {
      id: 'kkop-husein',
      name: 'KKOP Husein Sastranegara',
      category: 'airport_kkop',
      severity: 'soft',
      methodForce: 'underground',
      costMultiplier: 1.6,
      source: 'aproksimasi param KKOP publik (pusat runway Husein) — bukan poligon resmi',
      realData: false,
      wilayah: ['kota_bandung', 'kota_cimahi'],
    },
    center: [107.5763, -6.9006],
    radiusM: 2500,
  },
]

// ── KBB — RoW Kereta Cepat Whoosh (lintas + Stasiun Padalarang) ──────
const HSR: CuratedLine[] = [
  {
    props: {
      id: 'hsr-whoosh-padalarang',
      name: 'RoW Kereta Cepat Whoosh (Padalarang)',
      category: 'hsr_row',
      severity: 'hard',
      methodForce: null,
      costMultiplier: 1,
      source: 'aproksimasi lintasan HSR melalui Padalarang (RoW nyaris untouchable)',
      realData: false,
      wilayah: ['kab_bandung_barat'],
    },
    // lintas kasar barat→timur melalui Padalarang menuju batas Kota Bandung
    line: [
      [107.4450, -6.8520],
      [107.4760, -6.8430],
      [107.5050, -6.8400],
      [107.5350, -6.8480],
    ],
    bufferM: 60,
  },
]

function pointZone(p: CuratedPoint): Feature<Polygon | MultiPolygon, ConstraintProps> {
  const buf = turf.buffer(turf.point(p.center), p.radiusM, { units: 'meters' }) as Feature<
    Polygon,
    ConstraintProps
  >
  buf.properties = p.props
  return buf
}

function lineZone(l: CuratedLine): Feature<Polygon | MultiPolygon, ConstraintProps> {
  const buf = turf.buffer(turf.lineString(l.line), l.bufferM, { units: 'meters' }) as Feature<
    Polygon,
    ConstraintProps
  >
  buf.properties = l.props
  return buf
}

export function curatedConstraints(): Feature<Polygon | MultiPolygon, ConstraintProps>[] {
  return [
    ...HERITAGE.map(pointZone),
    ...KKOP.map(pointZone),
    ...HSR.map(lineZone),
  ]
}
