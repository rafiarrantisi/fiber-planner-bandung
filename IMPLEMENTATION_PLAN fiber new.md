# Fiber Planner Bandung Raya — Implementation Plan
## Constraint-Aware & Cost-Aware Fixed-Broadband Rollout Engine (v2)

> **Untuk:** Claude Code (pemegang seluruh repo `fiber-planner-bandung`)
> **Dari:** Muhammad Rafi Ar-Rantisi — Institut Teknologi Bandung
> **Sifat dokumen:** Spesifikasi eksekusi. Bangun **fase per fase** sesuai §12. Jangan loncat fase. Setiap fase harus lolos *acceptance criteria*-nya sebelum lanjut.
> **Reviewer akhir:** seorang VP infrastruktur fiber (FiberCo / JV Indosat–Arsari–Northstar). Output harus terbaca seperti tool *OSP planning* yang sadar kendala konstruksi & ekonomi, bukan sekadar dashboard geospasial.

---

## 0. Konteks & Tujuan

### 0.1 Apa yang sudah ada (jangan dibongkar)
Aplikasi React/TS yang sudah jalan mereproduksi **tiga pilar analitis**:
1. Buffer 200 m di sekitar tiap titik supply (ODP + menara fiberized), rekomendasi APJATEL.
2. Klasifikasi **FO-Ready vs Non-FO** via spatial join (point-in-polygon terhadap union buffer).
3. **Recursive K-Means (≤300 m)** pada PoI Non-FO untuk merekomendasikan ODP baru.
Plus estimasi kapasitas (Mbps) & revenue bulanan (IDR) per PoI.

Data saat ini **sintetis** (seeded RNG via `seedrandom`, `npm run generate-data`), tersimpan di `public/data/`:
- `admin-boundaries.geojson` (GADM L2, 3 wilayah)
- `supply.json` (~525 titik)
- `poi.json` (~4.300 titik)
- `fiber-cables.geojson` (~688 segmen road-routed via OSRM)

Arsitektur `src/` lihat repo (Zustand stores, `analysis/*`, `components/{map,sidebar,stats,analysis,landing}`, `lib/{formatters,constants,i18n-strings}`).

### 0.2 Apa yang kita tambahkan (6 pilar baru)
Mengubah model dari **optimasi geometris** → **perencanaan yang buildable & bankable**. Narasi: *di mana boleh bangun → berapa mahal tiap rute → taruh ODP yang valid → sambungin jadi jaringan → ada demand & nggak overbuild → bangun urutannya gimana.*

| # | Pilar | Masalah riil (tervalidasi) | Deliverable |
|---|-------|----------------------------|-------------|
| 1 | **Constraint layer** (RoW restricted) | Permitting = penghambat #1 deployment (FCC); di ID ada SJUT/Pergub, kabel semrawut sampai ada korban jiwa | Layer poligon restricted (hard-block vs soft-penalty) + routing yang patuh + visual + KPI dampak |
| 2 | **Cost-aware routing** | Underground ≈ 2.3–2.7× aerial; make-ready 15–20% biaya proyek; reuse konduit lebih murah | Cost model per-edge (IDR/m per metode) → rute *cheapest-to-build*, bukan *shortest* |
| 3 | **Capacity-aware + snap-to-road ODP** | K-means buta kapasitas & bisa mendarat di atap/sungai; drop ≠ Euclidean | Split berbasis port (8/16) **atau** radius; snap centroid ke node jalan valid; validasi drop ter-route |
| 4 | **Feeder/backbone topology** | FTTH itu hierarki OLT→feeder→ODP→drop; aset wholesale ada di feeder & POP | MST cost-weighted ODP→POP di atas road graph; total feeder km + topologi |
| 5 | **Demand + overbuild/whitespace** | PoI ≠ demand; overbuild value-destructive (min return FTTH naik ke 12–15%) | Homes-passed dari grid populasi; take-up × ARPU; **whitespace score** |
| 6 | **Capex phasing / ROI** | Investor cuma nanya: bangun yang mana dulu biar balik modal cepat? | Unit economics per cluster (payback/NPV/ROI) + **slider budget capex** → Phase 1/2/3 |

### 0.3 Positioning (kenapa ini valid)
Industri sudah punya automated FTTH planning (Comsof/IQGeo, Biarri/FOND, VETRO, FiberPlanIT). **Tapi** even tool sekelas Comsof diakui "menghasilkan rute yang efisien di atas kertas tapi mengabaikan kendala konstruksi dunia nyata; butuh review engineer." **Gap itu = pilar #1 kita.** Jadi framing build: kita tidak mengalahkan Comsof — kita meng-*attack* satu hal yang belum mereka solve (kepatuhan kendala konstruksi lokal Bandung Raya).

---

## 1. Prinsip Desain & Guardrails (WAJIB dipatuhi sepanjang proyek)

1. **SCOPE LOCK — hanya 3 wilayah.** Kota Bandung, Kota Cimahi, Kabupaten Bandung Barat. **Dilarang** menambah wilayah lain. Semua data (road graph, constraints, demand) di-*clip* ke union 3 poligon `admin-boundaries.geojson`. Setiap titik/edge/poligon di luar union → buang saat generate.
2. **Routing client-side, pre-built graph, BUKAN live API.** OSRM hanya dipakai saat `generate-data` (build-time). Saat runtime (user klik "Run Analysis"), routing dijalankan **di browser** atas graph statis → cepat, tanpa rate-limit, reproducible. (OSRM publik juga tidak bisa *avoid polygon* — alasan teknis tambahan.) Lihat §7.3 + Appendix A untuk keputusan engine & fallback.
3. **Real vs synthetic — eksplisit & jujur.** Constraint layer & demand grid **diupayakan real** (sumber di §4 & §11). PoI/supply/revenue tetap sintetis sebagai *methodology demo*. Tandai provenance tiap layer di UI & README (§14). Jangan pernah menyiratkan angka sintetis sebagai data riil.
4. **Reproducibility dipertahankan.** Bagian sintetis tetap pakai `seedrandom`. Bagian real (OSM/WorldPop) di-*snapshot* ke file statis di `public/data/` saat generate, supaya re-run deterministik dan app tidak bergantung API saat runtime. Commit file hasil generate.
5. **Jangan freeze UI.** Komputasi berat (routing, MST, recursive k-means) jalan di **Web Worker** (§13). Main thread hanya render.
6. **Aditif, bukan rewrite.** Pertahankan struktur folder & store yang ada. Tambah modul/slice/komponen baru; modifikasi minimal & terdokumentasi pada file lama (`kmeans-recursive.ts`, `stats.ts`, loaders, constants, i18n).
7. **Semua parameter di `constants.ts`, semua copy di `i18n-strings.ts` (Bahasa Indonesia).** Tidak ada magic number / string hardcoded di komponen.
8. **TypeScript strict.** Semua kontrak data baru masuk `types/domain.ts`. Tidak boleh `any` kecuali pada boundary parsing yang langsung di-validate.
9. **Degradasi anggun.** Jika sebuah layer real gagal di-generate (mis. Overpass timeout), pipeline harus fallback ke versi sintetis berlabel, **tidak** crash. App harus selalu bisa `npm run dev`.

