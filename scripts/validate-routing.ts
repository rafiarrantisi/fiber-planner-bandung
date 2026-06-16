import { promises as fs } from 'node:fs'
import path from 'node:path'
import createGraph from 'ngraph.graph'
import { aStar } from 'ngraph.path'
import type { RoadGraphData } from '../src/types/domain'

const R = 6371000
function hav(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

async function main() {
  const rg = JSON.parse(
    await fs.readFile(path.resolve('public/data/road-graph.json'), 'utf8'),
  ) as RoadGraphData
  console.log(`nodes=${rg.nodes.length} edges=${rg.edges.length}`)

  const g = createGraph<{ lat: number; lng: number }, { cost: number; lengthM: number }>()
  for (const n of rg.nodes) g.addNode(n.id, { lat: n.lat, lng: n.lng })
  let skipped = 0
  for (const e of rg.edges) {
    if (e.constraintClass === 'hard' || e.totalCostIdr >= 1e15) {
      skipped++
      continue
    }
    g.addLink(e.a, e.b, { cost: e.totalCostIdr, lengthM: e.lengthM })
  }
  console.log(`linked edges=${rg.edges.length - skipped}, skipped(hard)=${skipped}`)

  // Connectivity: BFS components via adjacency
  const adj = new Map<number, number[]>()
  g.forEachLink((l) => {
    const a = l.fromId as number
    const b = l.toId as number
    ;(adj.get(a) ?? adj.set(a, []).get(a)!).push(b)
    ;(adj.get(b) ?? adj.set(b, []).get(b)!).push(a)
  })
  const seen = new Set<number>()
  const comps: number[] = []
  for (const n of rg.nodes) {
    if (seen.has(n.id) || !adj.has(n.id)) continue
    let size = 0
    const stack = [n.id]
    seen.add(n.id)
    while (stack.length) {
      const cur = stack.pop()!
      size++
      for (const nb of adj.get(cur) ?? []) {
        if (!seen.has(nb)) {
          seen.add(nb)
          stack.push(nb)
        }
      }
    }
    comps.push(size)
  }
  comps.sort((a, b) => b - a)
  const isolated = rg.nodes.filter((n) => !adj.has(n.id)).length
  console.log(`components=${comps.length} largest=${comps.slice(0, 5)} isolated(noLink)=${isolated}`)

  // Raw A* between two nodes in the largest component
  const finder = aStar(g, {
    distance: (_f, _t, link) => link.data.cost,
    heuristic: (from, to) =>
      hav(from.data.lat, from.data.lng, to.data.lat, to.data.lng) * 28000,
    oriented: false,
  })

  // pick node nearest Braga and nearest Gedung Sate
  const nearest = (lat: number, lng: number) => {
    let best = rg.nodes[0]
    let bd = Infinity
    for (const n of rg.nodes) {
      if (!adj.has(n.id)) continue
      const d = hav(lat, lng, n.lat, n.lng)
      if (d < bd) {
        bd = d
        best = n
      }
    }
    return { node: best, dist: bd }
  }
  const a = nearest(-6.9175, 107.609)
  const b = nearest(-6.9025, 107.6187)
  console.log(`src node ${a.node.id} (snap ${a.dist.toFixed(0)}m), dst node ${b.node.id} (snap ${b.dist.toFixed(0)}m)`)
  const found = finder.find(a.node.id, b.node.id)
  console.log(`A* path nodes=${found.length}`)
  if (found.length > 0) {
    let len = 0
    for (let i = 0; i + 1 < found.length; i++) {
      len += hav(
        found[i].data.lat,
        found[i].data.lng,
        found[i + 1].data.lat,
        found[i + 1].data.lng,
      )
    }
    console.log(`  straight=${hav(a.node.lat, a.node.lng, b.node.lat, b.node.lng).toFixed(0)}m routedNodesLen=${len.toFixed(0)}m`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
