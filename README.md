# Perencana Fiber Bandung Raya

Dashboard interaktif perencanaan infrastruktur fixed broadband berbasis demand untuk **Kota Bandung, Kota Cimahi, dan Kabupaten Bandung Barat**, studi kasus metodologi geospasial dengan 4.300+ titik minat.

Dibuat oleh **Muhammad Rafi Ar-Rantisi** · Institut Teknologi Bandung.

---

## Ringkasan Metodologi

Dashboard ini mereproduksi tiga pilar analitis dari model perencanaan:

1. **Buffer 200 m** di sekitar setiap titik supply (ODP & menara fiberized), mengikuti rekomendasi APJATEL untuk jangkauan layanan ODP di area urban.
2. **Klasifikasi FO-Ready vs Non-FO** lewat spatial join — setiap PoI diuji titik-di-poligon terhadap union buffer.
3. **Recursive K-Means (≤300 m)** pada PoI Non-FO untuk merekomendasikan lokasi ODP baru dalam radius operasional drop cable.

Tambahan: estimasi **kapasitas (Mbps)** dan **revenue bulanan (IDR)** per PoI berdasarkan rata-rata enterprise bandwidth per subtype institusi.

---

## Stack

| Layer | Pilihan |
|---|---|
| Build | Vite + React 19 + TypeScript |
| Map | react-leaflet 5 + Leaflet 1.9 |
| Basemap | CartoDB Positron |
| Marker cluster | leaflet.markercluster (imperative via useMap) |
| Geospatial | @turf/turf |
| K-means | ml-kmeans + recursive wrapper |
| Charts | Recharts |
| Styling | Tailwind CSS (editorial light theme) |
| State | Zustand |
| Animations | Framer Motion |
| Icons | lucide-react |

**Data routing** (pre-generate): OSRM public API untuk road-routed fiber cables, Nominatim untuk batas administrasi GADM level 2.

---

## Menjalankan Lokal

```bash
# 1. Install dependencies
npm install

# 2. (Opsional) Generate ulang data dummy — butuh ~15 menit karena OSRM rate-limit
npm run generate-data

# 3. Jalankan dev server
npm run dev
```

Buka `http://localhost:5173`. Data dummy hasil generate ter-cache di `public/data/` dan sudah di-commit, jadi step 2 bisa di-skip kecuali ingin re-seed.

---

## Struktur Data

Empat file static di `public/data/`:

- `admin-boundaries.geojson` — polygon 3 kota/kabupaten (GADM level 2).
- `supply.json` — ~525 titik supply (ODP + menara fiberized).
- `poi.json` — ~4.300 titik minat dengan kategori, subtype, kapasitas, dan revenue.
- `fiber-cables.geojson` — ~688 segmen fiber road-routed antar supply points.

Reproducibility: semua data dihasilkan lewat seeded RNG (`seedrandom`), jadi re-run `npm run generate-data` menghasilkan output identik.

---

## Arsitektur Singkat

```
src/
├── types/domain.ts                    # Kontrak data (PoI, Supply, Cluster, AnalysisResult)
├── store/                             # Zustand stores: data, filters, analysis, map-ui
├── data/loaders.ts                    # Fetch /data/*.json
├── analysis/
│   ├── buffer.ts                      # Turf buffer 200m + union
│   ├── spatial-join.ts                # FO-Ready classification
│   ├── kmeans-recursive.ts            # Recursive K-means dengan constraint 300m
│   └── stats.ts                       # Agregasi KPI + per-kategori
├── components/
│   ├── map/                           # Leaflet layers, popups, legend, fly controller
│   ├── sidebar/                       # Layer toggles & filter
│   ├── stats/                         # KPI cards, charts, cluster table
│   ├── analysis/                      # Run dialog 4-step
│   └── landing/                       # Hero, methodology, about modal
└── lib/
    ├── formatters.ts                  # Intl id-ID untuk IDR/Mbps/%
    ├── constants.ts                   # BUFFER_RADIUS_M, KMEANS_MAX_DIST_M
    └── i18n-strings.ts                # Seluruh copy Bahasa Indonesia
```

---

## Deployment

Konfigurasi Vercel sudah di `vercel.json` dengan SPA rewrites + cache header immutable untuk `/data/*` dan `/assets/*`.

```bash
# Build lokal
npm run build

# Deploy ke Vercel (CLI) atau push ke branch yang terhubung ke proyek Vercel
vercel --prod
```

Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.

---

## Catatan

Seluruh data pada dashboard ini adalah **data dummy hasil sintesis** untuk keperluan demonstrasi metodologi. Capacity dan revenue menggunakan asumsi enterprise bandwidth rata-rata per subtype dengan jitter ±20%.