---

## 2. Tech Stack

### 2.1 Sudah dipakai (pertahankan)
Vite · React 19 · TypeScript · react-leaflet 5 + Leaflet 1.9 · CartoDB Positron · leaflet.markercluster (imperative via `useMap`) · @turf/turf · ml-kmeans (+recursive wrapper) · Recharts · Tailwind (editorial light theme) · Zustand · Framer Motion · lucide-react · seedrandom. Pre-generate: OSRM (routing), Nominatim (admin boundaries).

### 2.2 Tambahan (install)
| Paket | Sisi | Untuk |
|-------|------|-------|
| `ngraph.graph` + `ngraph.path` | runtime | Routing A* cost-weighted di browser atas road graph |
| `flatbush` (atau `rbush`) | runtime | Spatial index untuk lookup constraint cepat (ribuan poligon × ribuan query) |
| `h3-js` | runtime + build | Grid heksagonal untuk demand & whitespace |
| `@turf/boolean-point-in-polygon`, `@turf/line-intersect`, `@turf/nearest-point-on-line`, `@turf/distance`, `@turf/buffer`, `@turf/union`, `@turf/bbox` | runtime | (sebagian sudah lewat `@turf/turf`; pastikan tersedia) |
| `comlink` *(opsional, direkomendasikan)* | runtime | Wrapper ergonomis untuk Web Worker |
| `osmtogeojson` **atau** query Overpass via `fetch` | build | Ambil jaringan jalan & fitur OSM saat generate |
| `topojson-server` + `topojson-client` *(opsional)* | build | Simplifikasi geometri topologi-aware untuk kecilkan ukuran graph |
| `geotiff` *(opsional)* | build | Sampling raster WorldPop → grid (kalau pakai WorldPop; kalau pakai Kontur skip) |

> Catatan: tahan jumlah dependency. `ngraph.*`, `flatbush`, `h3-js` adalah inti. Sisanya opsional sesuai jalur yang dipilih.

---

## 3. Perubahan Data (`public/data/`)

Tambah file berikut (semua **di-clip ke union 3 admin polygon**):

### 3.1 `constraints.geojson` — **(pilar #1, prioritas tertinggi)**
`FeatureCollection<Polygon|MultiPolygon>`. Properti tiap feature:
```jsonc
{
  "id": "kkop-husein",
  "name": "KKOP Husein Sastranegara",
  "category": "airport_kkop",      // lihat enum §5
  "severity": "soft",              // "hard" | "soft"
  "methodForce": "underground",    // null | "underground" | "boring_only"
  "costMultiplier": 1.8,           // dipakai jika severity="soft"
  "wilayah": ["kota_bandung"],     // subset 3 wilayah
  "source": "approx_published_kkop_params",  // provenance, lihat §14
  "realData": true                 // true=real/derived, false=synthetic placeholder
}
```
Sumber & cara generate: §11.

### 3.2 `road-graph.json` — **(pilar #2,#3,#4)**
Graph jalan routable hasil OSM, **di-clip & di-tag**. Format kompak:
```jsonc
{
  "meta": { "generatedAt": "...", "bbox": [...], "crs": "EPSG:4326" },
  "nodes": [ { "id": 0, "lat": -6.91, "lng": 107.61 }, ... ],
  "edges": [
    {
      "id": 0,
      "a": 0, "b": 1,              // index node
      "lengthM": 84.2,
      "highway": "secondary",      // tag OSM mentah
      "method": "aerial",          // "aerial" | "underground" | "boring" (hasil §7.4)
      "constraintClass": "none",   // "none" | "soft" | "hard"
      "costMultiplier": 1.0,
      "baseCostIdr": 219000,       // lengthM × rate(method)
      "totalCostIdr": 219000       // baseCost × costMultiplier (hard → Infinity/sentinel)
    }, ...
  ]
}
```
- **Ukuran:** target < ~8–12 MB sebelum gzip. Kalau lebih: (a) batasi `highway` ke `motorway|trunk|primary|secondary|tertiary|unclassified|residential|service` (buang `footway|path|steps|cycleway` kecuali relevan), (b) simplifikasi geometri (topojson), (c) merge degree-2 nodes (kompresi rantai). Lihat §13.
- Edge dengan `constraintClass="hard"` tetap disimpan tapi `totalCostIdr` di-set sentinel besar (mis. `1e15`) supaya A* tidak pernah memilihnya (jangan `Infinity` agar JSON valid; konversi ke `Infinity` saat load).

### 3.3 `pop-sites.json` — **(pilar #4)**
Titik agregasi / Point-of-Presence tempat feeder "pulang". **Turunan dari supply yang bertipe menara fiberized** (subset `supply.json`), atau set kecil OLT/CO sintetis bila perlu cakupan merata.
```jsonc
[ { "id": "pop-001", "lat": -6.9, "lng": 107.6, "name": "POP Cicendo", "capacityPorts": 1152, "wilayah": "kota_bandung" } ]
```
> Implementasi termudah: tambahkan field `role: "odp" | "fiberized_tower"` ke `supply.json` (lihat §4) lalu derive `pop-sites.json` dari yang `fiberized_tower`. POP = homing target di MST.

