import { buildConstraints } from './lib/build-constraints'

async function main() {
  console.log('[constraints] Membangun constraints.geojson (OSM + curated)…')
  await buildConstraints()
  console.log('[constraints] Selesai.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
