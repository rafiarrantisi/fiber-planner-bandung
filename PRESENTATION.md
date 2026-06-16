# Perencana Fiber Bandung Raya
### Constraint-Aware & Cost-Aware Fixed-Broadband Rollout Engine

> Dokumen ikhtisar untuk presentasi. Disusun oleh **Muhammad Rafi Ar-Rantisi** — Institut Teknologi Bandung.
>
> 🔗 Live: **https://fiber-planner-bandung.vercel.app/** · Repo: **github.com/rafiarrantisi/fiber-planner-bandung**

---

## 1. Ringkasan Eksekutif

Tool ini menjawab satu pertanyaan operasional yang dihadapi setiap operator FTTH saat ekspansi:

> **"Di area ini, ODP baru sebaiknya dibangun di mana, dengan rute kabel termurah yang patuh aturan, disambung ke jaringan bagaimana, dan mana yang dibangun duluan supaya balik modal tercepat?"**

Berbeda dari dashboard geospasial biasa yang berhenti di "titik mana yang belum terjangkau", engine ini meneruskan rantai keputusan sampai ke **rencana rollout yang buildable (bisa dibangun) dan bankable (layak didanai)** — lengkap dengan biaya per rute, topologi jaringan, demand, dan fasing capex berbasis ROI.

Studi kasus: **Kota Bandung, Kota Cimahi, Kabupaten Bandung Barat** (~4.300 titik permintaan, ~525 titik supply).

---

## 2. Masalah & Gap Pasar

Industri sudah punya automated FTTH planning kelas dunia (Comsof/IQGeo, Biarri/FOND, VETRO, FiberPlanIT). **Tapi** bahkan tool sekelas Comsof diakui menghasilkan rute yang efisien *di atas kertas* namun **mengabaikan kendala konstruksi dunia nyata** dan tetap butuh review engineer.

**Di situlah fokus tool ini.** Kami tidak mencoba mengalahkan Comsof — kami menyerang satu hal yang belum mereka selesaikan: **kepatuhan terhadap kendala konstruksi & perizinan lokal.** Konteksnya nyata:

- **Permitting adalah penghambat #1 deployment** (temuan FCC dan banyak operator).
- Di Indonesia ada **SJUT / Pergub** soal jaringan utilitas, kabel udara semrawut yang bahkan sudah memakan korban jiwa.
- **Underground ≈ 2,3–2,7× lebih mahal dari aerial**; make-ready bisa 15–20% biaya proyek.
- **Overbuild itu value-destructive** — minimum return FTTH naik ke 12–15%, jadi membangun di area yang sudah dilayani incumbent = membakar modal.

Tool ini menjadikan kendala-kendala itu sebagai **input kelas satu**, bukan catatan kaki.

---

## 3. Enam Pilar (Fitur Utama)

Tiga pilar warisan studi awal (buffer 200 m APJATEL, klasifikasi FO-Ready vs Non-FO, recursive K-means ≤300 m) dipertahankan dan diperluas dengan enam pilar baru:

### Pilar 1 — Constraint Layer (Right-of-Way)
**Masalah riil:** izin & RoW adalah penghambat deployment terbesar.
**Yang dilakukan:** layer poligon zona terlarang/terbatas untuk 3 wilayah — KKOP Bandara Husein, kawasan cagar budaya (Braga, Asia-Afrika, Gedung Sate, Cipaganti), instalasi militer, RoW kereta/tol/kereta cepat Whoosh, sempadan sungai, jalan nasional. Dua tingkat: **hard-block** (terlarang) dan **soft-penalty** (boleh tapi mahal / wajib metode tertentu).
**Nilai bisnis:** routing & penempatan ODP otomatis patuh; engineer tidak perlu mengoreksi rute yang menembus rel atau bandara.

### Pilar 2 — Cost-Aware Routing
**Masalah riil:** rute terpendek ≠ rute termurah dibangun.
**Yang dilakukan:** algoritma A* *cost-weighted* berjalan di browser di atas graph jalan nyata (OpenStreetMap) yang sudah di-tag biaya per metode (aerial / underground / boring). Edge hard-block "dihapus" dari graph sehingga rute **otomatis memutar**.
**Nilai bisnis:** estimasi biaya rute realistis (aerial vs underground vs boring), bukan asumsi garis lurus. Rute yang dipilih = *cheapest-to-build*.

### Pilar 3 — Capacity-Aware ODP + Snap-to-Road
**Masalah riil:** K-means murni buta kapasitas dan bisa menaruh ODP di atap rumah atau di tengah sungai; drop cable mengikuti jalan, bukan garis lurus.
**Yang dilakukan:** klaster dipecah berdasarkan **kapasitas port (8/16)** *atau* radius; centroid di-**snap ke node jalan yang valid** (bukan di hard-block); tiap PoI divalidasi jarak drop-nya.
**Nilai bisnis:** rekomendasi ODP langsung buildable — di jalan, hormati kapasitas, drop terkonfirmasi.