### 3.4 `population-grid.geojson` — **(pilar #5)**
Grid heksagonal (H3 res 8 atau 9) berisi estimasi rumah tangga, **di-clip ke 3 wilayah**.
```jsonc
{ "type":"FeatureCollection","features":[
  { "type":"Feature","geometry": {/* hex polygon */},
    "properties": { "h3": "8b6e...", "householdEst": 412, "popEst": 1560,
                    "wilayah": "kab_bandung_barat", "source": "kontur_2023", "realData": true } } ]}
```
Sumber: **Kontur Population (sudah H3, paling mudah)** atau WorldPop Indonesia 100m disampel ke H3. Fallback sintetis: densitas digradasi dari kepadatan PoI + total populasi admin (berlabel `realData:false`). Lihat §10.4.

### 3.5 `incumbent-coverage.geojson` — **(pilar #5, overbuild)**
**Proxy termodel** (bukan footprint kompetitor riil — tidak ada data publik). Skor presensi incumbent per hex/kelurahan.
```jsonc
"properties": { "h3":"...", "incumbentScore": 0.0–1.0, "method":"modeled_from_supply_density",
                "realData": false }
```
Cara model: `incumbentScore = normalize( fiber_density_existing + 0.5 × pop_density )`. Area sudah padat fiber/penduduk → diasumsikan sudah dilayani incumbent. **Wajib** berlabel `realData:false` & dijelaskan di disclaimer.

### 3.6 (Opsional) Re-tag `fiber-cables.geojson`
Tambah `method`, `baseCostIdr`, `constraintClass` ke segmen kabel eksisting agar visual konsisten dengan cost model. Tidak wajib untuk analisis baru, tapi enak buat demo.

---

## 4. Perubahan Tipe — `src/types/domain.ts`

Tambah (jangan ubah kontrak lama; extend lewat intersection bila perlu):
```ts
// ── Geo & constraint ─────────────────────────────────────────────
export type Wilayah = 'kota_bandung' | 'kota_cimahi' | 'kab_bandung_barat';

export type ConstraintCategory =
  | 'airport_kkop' | 'heritage_zone' | 'military' | 'rail_row'
  | 'toll_row' | 'hsr_row' | 'conservation_forest' | 'water_body'
  | 'river_setback' | 'national_road' | 'steep_slope';

export type ConstraintSeverity = 'hard' | 'soft';
export type MethodForce = 'underground' | 'boring_only' | null;

export interface ConstraintProps {
  id: string; name: string; category: ConstraintCategory;
  severity: ConstraintSeverity; methodForce: MethodForce;
  costMultiplier: number; wilayah: Wilayah[]; source: string; realData: boolean;
}
export type ConstraintFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, ConstraintProps>;

// ── Deployment & routing ─────────────────────────────────────────
export type DeploymentMethod = 'aerial' | 'underground' | 'boring';
export type ConstraintClass = 'none' | 'soft' | 'hard';

export interface RoadNode { id: number; lat: number; lng: number; }
export interface RoadEdge {
  id: number; a: number; b: number; lengthM: number; highway: string;
  method: DeploymentMethod; constraintClass: ConstraintClass;
  costMultiplier: number; baseCostIdr: number; totalCostIdr: number; // Infinity utk hard
}

export interface MethodBreakdown { aerialM: number; undergroundM: number; boringM: number; }
export interface RoutedPath {
  coords: [number, number][];     // [lng,lat] sepanjang jalan
  lengthM: number; costIdr: number;
  methodBreakdown: MethodBreakdown;
  crossesHardBlock: boolean;      // true jika tak ada rute valid → flag
  reroutedAroundConstraint: boolean; // true jika rute terpaksa memutar
  detourRatio: number;            // panjang ter-route / panjang garis lurus
}

// ── Cluster (extend yang lama) ───────────────────────────────────
export interface ClusterExt {
  portCapacity: number;           // 8 | 16
  assignedPoiCount: number;
  capacityUtil: number;           // assigned / capacity
  snappedToRoad: boolean;
  snapNodeId: number | null;
  inHardBlock: boolean;           // centroid tervalidasi tidak di hard-block
  undeliverableDrops: number;     // PoI yang drop ter-route > MAX_DROP
  feeder: RoutedPath | null;      // rute ke POP terdekat (sebelum MST global)
  homingPopId: string | null;
  // ekonomi (pilar 6)
  homesPassed: number; demandMbps: number; monthlyRevenueIdr: number;
  capexIdr: number; paybackMonths: number | null; npvIdr: number;
  roiScore: number; phase: 1 | 2 | 3 | null;
}

// ── Topologi jaringan (pilar 4) ──────────────────────────────────
export interface FeederLink { fromId: string; toId: string; path: RoutedPath; }
export interface NetworkTopology {
  links: FeederLink[]; totalFeederM: number; totalFeederCostIdr: number;
  homingByPop: Record<string, string[]>; // popId → [clusterId...]
}

// ── Demand (pilar 5) ─────────────────────────────────────────────
export interface DemandCell {
  h3: string; householdEst: number; takeUpRate: number; demandMbps: number;
  incumbentScore: number; whitespaceScore: number; wilayah: Wilayah;
}

// ── Capex & phasing (pilar 6) ────────────────────────────────────
export interface CapexSummary {
  totalCapexIdr: number; totalMonthlyRevenueIdr: number;
  blendedPaybackMonths: number | null; totalHomesPassed: number;
  byPhase: Record<1 | 2 | 3, { clusters: number; capexIdr: number; revenueIdr: number }>;
}

// ── Extend AnalysisResult yang lama ──────────────────────────────
export interface AnalysisResultExt {
  topology: NetworkTopology;
  capex: CapexSummary;
  constraintImpact: {
    routesRerouted: number; routesBlocked: number;
    extraCostFromConstraintsIdr: number; // selisih vs tanpa constraint
    poiInRestricted: number;
  };
}
```
> `Cluster` final = `Cluster & ClusterExt`, `AnalysisResult` final = `AnalysisResult & AnalysisResultExt`. Sesuaikan di store.

---

## 5. Perubahan Store (Zustand, `src/store/`)

**Slice baru `useConstraintStore`:**
- state: `features: ConstraintFeature[]`, `index: Flatbush | null`, `unionHard: Feature | null`, `visibleCategories: Set<ConstraintCategory>`, `severityFilter: 'all'|'hard'|'soft'`, `loaded: boolean`.
- actions: `loadConstraints()`, `toggleCategory(cat)`, `setSeverityFilter(f)`.

