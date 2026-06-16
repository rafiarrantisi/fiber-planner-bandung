# Perencana Fiber Bandung Raya

Dashboard interaktif perencanaan infrastruktur fixed broadband berbasis demand untuk **Kota Bandung, Kota Cimahi, dan Kabupaten Bandung Barat** — kini sebuah **constraint-aware & cost-aware rollout planner**, bukan sekadar dashboard geospasial.

Dibuat oleh **Muhammad Rafi Ar-Rantisi** · Institut Teknologi Bandung.

🔗 [fiber-planner-bandung.vercel.app](https://fiber-planner-bandung.vercel.app/)

---

## Enam Pilar Analitis

Model bergeser dari **optimasi geometris** → **perencanaan yang buildable & bankable**. Narasinya: *di mana boleh bangun → berapa mahal tiap rute → taruh ODP yang valid → sambungkan jadi jaringan → ada demand & tidak overbuild → bangun urutannya bagaimana.*

| # | Pilar | Inti |
|---|-------|------|
| 1 | **Constraint layer (RoW)** | Poligon restricted (KKOP, cagar budaya, militer, RoW rel/tol/HSR, sungai) — hard-block vs soft-penalty — yang **mempengaruhi routing**. |
| 2 | **Cost-aware routing** | A* cost-weighted di atas road graph ter-tag biaya per metode (aerial/underground/boring). Rute *cheapest-to-build*, bukan terpendek. |
| 3 | **Capacity-aware ODP + snap-to-road** | Recursive K-means dipecah by kapasitas port (8/16) atau radius; centroid di-snap ke node jalan valid + validasi drop. |
| 4 | **Feeder/backbone topology** | Minimum spanning forest cost-weighted ODP→POP di atas road graph; total feeder km + homing per POP. |
| 5 | **Demand + whitespace** | Homes-passed dari grid populasi H3; skor whitespace memisahkan area underserved dari overbuild incumbent. |
| 6 | **Capex / ROI / fasing** | Payback, NPV, ROI per cluster + **slider budget capex** → Fase 1/2/3 greedy by ROI, real-time. |

Tiga pilar pertama warisan studi awal (buffer 200 m APJATEL, klasifikasi FO-Ready, recursive K-means ≤300 m) tetap dipertahankan dan diperluas.

---

## Arsitektur

```
src/
├── types/domain.ts            # Kontrak data (PoI, Supply, Constraint, RoadGraph, Cluster, Topology, Capex…)
├── store/                     # Zustand: data, filters, analysis, map-ui, constraints
├── data/loaders.ts            # Fetch /data/*.json (degradasi anggun bila file belum ada)
├── analysis/
│   ├── buffer.ts · spatial-join.ts · stats.ts      # warisan
│   ├── constraints.ts         # Flatbush index + classifyPoint/Segment + unionHard
│   ├── kmeans-recursive.ts    # capacity + radius split
│   ├── cluster-postprocess.ts # snap-to-road + validasi drop
│   ├── routing/{cost-model,graph,snap,route}.ts    # A* cost-weighted (ngraph)
│   ├── topology.ts            # MST feeder ODP→POP
│   ├── demand.ts              # homes-passed + whitespace
│   ├── capex.ts               # payback/NPV/ROI + greedy phasing
│   └── pipeline.ts            # orkestrasi end-to-end (dijalankan di Web Worker)
├── workers/analysis.worker.ts # Comlink — pipeline & routing off main-thread
└── components/{map,sidebar,stats,analysis,landing}
```

**Routing dijalankan di browser** atas road graph statis (bukan live API): A* `ngraph.path` cost-weighted, edge hard-block di-skip → rute otomatis memutar. Komputasi berat (graph build, routing 1.800+ feeder, recursive k-means) berjalan di **Web Worker** sehingga UI tidak freeze.

---

## Stack

| Layer | Pilihan |
|---|---|
| Build | Vite + React 19 + TypeScript |
| Map | react-leaflet 5 + Leaflet 1.9 (canvas) · CartoDB Positron |
| Geospatial | @turf/turf · Flatbush (spatial index) · h3-js (grid demand) |
| Routing | ngraph.graph + ngraph.path (A* cost-weighted) |
| Worker | Comlink |
| Clustering | ml-kmeans + recursive wrapper |
| Charts | Recharts · State | Zustand · UI | Tailwind + Framer Motion + lucide-react |

**Pre-generate (build-time):** Overpass (jalan + constraint OSM), Nominatim (batas GADM L2), OSRM (kabel eksisting).

---

## Data Statis (`public/data/`)

| File | Isi | Provenance |
|---|---|---|
| `admin-boundaries.geojson` | 3 poligon kota/kabupaten | Real (GADM/Nominatim) |
| `road-graph.json` | Graph jalan routable ter-tag biaya+constraint (≈24k node) | Real (OSM) |
| `constraints.geojson` | Zona kendala 3 wilayah | Real (OSM) + aproksimasi (KKOP, heritage) |
| `supply.json` · `poi.json` | ~525 supply · ~4.300 PoI | **Sintetis** (seeded RNG) |
| `pop-sites.json` | POP dari menara fiberized | Diturunkan dari supply |
| `population-grid.geojson` | Grid H3 rumah tangga | **Termodel** (densitas OSM, kalibrasi total BPS) |
| `incumbent-coverage.geojson` | Skor presensi incumbent | **Proxy termodel** (tak ada data publik) |
| `fiber-cables.geojson` | Kabel eksisting road-routed | OSRM |

> Provenance tiap layer ditampilkan jujur di **About modal**. Data PoI/supply/revenue sintetis sebagai *methodology demo* — pipeline menerima sumber apa pun. Constraint layer dibuat real/aproksimasi: di situlah letak masalah yang tool sekelas Comsof pun belum selesaikan (kepatuhan kendala konstruksi lokal).

---

## Menjalankan Lokal

```bash
npm install
npm run dev            # http://localhost:5173

# (Opsional) regenerate seluruh data — butuh akses Overpass; hasil ter-cache & di-commit
npm run gen:all
```

Generator individual (idempotent, deterministik): `gen:constraints`, `gen:roadgraph`, `gen:popsites`, `gen:demand`. Bagian sintetis pakai `seedrandom`; bagian real di-snapshot ke file statis (tak ada fetch API saat runtime). Re-run → output identik.

---

## Deployment

Vercel preset **Vite**, build `npm run build`, output `dist`. SPA rewrites + cache header immutable di `vercel.json`.

---

## Catatan

Seluruh angka biaya bersifat **ilustratif** (rasio FBA 2024/2025; absolut perlu kalibrasi dengan unit cost FiberCo). PoI/supply/revenue **sintetis**. KKOP & cagar budaya = **aproksimasi**, bukan poligon resmi.
