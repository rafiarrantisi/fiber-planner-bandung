import * as turf from '@turf/turf'
import Flatbush from 'flatbush'
import type { Feature, LineString, MultiPolygon, Polygon } from 'geojson'
import type {
  ConstraintClass,
  ConstraintFeature,
  MethodForce,
} from '@/types/domain'

/** Index spasial + referensi feature untuk lookup constraint cepat. */
export interface ConstraintIndex {
  flatbush: Flatbush | null
  features: ConstraintFeature[]
  /** bbox tiap feature: [minX,minY,maxX,maxY]. */
  bboxes: [number, number, number, number][]
}

export interface ClassifyResult {
  class: ConstraintClass
  multiplier: number
  methodForce: MethodForce
}

const NONE: ClassifyResult = { class: 'none', multiplier: 1, methodForce: null }

/** Urutan keketatan methodForce: boring_only > underground > null. */
function strictestMethod(a: MethodForce, b: MethodForce): MethodForce {
  const rank = (m: MethodForce): number =>
    m === 'boring_only' ? 2 : m === 'underground' ? 1 : 0
  return rank(a) >= rank(b) ? a : b
}

/** Bangun index bbox tiap poligon constraint (Flatbush). */
export function buildIndex(features: ConstraintFeature[]): ConstraintIndex {
  if (features.length === 0) {
    return { flatbush: null, features: [], bboxes: [] }
  }
  const flatbush = new Flatbush(features.length)
  const bboxes: [number, number, number, number][] = []
  for (const f of features) {
    const bb = turf.bbox(f) as [number, number, number, number]
    bboxes.push(bb)
    flatbush.add(bb[0], bb[1], bb[2], bb[3])
  }
  flatbush.finish()
  return { flatbush, features, bboxes }
}

function candidateIndices(
  idx: ConstraintIndex,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): number[] {
  if (!idx.flatbush) return []
  return idx.flatbush.search(minX, minY, maxX, maxY)
}

function aggregate(
  results: { severity: 'hard' | 'soft'; multiplier: number; methodForce: MethodForce }[],
): ClassifyResult {
  if (results.length === 0) return NONE
  if (results.some((r) => r.severity === 'hard')) {
    return { class: 'hard', multiplier: 1, methodForce: null }
  }
  // semua soft → ambil multiplier tertinggi & method terketat
  let multiplier = 1
  let methodForce: MethodForce = null
  for (const r of results) {
    if (r.multiplier > multiplier) multiplier = r.multiplier
    methodForce = strictestMethod(methodForce, r.methodForce)
  }
  return { class: 'soft', multiplier, methodForce }
}

/** Klasifikasi sebuah titik [lng,lat] terhadap semua constraint. */
export function classifyPoint(
  pt: [number, number],
  idx: ConstraintIndex,
): ClassifyResult {
  const cand = candidateIndices(idx, pt[0], pt[1], pt[0], pt[1])
  if (cand.length === 0) return NONE
  const point = turf.point(pt)
  const hits: { severity: 'hard' | 'soft'; multiplier: number; methodForce: MethodForce }[] = []
  for (const i of cand) {
    const f = idx.features[i]
    try {
      if (turf.booleanPointInPolygon(point, f)) {
        hits.push({
          severity: f.properties.severity,
          multiplier: f.properties.costMultiplier,
          methodForce: f.properties.methodForce,
        })
      }
    } catch {
      // geometri rusak → lewati
    }
  }
  return aggregate(hits)
}

/**
 * Klasifikasi sebuah segmen (LineString) terhadap constraint.
 * Sampel titik tengah + endpoint untuk soft; turf.lineIntersect untuk
 * deteksi crossing hard-block.
 */
export function classifySegment(
  line: Feature<LineString>,
  idx: ConstraintIndex,
): ClassifyResult & { crossesHard: boolean } {
  const coords = line.geometry.coordinates
  if (coords.length < 2) return { ...NONE, crossesHard: false }

  const a = coords[0] as [number, number]
  const b = coords[coords.length - 1] as [number, number]
  const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

  const bb = turf.bbox(line) as [number, number, number, number]
  const cand = candidateIndices(idx, bb[0], bb[1], bb[2], bb[3])
  if (cand.length === 0) return { ...NONE, crossesHard: false }

  const samples = [turf.point(a), turf.point(mid), turf.point(b)]
  const hits: { severity: 'hard' | 'soft'; multiplier: number; methodForce: MethodForce }[] = []
  let crossesHard = false

  for (const i of cand) {
    const f = idx.features[i]
    let touches = false
    try {
      touches = samples.some((s) => turf.booleanPointInPolygon(s, f))
      if (!touches) {
        const x = turf.lineIntersect(line, f)
        touches = x.features.length > 0
      }
    } catch {
      touches = false
    }
    if (!touches) continue
    if (f.properties.severity === 'hard') crossesHard = true
    hits.push({
      severity: f.properties.severity,
      multiplier: f.properties.costMultiplier,
      methodForce: f.properties.methodForce,
    })
  }

  return { ...aggregate(hits), crossesHard }
}

/**
 * Union seluruh poligon constraint severity="hard".
 * Dipakai untuk: (a) menolak snap centroid ODP ke node di hard-block,
 * (b) visual highlight zona terlarang. Mengembalikan null bila tak ada hard-block.
 */
export function unionHardBlocks(
  features: ConstraintFeature[],
): Feature<Polygon | MultiPolygon> | null {
  const hard = features.filter((f) => f.properties.severity === 'hard')
  if (hard.length === 0) return null

  let merged: Feature<Polygon | MultiPolygon> = turf.feature(hard[0].geometry)
  for (let i = 1; i < hard.length; i++) {
    try {
      const u = turf.union(
        turf.featureCollection([merged, turf.feature(hard[i].geometry)]),
      )
      if (u) merged = u as Feature<Polygon | MultiPolygon>
    } catch {
      // union gagal → pertahankan akumulasi
    }
  }
  return merged
}

/** Predikat cepat: apakah titik [lng,lat] berada di hard-block? */
export function makeHardBlockTest(
  idx: ConstraintIndex,
): (lng: number, lat: number) => boolean {
  return (lng, lat) => classifyPoint([lng, lat], idx).class === 'hard'
}

/** Hitung jumlah PoI yang berada di area restricted (hard atau soft). */
export function countPoiInRestricted(
  points: { lng: number; lat: number }[],
  idx: ConstraintIndex,
): number {
  let n = 0
  for (const p of points) {
    if (classifyPoint([p.lng, p.lat], idx).class !== 'none') n++
  }
  return n
}