**Extend `useAnalysisStore`:**
- state tambah: `routing: { graphReady: boolean }`, `topology: NetworkTopology | null`, `capex: CapexSummary | null`, `constraintImpact`, `budgetIdr: number` (slider), `activePhaseFilter: 1|2|3|'all'`, `costAssumptions: CostAssumptions` (editable, default dari constants), `running: boolean`, `progress: { step: string; pct: number }`.
- actions: `runAnalysis()` (orkestrasi pipeline via worker, lihat §7.1), `setBudget(idr)`, `setActivePhase(p)`, `updateCostAssumption(key,val)`.

**Extend `useMapUiStore`:**
- toggles layer baru: `showConstraints`, `showFeeder`, `showDemandHeat`, `showPhaseColors`, `showRoadGraphDebug`, `showRerouteFlags`.

**Extend `useDataStore`:**
- tambah: `roadGraph`, `popSites`, `demandGrid`, `incumbentGrid` + `loadAll()` memuat semua file baru.

---

## 6. Modul Analisis — `src/analysis/`

Struktur target:
```
src/analysis/
├── buffer.ts                 # (ada) Turf buffer 200m + union
├── spatial-join.ts           # (ada) FO-Ready
├── kmeans-recursive.ts       # (MODIF) + kapasitas + snap + validasi drop
├── stats.ts                  # (MODIF) + KPI baru
├── constraints.ts            # (BARU) index + classify
├── routing/
│   ├── graph.ts              # (BARU) build ngraph + attach cost
│   ├── cost-model.ts         # (BARU) method→IDR/m, multiplier, crossing→boring
│   ├── snap.ts               # (BARU) snap centroid ke node valid
│   └── route.ts              # (BARU) A* cost-weighted antar 2 titik
├── topology.ts               # (BARU) MST feeder ODP→POP
├── demand.ts                 # (BARU) homes passed, take-up, whitespace
├── capex.ts                  # (BARU) payback/NPV/ROI + greedy phasing
└── pipeline.ts               # (BARU) orkestrasi end-to-end (dipanggil worker)
```

### 6.1 `constraints.ts`
```ts
buildIndex(features): Flatbush            // index bbox tiap poligon
classifyPoint(pt, idx, features): { class: ConstraintClass; multiplier; methodForce }
  // query flatbush → candidate polys → boolean-point-in-polygon → ambil severity terketat
classifySegment(line, idx, features): { class; multiplier; methodForce; crossesHard }
  // sample titik tengah + endpoint + turf.lineIntersect untuk hard-block crossing
unionHardBlocks(features): Feature        // union semua severity="hard" (untuk reject snap & viz)
```
Aturan agregasi bila satu titik kena banyak constraint: `hard` menang atas `soft`; antar `soft` ambil `costMultiplier` tertinggi & `methodForce` terketat (`boring_only` > `underground` > null).

### 6.2 `routing/cost-model.ts`
```ts
interface CostAssumptions {
  aerialIdrPerM: number; undergroundIdrPerM: number; boringIdrPerM: number;
  conduitReuseDiscount: number;   // 0..1 (mis. 0.19)
  makeReadyShare: number;         // 0..1 (mis. 0.175) ditambahkan ke segmen aerial bertiang sewa
}
methodForEdge(edge, constraintClass, methodForce, crossesCrossing): DeploymentMethod
  // prioritas: hard→tetap dihitung tapi totalCost=Inf; methodForce underground→underground;
  // crossing rail/sungai/jalan-nasional→boring; highway∈{motorway,trunk,primary}→boring/underground;
  // default jalan dengan tiang→aerial
edgeCostIdr(edge, method, multiplier, assumptions): number
```
Default rate (ILUSTRATIF — kalibrasi dengan unit cost FiberCo; rasio yang divalidasi, absolutnya tunable di `constants.ts`):
- aerial : `X`
- underground : `≈ 2.5 × X` (rentang riil 2.3–2.7×)
- boring : `≈ 3.5–4 × X`
- reuse konduit: −19% pada underground; make-ready: +17.5% pada aerial bertiang sewa.

### 6.3 `routing/graph.ts`
```ts
buildGraph(roadGraph: {nodes,edges}): ngraph.Graph  // node=id, link=edge dgn data {totalCostIdr, method, lengthM}
// konversi sentinel 1e15 → Infinity saat attach; edge Infinity di-skip pathfinder
```

### 6.4 `routing/snap.ts`
```ts
snapToValidNode(centroid, graph, nodesIndex, unionHard): { nodeId; lat; lng } | null
  // cari N node terdekat (flatbush KNN), buang yang di unionHard, ambil terdekat tersisa;
  // null jika semua kandidat di hard-block (cluster harus dipecah/dibuang → flag)
```

### 6.5 `routing/route.ts`
```ts
routeCostWeighted(srcNodeId, dstNodeId, graph): RoutedPath
  // ngraph.path A* (heuristik haversine×rate_min); jumlah cost edge → costIdr;
  // akumulasi methodBreakdown; detourRatio = lengthRouted / haversine(src,dst);
  // reroutedAroundConstraint = detourRatio > REROUTE_FLAG_RATIO (mis. 1.25)
  // crossesHardBlock=true & path kosong → tandai (tak ada rute valid)
```

### 6.6 `kmeans-recursive.ts` (MODIFIKASI)
Pertahankan algoritma inti. Tambah:
```
splitCondition(cluster):
   radius(cluster) > KMEANS_MAX_DIST_M   OR   cluster.size > ODP_PORT_CAPACITY
postProcess(cluster):
   snap = snapToValidNode(centroid)         // §6.4
   if snap == null: re-split / mark inHardBlock
   reassign tiap PoI→cluster pakai jarak ter-route (route.ts) bukan Euclidean
   undeliverableDrops = count(PoI dgn routedDrop > MAX_DROP_ROUTED_M)
   if undeliverableDrops tinggi → pecah lagi atau flag butuh ODP tambahan
```
> Catatan perf: reassign ter-route mahal. Optimasi: hanya route untuk PoI yang Euclidean-nya mendekati ambang; sisanya percaya Euclidean. Atau batasi jumlah PoI per cluster sebelum route. Jalankan di worker.

### 6.7 `topology.ts`
```ts
buildFeederTree(clusters, popSites, graph):
  nodes = [...clusterCentroidsSnapped, ...popSites]
  // matriks jarak-biaya antar node via route.ts (cache; simetris)
  // Prim MST DENGAN constraint: tiap cluster wajib terhubung ke komponen yang memuat ≥1 POP
  //   → mulai dari POP, tumbuhkan MST; tiap ODP "home" ke POP di komponennya
  return NetworkTopology { links, totalFeederM, totalFeederCostIdr, homingByPop }
```
> Untuk skala demo (≤ beberapa ratus node) Prim O(n²) cukup. Cache hasil route antar pasangan.

