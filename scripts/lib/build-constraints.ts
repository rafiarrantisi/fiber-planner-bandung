import { promises as fs } from 'node:fs'
import path from 'node:path'
import * as turf from '@turf/turf'
import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiPolygon,
  Polygon,
  Position,
} from 'geojson'
import type {
  City,
  ConstraintCategory,
  ConstraintProps,
  ConstraintSeverity,
  MethodForce,
  Wilayah,
} from '../../src/types/domain'
import { WILAYAH_BY_CITY } from '../../src/types/domain'
import { overpassQuery, elementsToFeatures } from './overpass'
import { curatedConstraints } from './curated-constraints'

const OUTPUT_FILE = path.resolve('public/data/constraints.geojson')
const SIMPLIFY_TOLERANCE = 0.00012 // ~13 m, perkecil ukuran file
const MIN_WATER_AREA_M2 = 50_000 // hanya badan air signifikan (≥5 ha)

interface OsmSpec {
  id: string
  category: ConstraintCategory
  severity: ConstraintSeverity
  methodForce: MethodForce
  costMultiplier: number
  bufferM: number // 0 = sudah poligon; >0 = buffer line
  unionLines: boolean // gabung hasil buffer line jadi satu feature/wilayah
  minAreaM2?: number
  inner: (bbox: string) => string
}

const OSM_SPECS: OsmSpec[] = [
  {
    id: 'military',
    category: 'military',
    severity: 'hard',
    methodForce: null,
    costMultiplier: 1,
    bufferM: 0,
    unionLines: false,
    inner: (b) =>
      `way["landuse"="military"](${b});relation["landuse"="military"](${b});`,
  },
  {
    id: 'protected',
    category: 'conservation_forest',
    severity: 'hard',
    methodForce: null,
    costMultiplier: 1,
    bufferM: 0,
    unionLines: false,
    minAreaM2: 100_000,
    inner: (b) =>
      `way["boundary"="protected_area"](${b});relation["boundary"="protected_area"](${b});` +
      `way["leisure"="nature_reserve"](${b});relation["leisure"="nature_reserve"](${b});`,
  },
  {
    id: 'water',
    category: 'water_body',
    severity: 'hard',
    methodForce: null,
    costMultiplier: 1,
    bufferM: 0,
    unionLines: false,
    minAreaM2: MIN_WATER_AREA_M2,
    inner: (b) =>
      `way["natural"="water"](${b});relation["natural"="water"](${b});` +
      `way["landuse"="reservoir"](${b});relation["landuse"="reservoir"](${b});`,
  },
  {
    id: 'rail',
    category: 'rail_row',
    severity: 'hard',
    methodForce: null,
    costMultiplier: 1,
    bufferM: 30,
    unionLines: true,
    inner: (b) => `way["railway"="rail"](${b});`,
  },
  {
    id: 'toll',
    category: 'toll_row',
    severity: 'hard',
    methodForce: null,
    costMultiplier: 1,
    bufferM: 40,
    unionLines: true,
    inner: (b) => `way["highway"="motorway"](${b});`,
  },
  {
    id: 'river',
    category: 'river_setback',
    severity: 'soft',
    methodForce: 'boring_only',
    costMultiplier: 1.8,
    bufferM: 30,
    unionLines: true,
    inner: (b) => `way["waterway"="river"](${b});`,
  },
  {
    id: 'national',
    category: 'national_road',
    severity: 'soft',
    methodForce: 'boring_only',
    costMultiplier: 1.6,
    bufferM: 25,
    unionLines: true,
    inner: (b) => `way["highway"="trunk"](${b});`,
  },
]

