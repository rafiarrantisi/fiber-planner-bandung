import { buildDemand } from './lib/build-demand'

async function main() {
  console.log('[demand] Membangun population-grid + incumbent-coverage (H3)…')
  await buildDemand()
  console.log('[demand] Selesai.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