### 6.8 `demand.ts`
```ts
homesPassedForCluster(cluster, demandGrid, bufferM): number
  // jumlah householdEst pada hex yang berpotongan dengan buffer cakupan ODP
demandMbps(homesPassed, takeUpRate, mbpsPerHome): number
revenueIdr(homesPassed, takeUpRate, arpuBySubtype | arpuBlended): number
whitespaceScore(cell): number   // ↑demand & ↓incumbentScore → ↑skor (0..1)
```

### 6.9 `capex.ts`
```ts
clusterCapex(cluster, topology, assumptions):
  odpHardware + drops(assignedPoiCount × dropAvgCost) + allocatedFeederCost(share dari link MST)
paybackMonths = capex / monthlyRevenue            // null jika revenue 0
npv(monthlyRevenue, capex, DISCOUNT_RATE_MONTHLY, HORIZON_MONTHS)
roiScore = revenuePerRupiahCapex  // monthlyRevenue / capex (untuk ranking greedy)
phasing(clusters, budgetIdr):
  urut desc by roiScore → greedy isi Phase 1 sampai budget habis →
  Phase 2 budget berikut, Phase 3 sisanya (atau 3 tier proporsional)
```

### 6.10 `pipeline.ts` (orkestrasi, dipanggil worker)
Urutan langkah (emit progress tiap langkah ke store):
1. `buffer` + `spatial-join` → FO-Ready (existing).
2. `constraints.buildIndex` + `unionHardBlocks`.
3. `kmeans-recursive` (capacity+snap+drop) pada PoI Non-FO.
4. `routing.buildGraph`; untuk tiap cluster `route` feeder kandidat ke POP terdekat.
5. `topology.buildFeederTree`.
6. `demand` → homes passed, revenue, whitespace.
7. `capex` → payback/NPV/ROI; `phasing` dengan `budgetIdr` awal.
8. agregasi `constraintImpact` (bandingkan total cost rute dengan vs tanpa multiplier).
9. `stats` → semua KPI.
Output: `AnalysisResult & AnalysisResultExt`.

---

## 7. Komponen UI — `src/components/`

### 7.1 `map/`
- **`ConstraintLayer.tsx`** — render poligon `constraints.geojson`. Warna by `category`, opacity by `severity` (hard lebih pekat/hatched, soft transparan). Popup: nama, kategori, severity, methodForce, multiplier, source + badge provenance. Toggle via `showConstraints`, filter via store.
- **`FeederLayer.tsx`** — polyline MST (`topology.links[].path.coords`). Warna by `method` di sepanjang segmen (aerial/underground/boring). Toggle `showFeeder`.
- **`DemandHeatLayer.tsx`** — choropleth hex (H3) by `householdEst` atau `whitespaceScore` (switch). Toggle `showDemandHeat`.
- **`PhaseLayer.tsx` / extend marker ODP** — warnai ODP rekomendasi by `phase` (1/2/3) saat `showPhaseColors`. Marker ODP yang `inHardBlock`/`undeliverable` diberi ikon peringatan.
- **`RerouteFlagLayer.tsx`** — highlight feeder dengan `reroutedAroundConstraint=true` (garis putus-putus + ikon "memutar") & rute `crossesHardBlock` (merah, "tak ada rute valid"). Toggle `showRerouteFlags`.
- **Legend** — perbarui untuk semua layer & skema warna baru.
- (Opsional debug) **`RoadGraphLayer.tsx`** — render edge graph diwarnai by `method`/`constraintClass`. Default off; untuk demo teknis ke VP.

### 7.2 `sidebar/`
- **Panel Constraints** — daftar kategori dengan checkbox + filter severity (all/hard/soft) + ringkas "X poligon hard, Y soft".
- **Panel Layers** — toggle feeder, demand heat, phase colors, reroute flags, road-graph debug.
- **Panel Asumsi Biaya** *(editable)* — input untuk `CostAssumptions` & ARPU/take-up (slider/number). Tombol "Reset ke default". Perubahan memicu re-run cepat (atau tombol "Hitung ulang").
- **Slider Budget Capex** — range IDR; label hasil: jumlah cluster Phase 1, total homes passed terlayani, blended payback. Drag → recompute phasing (murah, tidak perlu full re-route).
- **Phase selector** — all / 1 / 2 / 3 (memfilter peta & tabel).

### 7.3 `stats/`
- **KPI cards baru:** Total Capex (IDR), Total Feeder (km), Homes Passed, Blended Payback (bln), # ODP rekomendasi, # rute memutar, # PoI di area restricted, Extra cost akibat constraint.
- **Chart Capex-by-Phase** (Recharts bar/stacked): capex & revenue per Phase 1/2/3.
- **Tabel cluster ranked-by-ROI:** kolom id, wilayah, #PoI, kapasitas util, homes passed, revenue/bln, capex, payback, ROI score, phase, status (ok/reroute/undeliverable). Sortable.
- **Constraint-impact summary card:** "Z rute terpaksa memutar; total +IDR akibat permit/constraint; W cluster gagal di-snap (di hard-block)."

### 7.4 `analysis/`
- Perluas **Run dialog** dari 4-step → multi-step sesuai `pipeline.ts` (§6.10): Buffer → Klasifikasi FO → Cluster+Snap → Routing+Cost → Topologi → Demand → Capex/Phasing. Progress bar + label langkah dari `progress` store. Jalankan via worker; dialog tidak blocking.

### 7.5 `landing/`
- Perbarui **methodology copy** → cerminkan 6 pilar & framing "constraint-aware, cost-aware rollout planner".
- Tambah **bagian Provenance/Disclaimer** (§14): tabel layer → real/synthetic + sumber.
- About modal: kredit data (GADM, OSM © OpenStreetMap contributors, Kontur/WorldPop), catatan KKOP/heritage = aproksimasi.

---

## 8. Konstanta & Parameter — `src/lib/constants.ts`

