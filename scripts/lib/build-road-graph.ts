import { promises as fs } from 'node:fs'
import path from 'node:path'
import * as turf from '@turf/turf'
import Flatbush from 'flatbush'
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from 'geojson'
import type {
  City,
  ConstraintClass,
  ConstraintProps,
  DeploymentMethod,
  MethodForce,
  RoadEdge,
  RoadNode,
  Wilayah,
} from '../../src/types/domain'
import { WILAYAH_BY_CITY } from '../../src/types/domain'
import { overpassQuery } from './overpass'

const OUTPUT_FILE = path.resolve('public/data/road-graph.json')
const CONSTRAINTS_FILE = path.resolve('public/data/constraints.geojson')

// Mirror dari src/lib/constants.ts (build-time; alias @/ tak resolve di tsx)
const COST_AERIAL_IDR_PER_M = 28_000
const COST_UNDERGROUND_MULT = 2.5
const COST_BORING_MULT = 3.75
const HARD_BLOCK_COST_SENTINEL = 1e15

const RATE: Record<DeploymentMethod, number> = {
  aerial: COST_AERIAL_IDR_PER_M,
  underground: COST_AERIAL_IDR_PER_M * COST_UNDERGROUND_MULT,
  boring: COST_AERIAL_IDR_PER_M * COST_BORING_MULT,
}

// Arterial+collector+residential (residential = perekat konektivitas jaringan;
// tanpa itu graph terpecah). Buang footway/path/service. Ukuran ditekan lewat
// kompresi degree-2 + simplifikasi geom + ambil komponen terbesar.
const HIGHWAY_CLASSES =
  'motorway|trunk|primary|secondary|tertiary|unclassified|residential'
const ROUND = 1e5 // 5 desimal ≈ 1.1 m
const SIMPLIFY_TOLERANCE = 0.00009 // ~10 m, kurangi titik polyline edge

function r5(v: number): number {
  return Math.round(v * ROUND) / ROUND
}

interface RawNode { type: 'node'; id: number; lat: number; lon: number }
interface RawWay { type: 'way'; id: number; nodes: number[]; tags?: Record<string, string> }

interface AdminRegion {
  wilayah: Wilayah
  poly: Feature<Polygon | MultiPolygon>
  bbox: [number, number, number, number]
}

// ── Constraint index (build-time) ───────────────────────────────────
interface CIndex {
  flatbush: Flatbush | null
  features: Feature<Polygon | MultiPolygon, ConstraintProps>[]
}

async function loadConstraintIndex(): Promise<CIndex> {
  try {
    const fc = JSON.parse(
      await fs.readFile(CONSTRAINTS_FILE, 'utf8'),
    ) as FeatureCollection<Polygon | MultiPolygon, ConstraintProps>
    if (fc.features.length === 0) return { flatbush: null, features: [] }
    const fb = new Flatbush(fc.features.length)
    for (const f of fc.features) {
      const [minX, minY, maxX, maxY] = turf.bbox(f)
      fb.add(minX, minY, maxX, maxY)
    }
    fb.finish()
    return { flatbush: fb, features: fc.features }
  } catch {
    return { flatbush: null, features: [] }
  }
}

function strictestMethod(a: MethodForce, b: MethodForce): MethodForce {
  const rank = (m: MethodForce) =>
    m === 'boring_only' ? 2 : m === 'underground' ? 1 : 0
  return rank(a) >= rank(b) ? a : b
}

interface SegClass {
  cls: ConstraintClass
  multiplier: number
  methodForce: MethodForce
}

