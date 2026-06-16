import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { City, PopSite, SupplyPoint } from '../src/types/domain'
import { WILAYAH_BY_CITY } from '../src/types/domain'

const SUPPLY_FILE = path.resolve('public/data/supply.json')
const OUTPUT_FILE = path.resolve('public/data/pop-sites.json')

// Kapasitas port OLT/POP tipikal (1 OLT ~ ribuan home via splitter).
const POP_CAPACITY_PORTS = 1152

async function main() {
  console.log('[pop-sites] Menurunkan POP dari menara fiberized…')
  const supply = JSON.parse(
    await fs.readFile(SUPPLY_FILE, 'utf8'),
  ) as SupplyPoint[]

  const pops: PopSite[] = supply
    .filter((s) => s.type === 'MENARA_FIBERIZED')
    .map((s, i) => ({
      id: `pop-${String(i + 1).padStart(3, '0')}`,
      lat: s.lat,
      lng: s.lng,
      name: `POP ${s.name}`,
      capacityPorts: POP_CAPACITY_PORTS,
      wilayah: WILAYAH_BY_CITY[s.city as City],
    }))

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(pops))
  console.log(`  ✓ ${pops.length} POP ditulis ke pop-sites.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