Tambah (semua tunable, beri komentar sumber):
```ts
export const ODP_PORT_CAPACITY = 16;          // 8 | 16 (standar ODP urban)
export const ODP_PORT_OPTIONS = [8, 16] as const;
export const MAX_DROP_ROUTED_M = 250;         // drop ter-route realistis (proyek lama pakai 300 utk radius)
export const KMEANS_MAX_DIST_M = 300;          // (ada) radius cluster maks
export const REROUTE_FLAG_RATIO = 1.25;        // detour ratio ambang flag "memutar"

// Cost model (ILUSTRATIF — kalibrasi dgn FiberCo; rasio tervalidasi FBA 2024/2025)
export const COST_AERIAL_IDR_PER_M = /* X */ ;
export const COST_UNDERGROUND_MULT = 2.5;      // × aerial (riil 2.3–2.7)
export const COST_BORING_MULT = 3.75;          // × aerial
export const CONDUIT_REUSE_DISCOUNT = 0.19;    // −19% underground bila reuse
export const MAKE_READY_SHARE = 0.175;         // +17.5% aerial bertiang sewa (riil 15–20%)

// Constraint multipliers default (override per-feature di constraints.geojson)
export const CONSTRAINT_SOFT_MULT_DEFAULT = 1.8;
export const HARD_BLOCK_COST_SENTINEL = 1e15;  // → Infinity saat load

// Demand & ekonomi
export const TAKE_UP_RATE_DEFAULT = 0.35;      // penetrasi (tunable)
export const MBPS_PER_HOME_DEFAULT = 30;
export const ARPU_IDR_DEFAULT = /* per subtype map */ ;
export const DISCOUNT_RATE_ANNUAL = 0.13;      // ~ min return FTTH 12–15%
export const ANALYSIS_HORIZON_MONTHS = 60;

// ODP/drop capex
export const ODP_HARDWARE_IDR = /* ... */;
export const DROP_PER_HOME_IDR = /* ... */;
```
`formatters.ts`: tambah `formatMonths`, `formatKm`, `formatCapexIdr` (kompak, mis. "Rp 1,2 M").
`i18n-strings.ts`: semua label/kategori/tooltip/disclaimer baru (Bahasa Indonesia).

---

## 9. Pipeline `generate-data` — `scripts/`

Extend generator (tetap seeded untuk bagian sintetis). Tambah langkah & subskrip:

### 9.1 Road graph (`scripts/build-road-graph.ts`)
1. Baca `admin-boundaries.geojson`, hitung union 3 poligon + bbox.
2. Query **Overpass** `way[highway]` dalam bbox (filter `highway` per §3.2). Fallback: ekstrak Geofabrik Jawa Barat lalu clip.
3. `osmtogeojson` → bangun node/edge; **clip ke union admin** (buang di luar).
4. Merge degree-2 nodes (kompres rantai) + simplifikasi (topojson opsional).
5. Tag tiap edge: `method` (§6.2 sederhana berbasis `highway` + crossing), `constraintClass` & `multiplier` (overlay dgn `constraints.geojson` via §6.1), hitung `baseCostIdr`/`totalCostIdr`.
6. Tulis `public/data/road-graph.json`.

### 9.2 Constraints (`scripts/build-constraints.ts`) — lihat §11 untuk isi
- Tarik dari OSM: `landuse=military`, `railway=rail` (+buffer RoW), `aeroway=aerodrome`, `boundary=protected_area`/`leisure=nature_reserve`, `natural=water`/`landuse=reservoir`, `waterway=river` (+buffer sempadan), `highway=motorway|trunk` (toll/nasional +buffer).
- Aproksimasi **KKOP Husein** dari parameter publik (radius horizontal surface dst, pusat di runway).
- **Heritage zones** Bandung: poligon hand-curated dari koordinat landmark + buffer (Braga, Asia-Afrika/Gedung Merdeka, Gedung Sate, Cipaganti).
- **HSR Whoosh** RoW: buffer garis lintasan di Padalarang (KBB).
- **Steep slope** KBB utara: opsional dari DEM (SRTM) threshold kemiringan, atau poligon kasar Lembang/Cisarua/Parongpong.
- Set `severity`, `methodForce`, `costMultiplier`, `wilayah`, `source`, `realData` per feature. Clip ke 3 wilayah. Tulis `public/data/constraints.geojson`.

### 9.3 Supply role + POP (`scripts/`)
- Tambah `role` ke generator `supply.json` (sebagian `fiberized_tower`).
- Derive `public/data/pop-sites.json` dari `fiberized_tower`.

### 9.4 Demand grid (`scripts/build-demand.ts`)
- **Jalur real (disarankan):** unduh Kontur Population (H3) untuk area Bandung Raya **atau** WorldPop Indonesia 100m → sampel ke H3 res 8/9 → clip 3 wilayah → `householdEst = popEst / AVG_HH_SIZE` (≈ 3.8). Tulis `population-grid.geojson` (`realData:true`).
- **Fallback sintetis:** densitas digradasi dari kepadatan PoI + total populasi admin (seeded), `realData:false`.
- `incumbent-coverage.geojson`: model proxy (§3.5), `realData:false`.

### 9.5 NPM scripts
```jsonc
"generate-data": "tsx scripts/index.ts",        // orkestrasi semua di bawah
"gen:roadgraph": "...", "gen:constraints": "...",
"gen:demand": "...", "gen:supply": "..."
```
Semua idempotent & deterministik. **Commit** file hasil ke repo.

---

## 10. Data Constraint Riil untuk 3 Wilayah (isi `constraints.geojson`)

> Daftar acuan untuk `build-constraints.ts`. Severity & multiplier = default, boleh dikalibrasi. Yang bertanda *aproksimasi* harus diberi `source` jujur & `realData` sesuai.

### 10.1 Kota Bandung
| Constraint | category | severity | methodForce | Sumber |
|---|---|---|---|---|
| KKOP Husein Sastranegara (Lanud) | `airport_kkop` | soft | underground | *aproksimasi* param KKOP publik (pusat runway Cicendo/Husein) |
| Kawasan cagar budaya Braga | `heritage_zone` | soft | underground | *hand-curated* (estetika; larang tiang udara baru) |
| Asia-Afrika / Gedung Merdeka | `heritage_zone` | soft | underground | *hand-curated* |
| Kawasan Gedung Sate & sekitar | `heritage_zone` | soft | underground | *hand-curated* |
| Jalan Cipaganti (heritage) | `heritage_zone` | soft | underground | *hand-curated* |
| Kodam III/Siliwangi & instalasi TNI | `military` | hard | — | OSM `landuse=military` |
| Sempadan Sungai Cikapundung | `river_setback` | soft | boring_only | OSM `waterway` + buffer |
| Jalan Soekarno-Hatta / Pasteur (nasional) | `national_road` | soft | boring_only | OSM `trunk/primary` + buffer (izin Bina Marga + risiko moratorium) |
| RoW KAI (lintas Bandung) | `rail_row` | hard | — | OSM `railway=rail` + buffer |