### Pilar 4 — Topologi Feeder/Backbone
**Masalah riil:** FTTH itu hierarki OLT → feeder → ODP → drop. Aset wholesale bernilai ada di feeder & POP.
**Yang dilakukan:** membangun **Minimum Spanning Forest** cost-weighted yang menyambungkan tiap ODP ke POP (menara fiberized) terdekat di atas road graph — tanpa siklus, tidak melewati hard-block.
**Nilai bisnis:** total kilometer feeder, biaya backbone, dan homing tiap ODP ke POP terukur untuk perencanaan kapasitas & wholesale.

### Pilar 5 — Demand + Overbuild / Whitespace
**Masalah riil:** PoI ≠ demand rumah tangga; membangun di area overbuild = rugi.
**Yang dilakukan:** grid heksagonal H3 berisi estimasi rumah tangga; menghitung **homes-passed** per ODP; **skor whitespace** memisahkan area underserved (demand tinggi, incumbent rendah) dari area jenuh.
**Nilai bisnis:** prioritaskan area dengan peluang nyata; hindari overbuild.

### Pilar 6 — Capex, ROI & Fasing
**Masalah riil:** investor cuma ingin tahu — **bangun yang mana dulu biar balik modal cepat?**
**Yang dilakukan:** unit economics per cluster (capex, payback, NPV, ROI), lalu **slider budget capex** menyusun **Fase 1/2/3** secara *greedy by ROI* — bangun yang paling cepat balik modal lebih dulu — dan menghitung **biaya ekstra akibat kendala/perizinan**.
**Nilai bisnis:** rencana rollout bertahap yang langsung bisa dipresentasikan ke komite investasi.

---

## 4. Hasil Demo (Metrik Kunci)

Dari satu kali "Jalankan Analisis" pada dataset penuh 3 wilayah:

| Metrik | Nilai |
|---|---|
| PoI di area restricted (kendala) | **833** dari ~4.300 |
| Zona kendala | **98** (91 hard-block, 7 soft-penalty) |
| Graph jalan routable | **24.381 node · 29.238 edge** (≈7,6 MB) |
| Kecepatan routing | **~29 ms / rute** (cost-weighted A*, di Web Worker) |
| ODP baru direkomendasikan | **1.791** (semua snap-to-road, 0 di hard-block) |
| Total feeder (MST→POP) | **≈950 km**, 0 rute terblokir |
| Homes passed | **≈701.000 rumah** |
| Total capex | **≈Rp 2,08 triliun** |
| Blended payback | **≈22,9 bulan** (~1,9 tahun) |
| Biaya ekstra akibat kendala/permit | **≈Rp 14 miliar** |
| Fasing @ budget Rp 5 M | Fase 1: 41 ODP · Fase 2: 15 · Fase 3: 1.735 |

> Geser slider budget capex → Fase 1/2/3 tersusun ulang **real-time** tanpa menghitung ulang routing. Naikkan budget ke Rp 30 M → Fase 1 melonjak ke 98 ODP.

*Catatan: angka capex bersifat ilustratif (lihat §6); dikalibrasi agar payback realistis untuk FTTH urban.*

---

## 5. Arsitektur & Tech Stack

### Mengapa pilihan ini

| Keputusan | Alasan |
|---|---|
| **Routing client-side** (browser), bukan API | Interaktif penuh — user bisa re-run setelah ubah kendala/asumsi; tanpa rate-limit; reproducible; semua di browser. |
| **Web Worker** untuk komputasi berat | Routing 1.800+ feeder, MST, recursive k-means jalan di thread terpisah → **UI tidak pernah freeze**. |
| **Pre-built road graph** statis | OSM diproses sekali saat build (di-snapshot ke file), bukan fetch saat runtime → cepat & deterministik. |
| **Seeded RNG** untuk data sintetis | Re-generate menghasilkan output identik (reproducible). |

### Stack

| Layer | Teknologi |
|---|---|
| Build & UI | Vite · React 19 · TypeScript (strict) · Tailwind CSS · Framer Motion |
| Peta | react-leaflet 5 + Leaflet 1.9 (rendering canvas) · CartoDB Positron |
| Geospasial | Turf.js · Flatbush (spatial index R-tree) · H3 (grid heksagonal) |
| Routing | ngraph.graph + ngraph.path (A* cost-weighted) |
| Paralelisme | Comlink (Web Worker) |
| Klasterisasi | ml-kmeans + recursive wrapper |
| Charts & State | Recharts · Zustand |
| Pipeline data (build-time) | Overpass API (OSM), Nominatim (GADM), OSRM (routing kabel) |