const CATEGORY_NAME: Record<ConstraintCategory, string> = {
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

interface AdminRegion {
  wilayah: Wilayah
  poly: Feature<Polygon | MultiPolygon>
}

function loadAdmin(): Promise<{ regions: AdminRegion[]; union: Feature<Polygon | MultiPolygon>; bbox: string }> {
  return fs.readFile(path.resolve('public/data/admin-boundaries.geojson'), 'utf8').then((raw) => {
    const fc = JSON.parse(raw) as FeatureCollection<
      Polygon | MultiPolygon,
      { city: City }
    >
    const regions: AdminRegion[] = fc.features.map((f) => ({
      wilayah: WILAYAH_BY_CITY[f.properties.city],
      poly: turf.feature(f.geometry) as Feature<Polygon | MultiPolygon>,
    }))
    let union = regions[0].poly
    for (let i = 1; i < regions.length; i++) {
      const u = turf.union(turf.featureCollection([union, regions[i].poly]))
      if (u) union = u as Feature<Polygon | MultiPolygon>
    }
    const [minX, minY, maxX, maxY] = turf.bbox(union)
    // Overpass bbox format: (south,west,north,east)
    const bbox = `${minY},${minX},${maxY},${maxX}`
    return { regions, union, bbox }
  })
}

function wilayahFor(
  feat: Feature<Polygon | MultiPolygon>,
  regions: AdminRegion[],
): Wilayah[] {
  const out: Wilayah[] = []
  for (const r of regions) {
    try {
      if (turf.booleanIntersects(feat, r.poly)) out.push(r.wilayah)
    } catch {
      // geometri rusak → lewati region ini
    }
  }
  return out
}

function clipToUnion(
  feat: Feature<Polygon | MultiPolygon>,
  union: Feature<Polygon | MultiPolygon>,
): Feature<Polygon | MultiPolygon> | null {
  try {
    const clipped = turf.intersect(
      turf.featureCollection([feat, union]),
    ) as Feature<Polygon | MultiPolygon> | null
    return clipped
  } catch {
    // intersect gagal → fallback: simpan utuh bila beririsan
    try {
      return turf.booleanIntersects(feat, union) ? feat : null
    } catch {
      return null
    }
  }
}

function simplify(
  feat: Feature<Polygon | MultiPolygon>,
): Feature<Polygon | MultiPolygon> {
  try {
    return turf.simplify(feat, {
      tolerance: SIMPLIFY_TOLERANCE,
      highQuality: false,
    }) as Feature<Polygon | MultiPolygon>
  } catch {
    return feat
  }
}

let idCounter = 0
function makeProps(
  spec: OsmSpec,
  name: string,
  wilayah: Wilayah[],
): ConstraintProps {
  return {
    id: `${spec.id}-${String(idCounter++).padStart(4, '0')}`,
    name,
    category: spec.category,
    severity: spec.severity,
    methodForce: spec.methodForce,
    costMultiplier: spec.costMultiplier,
    wilayah,
    source: `OSM © OpenStreetMap contributors${spec.bufferM ? ` + buffer ${spec.bufferM} m RoW` : ''}`,
    realData: true,
  }
}

async function buildFromOsm(
  spec: OsmSpec,
  ctx: { regions: AdminRegion[]; union: Feature<Polygon | MultiPolygon>; bbox: string },
): Promise<Feature<Polygon | MultiPolygon, ConstraintProps>[]> {
  const ql = `[out:json][timeout:120];(${spec.inner(ctx.bbox)});out geom;`
  const res = await overpassQuery(ql)
  const raw = elementsToFeatures(res)

  // Pisahkan poligon vs garis
  const polys: Feature<Polygon | MultiPolygon>[] = []
  const lineBuffers: Feature<Polygon | MultiPolygon>[] = []

  for (const f of raw) {
    if (spec.bufferM > 0) {
      if (f.geometry.type !== 'LineString') continue
      const buf = turf.buffer(f as Feature<LineString>, spec.bufferM, {
        units: 'meters',
      })
      if (buf) lineBuffers.push(buf as Feature<Polygon | MultiPolygon>)
    } else {
      if (f.geometry.type === 'LineString') continue
      polys.push(f as Feature<Polygon | MultiPolygon>)
    }
  }

  const out: Feature<Polygon | MultiPolygon, ConstraintProps>[] = []

  // ── Poligon langsung (military/water/protected) ──
  for (const p of polys) {
    if (spec.minAreaM2) {
      try {
        if (turf.area(p) < spec.minAreaM2) continue
      } catch {
        continue
      }
    }
    const clipped = clipToUnion(p, ctx.union)
    if (!clipped) continue
    const wil = wilayahFor(clipped, ctx.regions)
    if (wil.length === 0) continue
    const name =
      (p.properties as { name?: string } | null)?.name ??
      `${CATEGORY_NAME[spec.category]}`
    const simp = simplify(clipped)
    simp.properties = makeProps(spec, name, wil)
    out.push(simp as Feature<Polygon | MultiPolygon, ConstraintProps>)
  }

  // ── Garis di-buffer: gabung jadi satu MultiPolygon (concat coords,
  //    TANPA dissolve geometris yang mahal), clip & simplify sekali. ──
  if (lineBuffers.length > 0 && spec.unionLines) {
    const coords: Position[][][] = []
    for (const b of lineBuffers) {
      if (b.geometry.type === 'Polygon') {
        coords.push(b.geometry.coordinates)
      } else {
        for (const poly of b.geometry.coordinates) coords.push(poly)
      }
    }
    if (coords.length > 0) {
      const multi: Feature<MultiPolygon> = turf.multiPolygon(coords)
      const clipped = clipToUnion(multi, ctx.union)
      if (clipped) {
        const wil = wilayahFor(clipped, ctx.regions)
        if (wil.length > 0) {
          const simp = simplify(clipped)
          simp.properties = makeProps(spec, CATEGORY_NAME[spec.category], wil)
          out.push(simp as Feature<Polygon | MultiPolygon, ConstraintProps>)
        }
      }
    }
  }

  return out
}

/** Fallback sintetis bila Overpass gagal total (degradasi anggun §1.9). */
function syntheticFallback(
  spec: OsmSpec,
  ctx: { regions: AdminRegion[]; union: Feature<Polygon | MultiPolygon> },
): Feature<Polygon | MultiPolygon, ConstraintProps>[] {
  // satu poligon placeholder kecil dekat centroid tiap wilayah relevan
  const out: Feature<Polygon | MultiPolygon, ConstraintProps>[] = []
  for (const r of ctx.regions) {
    const c = turf.centroid(r.poly)
    const buf = turf.buffer(c, spec.bufferM > 0 ? 300 : 600, {
      units: 'meters',
    }) as Feature<Polygon>
    const clipped = clipToUnion(buf, ctx.union)
    if (!clipped) continue
    clipped.properties = {
      ...makeProps(spec, `${CATEGORY_NAME[spec.category]} (placeholder)`, [
        r.wilayah,
      ]),
      source: 'synthetic_fallback (Overpass tidak tersedia saat generate)',
      realData: false,
    }
    out.push(clipped as Feature<Polygon | MultiPolygon, ConstraintProps>)
  }
  return out
}

export async function buildConstraints(): Promise<void> {
  const ctx = await loadAdmin()
  console.log(`  → admin union bbox: ${ctx.bbox}`)

  const features: Feature<Polygon | MultiPolygon, ConstraintProps>[] = []

  for (const spec of OSM_SPECS) {
    try {
      console.log(`  → OSM: ${spec.id} (${spec.category})…`)
      const f = await buildFromOsm(spec, ctx)
      console.log(`    ✓ ${f.length} feature`)
      features.push(...f)
    } catch (err) {
      console.warn(
        `    ⚠ ${spec.id} gagal (${String(
          err instanceof Error ? err.message : err,
        )}) → fallback sintetis`,
      )
      features.push(...syntheticFallback(spec, ctx))
    }
  }

  // ── Curated (heritage, KKOP, HSR) — clip ke union ──
  console.log('  → curated (heritage / KKOP / HSR Whoosh)…')
  for (const c of curatedConstraints()) {
    const clipped = clipToUnion(c, ctx.union)
    if (!clipped) continue
    clipped.properties = c.properties
    features.push(clipped as Feature<Polygon | MultiPolygon, ConstraintProps>)
  }

  const fc: FeatureCollection<Polygon | MultiPolygon, ConstraintProps> = {
    type: 'FeatureCollection',
    features,
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(fc))
  const hard = features.filter((f) => f.properties.severity === 'hard').length
  const soft = features.length - hard
  console.log(
    `  ✓ ${features.length} constraint ditulis (${hard} hard, ${soft} soft)`,
  )
}