### 10.2 Kota Cimahi
| Constraint | category | severity | methodForce | Sumber |
|---|---|---|---|---|
| Instalasi militer Cimahi (Pusdik TNI AD, RS Dustira, dsb.) | `military` | hard | — | OSM `landuse=military` (Cimahi = kota garnisun; cakupan luas) |
| RoW KAI (Stasiun Cimahi, lintas utama) | `rail_row` | hard | — | OSM `railway=rail` + buffer |
| Tol Padaleunyi (ruas melintas) | `toll_row` | hard | — | OSM `motorway` + buffer |
| Jalan nasional (mis. Jend. Sudirman/Amir Mahmud) | `national_road` | soft | boring_only | OSM `primary/trunk` + buffer |

### 10.3 Kabupaten Bandung Barat (KBB)
| Constraint | category | severity | methodForce | Sumber |
|---|---|---|---|---|
| RoW HSR **Whoosh** (lintas + Stasiun Padalarang) | `hsr_row` | hard | — | OSM lintasan HSR + buffer (RoW nyaris untouchable) |
| Tol Cipularang (ruas Padalarang) | `toll_row` | hard | — | OSM `motorway` + buffer |
| RoW KAI (lintas Padalarang) | `rail_row` | hard | — | OSM `railway=rail` + buffer |
| Hutan konservasi / lereng utara (Lembang, Cisarua, Parongpong; Tangkuban Parahu/Burangrang) | `conservation_forest` / `steep_slope` | hard | — | OSM `protected_area`/`nature_reserve` + DEM slope (*aproksimasi*) |
| Waduk Saguling (badan air) | `water_body` | hard | — | OSM `natural=water`/`reservoir` |
| Waduk Cirata (bagian dalam KBB) | `water_body` | hard | — | OSM `natural=water`/`reservoir` |
| Jalan nasional Padalarang–Cisarua | `national_road` | soft | boring_only | OSM `primary/trunk` + buffer |

> **Catatan akurasi:** depot/Tegalluar HSR berada di Kab. Bandung (di luar scope) — **jangan** sertakan; hanya lintasan & Stasiun Padalarang yang masuk KBB. Pastikan semua poligon di-clip ke union 3 admin polygon.

---

## 11. Rencana Eksekusi Bertahap (Phases)

> Tiap fase: **bisa di-merge & di-demo sendiri**. Jangan lanjut sebelum *Acceptance* lolos. App harus selalu `npm run dev` tanpa error di akhir tiap fase.

### Fase 0 — Scaffolding & kontrak
- Tambah semua tipe (§4), konstanta (§8), slice store kosong (§5), loader file baru (yang belum ada datanya → no-op/empty), komponen layer **kosong** (return null) agar tree kompilasi.
- **Acceptance:** build hijau, app jalan identik dengan sebelumnya, tidak ada regresi.

### Fase 1 — **Constraint Layer (CENTERPIECE — permintaan VP)**
- `scripts/build-constraints.ts` (§9.2, §10) → `constraints.geojson` **real/aproksimasi** untuk 3 wilayah.
- `constraints.ts` (index, classifyPoint/Segment, unionHard).
- `ConstraintLayer.tsx` + legend + panel sidebar (toggle kategori, filter severity) + provenance badge.
- KPI awal: "# PoI di area restricted".
- **Acceptance:** poligon KKOP/heritage/military/HSR/toll/rail tampil benar di peta, ter-clip 3 wilayah, popup + filter jalan, provenance jujur tampil. PoI bisa diklasifikasi in/out restricted.

### Fase 2 — Road graph + cost model + routing service
- `build-road-graph.ts` → `road-graph.json` (tagged method+cost+constraintClass).
- `routing/{graph,cost-model,snap,route}.ts` + Web Worker dasar.
- (Opsional) `RoadGraphLayer.tsx` debug.
- **Acceptance:** bisa route A→B cost-weighted di browser; rute menghindari hard-block (uji titik di seberang RoW Whoosh → rute memutar, `detourRatio>1`); `methodBreakdown` & `costIdr` masuk akal; tidak nge-freeze UI (worker).

### Fase 3 — Capacity-aware K-Means + snap + validasi drop
- Modif `kmeans-recursive.ts` (split by capacity OR radius; snap; reassign ter-route; flag undeliverable).
- Marker ODP + ikon peringatan (inHardBlock/undeliverable).
- **Acceptance:** tidak ada centroid di hard-block; cluster size ≤ kapasitas port; PoI dengan drop ter-route > `MAX_DROP_ROUTED_M` ditandai; hasil deterministik (seed sama → output sama).

### Fase 4 — Feeder/backbone topology (MST→POP)
- `pop-sites.json` (dari `role`), `topology.ts`, `FeederLayer.tsx` + `RerouteFlagLayer.tsx`.
- KPI: Total Feeder km, homing per POP.
- **Acceptance:** tiap ODP terhubung ke tepat satu POP via pohon valid (tanpa siklus, tidak lewat hard-block); feeder diwarnai per metode; total km tampil.

### Fase 5 — Demand + overbuild/whitespace
- `build-demand.ts` → `population-grid.geojson` (real/Kontur atau fallback) + `incumbent-coverage.geojson` (proxy).
- `demand.ts`, `DemandHeatLayer.tsx` (toggle householdEst ↔ whitespaceScore).
- Revenue cluster di-recompute dari homes passed (bukan PoI-only).
- **Acceptance:** heatmap demand tampil & ter-clip; homes passed per cluster wajar; whitespace score membedakan area underserved; disclaimer incumbent `realData:false` jelas.

### Fase 6 — Capex / ROI / phasing slider
- `capex.ts`, slider budget + phase selector (sidebar), `PhaseLayer.tsx`, chart Capex-by-Phase, tabel ranked-by-ROI, constraint-impact card.
- **Acceptance:** geser slider budget → cluster ter-assign Phase 1/2/3 secara greedy by ROI, peta & tabel & KPI sinkron real-time; payback/NPV per cluster muncul; "extra cost akibat constraint" terhitung (rute dengan vs tanpa multiplier).