### Pipeline analisis (berjalan di worker)

```
Buffer 200 m → Klasifikasi FO-Ready → Cluster capacity-aware + snap-to-road
   → Routing feeder cost-aware → Topologi MST→POP → Demand & whitespace
   → Capex / payback / NPV / ROI + fasing → Agregasi KPI
```

---

## 6. Data & Provenansi (Transparansi Penuh)

Kejujuran data ditampilkan terbuka di dalam aplikasi (About modal) dan README:

| Layer | Status | Sumber |
|---|---|---|
| Batas administrasi | **Real** | GADM L2 / Nominatim |
| Jaringan jalan / graph | **Real** | OpenStreetMap © OpenStreetMap contributors |
| Kendala — militer/rel/tol/HSR/air | **Real (derived)** | OSM tags + buffer RoW |
| Kendala — KKOP Husein | **Aproksimasi** | Parameter KKOP publik (bukan poligon resmi) |
| Kendala — cagar budaya | **Aproksimasi** | Hand-curated dari landmark + Perda (indikatif) |
| Grid populasi / demand | **Termodel** | H3 dari densitas OSM, dikalibrasi total populasi BPS |
| Cakupan incumbent | **Proxy termodel** | Densitas supply (tidak ada data publik footprint ISP) |
| Supply (ODP/menara) | **Sintetis** | Seeded RNG (demo metodologi) |
| PoI + revenue/kapasitas | **Sintetis** | Seeded RNG (demo metodologi) |
| Tarif biaya konstruksi | **Ilustratif** | Rasio FBA 2024/2025; absolut perlu kalibrasi |

> **Posisi jujur:** data PoI/supply/revenue masih sintetis sebagai demo metodologi — **pipeline menerima sumber data apa pun**. Begitu data riil operator dimasukkan (titik pelanggan, footprint jaringan, unit cost), engine langsung memberi rencana rollout nyata. Constraint layer sudah dibuat real/aproksimasi — di situlah letak nilai pembeda.

---

## 7. Performa & Reproducibility

- **Tidak ada freeze:** seluruh komputasi berat di Web Worker; rute individual ~29 ms setelah graph siap.
- **Graph ringan:** kompresi degree-2 menyusutkan 402.000 node mentah → **24.381 node** (< 8 MB), tetap konektif penuh.
- **Spatial index** (Flatbush) untuk lookup kendala & snap node berskala ribuan.
- **Deterministik:** seed RNG tetap untuk bagian sintetis; layer real di-snapshot ke file. `npm run gen:all` → output identik.
- **Slider budget** tidak memicu re-route — hanya re-fasing (murah, real-time).

---

## 8. Roadmap ke Produksi (Upgrade Path)

Untuk skala FiberCo / produksi, jalur peningkatan yang jelas (menunjukkan pemahaman trade-off engine, bukan sekadar k-means):

1. **Self-host Valhalla** dengan `exclude_polygons` native → hard-block sebagai constraint kelas satu + custom costing per metode (aerial/underground/boring).
2. **Kalibrasi data riil:** ganti PoI/supply/revenue sintetis dengan data pelanggan & jaringan operator; ganti grid populasi termodel dengan **Kontur/WorldPop**; unit cost biaya konstruksi dari RAB internal.
3. **Footprint incumbent riil** (jika tersedia) menggantikan proxy.
4. **Integrasi perizinan:** layer SJUT/Pergub resmi dari pemda.
5. **Optimasi lanjutan:** Steiner tree / OR-Tools bila diperlukan (untuk demo, MST + greedy sudah cukup).

---

## 9. Batasan & Catatan

- Angka biaya & revenue **ilustratif**, untuk demonstrasi metodologi — bukan proyeksi finansial final.
- KKOP & cagar budaya = **aproksimasi**, bukan poligon perizinan resmi.
- Drop cable diukur sebagai proxy (kekompakan cluster), bukan routing per-rumah penuh.
- Scope dikunci ke **3 wilayah** (Bandung, Cimahi, KBB) sesuai studi kasus.

---

## 10. Cara Mengakses

- **Live demo:** https://fiber-planner-bandung.vercel.app/ — klik **"Jalankan Analisis"** untuk menjalankan seluruh pipeline; gunakan sidebar untuk toggle layer kendala/feeder/demand, slider budget capex, dan filter fase.
- **About modal** (dari hero) memuat tabel provenansi data lengkap.
- **Repo:** github.com/rafiarrantisi/fiber-planner-bandung — `README.md` untuk arsitektur teknis & cara menjalankan lokal.

---

*Tagline: "Kami tidak mengalahkan Comsof — kami menyelesaikan satu hal yang bahkan Comsof pun belum selesaikan: kepatuhan kendala konstruksi lokal Bandung Raya."*
