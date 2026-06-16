import { buildRoadGraph } from './lib/build-road-graph'

async function main() {
  console.log('[road-graph] Membangun road-graph.json (OSM + cost + constraint)…')
  await buildRoadGraph()
  console.log('[road-graph] Selesai.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