### Fase 7 — Polish & provenance
- Update `landing` methodology copy + bagian Provenance (§14) + About credits.
- Perluas Run dialog jadi multi-step (§7.4).
- Pass performa (§13), responsivitas, empty/error states, README.
- **Acceptance:** demo end-to-end mulus; semua layer punya provenance; performa OK pada dataset penuh; README menjelaskan real vs synthetic & cara `generate-data`.

---

## 12. Performa & Reproducibility

- **Web Worker** untuk `pipeline.ts` (routing, MST, k-means ter-route). Pakai `comlink`. Main thread hanya terima hasil + progress.
- **Cache route** antar pasangan node (Map keyed `min(a,b)-max(a,b)`); MST & reassign banyak memakai ulang.
- **Spatial index** (`flatbush`) untuk: constraint lookup, KNN node saat snap, hex↔buffer intersect demand.
- **Graph size:** target < 12 MB; merge degree-2, simplifikasi, batasi kelas `highway`. Gzip saat serve.
- **Slider budget** TIDAK memicu full re-route — hanya `phasing()` (murah) atas hasil capex yang sudah dihitung.
- **Determinisme:** seeded RNG untuk sintetis; layer real di-snapshot ke file statis (tidak fetch API saat runtime). Re-run `generate-data` → output identik.
- Pertimbangkan **lazy-load** `road-graph.json` & `population-grid.geojson` (besar) hanya saat analisis dijalankan, bukan saat landing.

---

## 13. Provenance & Disclaimer (kejujuran — non-negotiable)

Tampilkan tabel ini di About modal & README:

| Layer | Status | Sumber |
|---|---|---|
| Admin boundaries | Real | GADM L2 |
| Road network/graph | Real | OpenStreetMap © OpenStreetMap contributors |
| Constraints — military/rail/toll/HSR/water | Real (derived) | OSM tags + buffer RoW |
| Constraints — KKOP Husein | Aproksimasi | Parameter KKOP publik (bukan poligon resmi) |
| Constraints — heritage zones | Aproksimasi | Hand-curated dari landmark + Perda cagar budaya (indikatif) |
| Population/demand grid | Real | Kontur Population / WorldPop |
| Incumbent coverage | **Termodel (synthetic proxy)** | Tidak ada data publik footprint ISP |
| Supply (ODP/menara) | **Synthetic** | Seeded RNG (methodology demo) |
| PoI + revenue/kapasitas | **Synthetic** | Seeded RNG (methodology demo) |
| Cost rates | **Ilustratif** | Rasio FBA 2024/2025; absolut perlu kalibrasi |

**Tagline UI (taruh di landing):** *"Data PoI/supply masih sintetis untuk demo metodologi; pipeline menerima sumber apa pun. Constraint layer dibuat real/aproksimasi — di situlah letak masalah yang tool sekelas Comsof pun belum selesaikan."*

---

## 14. Definition of Done (keseluruhan)

- [ ] 6 pilar berfungsi end-to-end, ter-scope **hanya** Bandung/Cimahi/KBB.
- [ ] Constraint layer real/aproksimasi tampil & **mempengaruhi routing** (rute memutar terbukti pada RoW Whoosh/rail/toll/military).
- [ ] Routing cost-weighted client-side, di worker, deterministik, tidak freeze.
- [ ] ODP rekomendasi: tidak di hard-block, hormati kapasitas port, drop tervalidasi ter-route.
- [ ] Feeder MST→POP valid; total km & topologi tampil.
- [ ] Demand dari grid populasi real + whitespace score; overbuild jelas berlabel proxy.
- [ ] Slider budget → phasing ROI real-time; payback/NPV/ROI per cluster; constraint-impact terhitung.
- [ ] Semua parameter di `constants.ts`, copy Bahasa di `i18n-strings.ts`.
- [ ] Provenance & disclaimer tampil; README + `generate-data` reproducible; build hijau.

---

## 15. Out of Scope / JANGAN dilakukan

- ❌ Menambah wilayah di luar 3 (Kab. Bandung, Sumedang, dst.) — termasuk depot HSR Tegalluar.
- ❌ Live routing API saat runtime (OSRM/Valhalla hanya build-time / opsi upgrade).
- ❌ Mengklaim data sintetis sebagai riil, atau KKOP/heritage aproksimasi sebagai poligon resmi.
- ❌ Rewrite arsitektur/store/struktur folder yang sudah ada.
- ❌ Menyimpan state di localStorage/sessionStorage pada komponen (pakai Zustand in-memory).
- ❌ Over-engineering algoritma (Steiner tree eksak, OR-Tools, dll.) — MST + greedy cukup untuk skala & tujuan demo.

---

## Appendix A — Keputusan Engine Routing & Jalur Upgrade

**Runtime (proyek ini):** *pre-built road graph + `ngraph.path` A* cost-weighted di browser.*
- **Kenapa:** interaktif penuh (user re-run setelah ubah constraint/asumsi), tanpa rate-limit, reproducible, semua client-side. Cocok untuk demo metodologi.
- **Constraint handling:** edge `hard` → cost `Infinity` (di-skip pathfinder) → rute otomatis memutar. Edge `soft` → cost × multiplier (boleh dilewati tapi mahal).

**Fallback (jika graph terlalu berat / perf jelek):** cost-weighted **straight-line + penalti potongan poligon** (`turf.lineIntersect` vs `constraints.geojson`); rute lurus yang menembus hard-block ditolak & ditandai. Aproksimasi sah untuk demo; jelaskan sebagai simplifikasi.

**Jalur upgrade produksi (sebutkan ke VP, jangan diimplementasi sekarang):** self-host **Valhalla** dengan `exclude_polygons` native (avoid hard-block sebagai constraint kelas satu) + custom costing per metode (aerial/underground/boring). Ini "the right tool" untuk skala FiberCo. Menunjukkan kita paham trade-off engine, bukan sekadar pakai k-means.

---

*Akhir dokumen. Bangun Fase 0 → 7 berurutan. Pertanyaan desain saat eksekusi: default ke prinsip §1 (scope lock, client-side routing, real-vs-synthetic eksplisit, reproducible, no UI freeze).*