/** Klasifikasi polyline edge terkompresi terhadap constraint. */
function classifyPolyline(geom: [number, number][], idx: CIndex): SegClass {
  const none: SegClass = { cls: 'none', multiplier: 1, methodForce: null }
  if (!idx.flatbush || geom.length < 2) return none

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of geom) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const cand = idx.flatbush.search(minX, minY, maxX, maxY)
  if (cand.length === 0) return none

  const line = turf.lineString(geom)
  // sampel beberapa titik sepanjang polyline
  const samples = [
    turf.point(geom[0]),
    turf.point(geom[Math.floor(geom.length / 2)]),
    turf.point(geom[geom.length - 1]),
  ]

  let hard = false
  let multiplier = 1
  let methodForce: MethodForce = null
  let softHit = false

  for (const i of cand) {
    const f = idx.features[i]
    let touches = false
    try {
      touches = samples.some((s) => turf.booleanPointInPolygon(s, f))
      if (!touches) touches = turf.lineIntersect(line, f).features.length > 0
    } catch {
      touches = false
    }
    if (!touches) continue
    if (f.properties.severity === 'hard') {
      hard = true
      break
    }
    softHit = true
    if (f.properties.costMultiplier > multiplier)
      multiplier = f.properties.costMultiplier
    methodForce = strictestMethod(methodForce, f.properties.methodForce)
  }

  if (hard) return { cls: 'hard', multiplier: 1, methodForce: null }
  if (softHit) return { cls: 'soft', multiplier, methodForce }
  return none
}

function baseMethod(highway: string): DeploymentMethod {
  if (highway === 'motorway' || highway === 'trunk' || highway === 'primary')
    return 'underground'
  return 'aerial'
}

function resolveMethod(highway: string, seg: SegClass): DeploymentMethod {
  if (seg.methodForce === 'boring_only') return 'boring'
  if (seg.methodForce === 'underground') return 'underground'
  return baseMethod(highway)
}

async function loadAdmin(): Promise<{ regions: AdminRegion[]; bbox: string }> {
  const fc = JSON.parse(
    await fs.readFile(
      path.resolve('public/data/admin-boundaries.geojson'),
      'utf8',
    ),
  ) as FeatureCollection<Polygon | MultiPolygon, { city: City }>
  const regions: AdminRegion[] = fc.features.map((f) => ({
    wilayah: WILAYAH_BY_CITY[f.properties.city],
    poly: turf.feature(f.geometry) as Feature<Polygon | MultiPolygon>,
    bbox: turf.bbox(f) as [number, number, number, number],
  }))
  const [minX, minY, maxX, maxY] = turf.bbox(
    turf.featureCollection(regions.map((rg) => rg.poly)),
  )
  return { regions, bbox: `${minY},${minX},${maxY},${maxX}` }
}

function inUnion(lng: number, lat: number, regions: AdminRegion[]): boolean {
  const pt = turf.point([lng, lat])
  for (const r of regions) {
    if (lng < r.bbox[0] || lng > r.bbox[2] || lat < r.bbox[1] || lat > r.bbox[3])
      continue
    try {
      if (turf.booleanPointInPolygon(pt, r.poly)) return true
    } catch {
      // lewati
    }
  }
  return false
}

function segKey(a: number, b: number): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

export async function buildRoadGraph(): Promise<void> {
  const { regions, bbox } = await loadAdmin()
  console.log(`  → union bbox: ${bbox}`)

  const ql = `[out:json][timeout:240];(way["highway"~"^(${HIGHWAY_CLASSES})$"](${bbox}););out body;>;out skel qt;`
  console.log('  → query Overpass (jaringan jalan, cached)…')
  const res = (await overpassQuery(ql)) as unknown as {
    elements: (RawNode | RawWay)[]
  }
  console.log(`  → ${res.elements.length} elemen mentah`)

  const rawCoord = new Map<number, [number, number]>() // osmId → [lng,lat]
  const ways: RawWay[] = []
  for (const el of res.elements) {
    if (el.type === 'node') rawCoord.set(el.id, [el.lon, el.lat])
    else if (el.type === 'way' && el.nodes?.length >= 2) ways.push(el)
  }
  console.log(`  → ${rawCoord.size} node, ${ways.length} way`)

  // Node in-union
  const keep = new Set<number>()
  for (const [id, [lng, lat]] of rawCoord) {
    if (inUnion(lng, lat, regions)) keep.add(id)
  }
  console.log(`  → ${keep.size} node di dalam union`)

  // Adjacency: osmId → [{to, highway}] (hanya edge yang kedua endpoint in-union)
  const adj = new Map<number, { to: number; highway: string }[]>()
  const addAdj = (u: number, v: number, hw: string) => {
    const arr = adj.get(u) ?? []
    arr.push({ to: v, highway: hw })
    adj.set(u, arr)
  }
  for (const w of ways) {
    const hw = w.tags?.highway ?? 'unclassified'
    for (let i = 0; i + 1 < w.nodes.length; i++) {
      const u = w.nodes[i]
      const v = w.nodes[i + 1]
      if (u === v || !keep.has(u) || !keep.has(v)) continue
      addAdj(u, v, hw)
      addAdj(v, u, hw)
    }
  }

  // Junction = degree≠2, atau degree==2 dgn highway berbeda
  const isJunction = (id: number): boolean => {
    const a = adj.get(id)
    if (!a || a.length !== 2) return true
    return a[0].highway !== a[1].highway
  }

  // Kompresi chain degree-2 → edge junction-to-junction dgn geom
  interface CompEdge {
    a: number
    b: number
    highway: string
    geom: [number, number][]
    lengthM: number
  }
  const compEdges: CompEdge[] = []
  const visited = new Set<string>()

  const dist = (p: [number, number], q: [number, number]): number =>
    turf.distance(turf.point(p), turf.point(q), { units: 'meters' })

  for (const j of keep) {
    if (!isJunction(j)) continue
    const incident = adj.get(j) ?? []
    for (const start of incident) {
      if (visited.has(segKey(j, start.to))) continue
      const hw = start.highway
      const geom: [number, number][] = [rawCoord.get(j)!]
      let prev = j
      let cur = start.to
      let lengthM = 0
      let guard = 0
      while (true) {
        geom.push(rawCoord.get(cur)!)
        lengthM += dist(rawCoord.get(prev)!, rawCoord.get(cur)!)
        visited.add(segKey(prev, cur))
        if (isJunction(cur) || ++guard > 10_000) break
        // pass-through: lanjut ke tetangga selain prev
        const neigh = adj.get(cur) ?? []
        const next = neigh.find((n) => n.to !== prev)
        if (!next) break
        prev = cur
        cur = next.to
        if (visited.has(segKey(prev, cur))) break
      }
      if (geom.length >= 2 && cur !== j) {
        compEdges.push({ a: j, b: cur, highway: hw, geom, lengthM })
      } else if (geom.length >= 2 && cur === j) {
        // loop kembali ke junction asal — tetap simpan
        compEdges.push({ a: j, b: cur, highway: hw, geom, lengthM })
      }
    }
  }
  console.log(`  → ${compEdges.length} edge terkompresi`)

  // Compact id untuk junction yang terpakai
  const idMap = new Map<number, number>()
  const nodes: RoadNode[] = []
  const compactId = (osmId: number): number => {
    let c = idMap.get(osmId)
    if (c === undefined) {
      c = nodes.length
      idMap.set(osmId, c)
      const [lng, lat] = rawCoord.get(osmId)!
      nodes.push({ id: c, lat: r5(lat), lng: r5(lng) })
    }
    return c
  }

  const cidx = await loadConstraintIndex()
  console.log(`  → ${cidx.features.length} constraint untuk overlay`)

  const simplifyGeom = (geom: [number, number][]): [number, number][] => {
    let g = geom
    if (geom.length > 3) {
      try {
        const s = turf.simplify(turf.lineString(geom), {
          tolerance: SIMPLIFY_TOLERANCE,
          highQuality: false,
        })
        g = s.geometry.coordinates as [number, number][]
      } catch {
        g = geom
      }
    }
    return g.map(([x, y]) => [r5(x), r5(y)] as [number, number])
  }

  let edges: RoadEdge[] = []
  let eid = 0
  for (const ce of compEdges) {
    const a = compactId(ce.a)
    const b = compactId(ce.b)
    if (a === b && ce.geom.length < 3) continue
    const seg = classifyPolyline(ce.geom, cidx)
    const method = resolveMethod(ce.highway, seg)
    const baseCostIdr = ce.lengthM * RATE[method]
    const totalCostIdr =
      seg.cls === 'hard'
        ? HARD_BLOCK_COST_SENTINEL
        : Math.round(baseCostIdr * seg.multiplier)
    edges.push({
      id: eid++,
      a,
      b,
      lengthM: Math.round(ce.lengthM * 10) / 10,
      highway: ce.highway,
      method,
      constraintClass: seg.cls,
      costMultiplier: seg.multiplier,
      baseCostIdr: Math.round(baseCostIdr),
      totalCostIdr,
      geom: simplifyGeom(ce.geom),
    })
  }
  console.log(`  → ${nodes.length} node, ${edges.length} edge (sebelum filter komponen)`)

  // ── Ambil komponen terhubung TERBESAR (jamin routability) ──
  // Konektivitas dihitung TANPA edge hard (yang di-skip pathfinder),
  // supaya komponen mencerminkan jaringan yang benar-benar routable.
  const compAdj = new Map<number, number[]>()
  for (const e of edges) {
    if (e.constraintClass === 'hard') continue
    ;(compAdj.get(e.a) ?? compAdj.set(e.a, []).get(e.a)!).push(e.b)
    ;(compAdj.get(e.b) ?? compAdj.set(e.b, []).get(e.b)!).push(e.a)
  }
  const seenC = new Set<number>()
  let bestComp = new Set<number>()
  for (const n of nodes) {
    if (seenC.has(n.id) || !compAdj.has(n.id)) continue
    const comp = new Set<number>()
    const stack = [n.id]
    seenC.add(n.id)
    while (stack.length) {
      const cur = stack.pop()!
      comp.add(cur)
      for (const nb of compAdj.get(cur) ?? []) {
        if (!seenC.has(nb)) {
          seenC.add(nb)
          stack.push(nb)
        }
      }
    }
    if (comp.size > bestComp.size) bestComp = comp
  }
  console.log(`  → komponen terbesar: ${bestComp.size} node`)

  // Filter node & edge ke komponen terbesar; re-compact id
  const remap = new Map<number, number>()
  const finalNodes: RoadNode[] = []
  for (const n of nodes) {
    if (!bestComp.has(n.id)) continue
    const nid = finalNodes.length
    remap.set(n.id, nid)
    finalNodes.push({ id: nid, lat: n.lat, lng: n.lng })
  }
  let fid = 0
  edges = edges
    .filter((e) => bestComp.has(e.a) && bestComp.has(e.b))
    .map((e) => ({
      ...e,
      id: fid++,
      a: remap.get(e.a)!,
      b: remap.get(e.b)!,
    }))

  const hardEdges = edges.filter((e) => e.constraintClass === 'hard').length
  const softEdges = edges.filter((e) => e.constraintClass === 'soft').length

  const [minX, minY, maxX, maxY] = turf.bbox(
    turf.featureCollection(regions.map((rg) => rg.poly)),
  )
  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      bbox: [minX, minY, maxX, maxY] as [number, number, number, number],
      crs: 'EPSG:4326',
    },
    nodes: finalNodes,
    edges,
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(out))
  const sizeMb = ((await fs.stat(OUTPUT_FILE)).size / 1024 / 1024).toFixed(1)
  console.log(
    `  ✓ road-graph.json: ${finalNodes.length} node, ${edges.length} edge ` +
      `(${hardEdges} hard, ${softEdges} soft) — ${sizeMb} MB`,
  )
}
