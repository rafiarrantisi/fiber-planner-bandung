export const STRINGS = {
  brand: {
    product: 'Perencana Fiber Bandung Raya',
    subtitle: 'Studi Kasus Perencanaan Infrastruktur Fixed Broadband',
    author: 'Muhammad Rafi Ar-Rantisi',
    affiliation: 'Institut Teknologi Bandung',
  },
  hero: {
    eyebrow: 'Studi Kasus · Perencanaan Infrastruktur Fixed Broadband',
    title: 'Perencanaan Fiber Broadband\nBerbasis Permintaan',
    tagline:
      'Analisis geospasial 4.300+ titik minat di Kota Bandung, Cimahi, dan Kabupaten Bandung Barat.',
    ctaPrimary: 'Buka Dashboard',
    ctaSecondary: 'Tentang Proyek',
    signature: 'oleh Muhammad Rafi Ar-Rantisi · Institut Teknologi Bandung',
  },
  nav: {
    dashboard: 'Dashboard',
    methodology: 'Metodologi',
    about: 'Tentang',
  },
  analysis: {
    runLabel: 'Jalankan Analisis',
    running: 'Memproses…',
    reset: 'Reset',
    steps: {
      buffer: 'Membuat buffer 200 m di sekitar titik supply',
      classify: 'Klasifikasi PoI: FO-Ready vs Non-FO',
      cluster: 'Klasterisasi PoI Non-FO (recursive K-means, ≤300 m)',
      stats: 'Menghitung statistik dan revenue',
    },
    done: 'Analisis selesai',
  },
  sidebar: {
    layers: 'Layer',
    filters: 'Filter',
    category: 'Kategori PoI',
    foStatus: 'Status Jaringan',
    city: 'Kota / Kabupaten',
    layerPoi: 'Titik Minat (PoI)',
    layerSupply: 'Supply (ODP & Menara)',
    layerFiber: 'Kabel Fiber',
    layerBuffer: 'Buffer 200 m',
    layerBoundary: 'Batas Administrasi',
    layerClusters: 'Rekomendasi ODP Baru',
    foAll: 'Semua',
    foReady: 'FO-Ready',
    nonFo: 'Non-FO',
  },
  stats: {
    totalPoi: 'Total PoI',
    foReady: 'FO-Ready',
    nonFo: 'Non-FO',
    clusters: 'Rekomendasi ODP',
    revenueCaptured: 'Revenue Tercapai',
    revenueLost: 'Revenue Peluang',
    perMonth: '/bulan',
    panelTitle: 'Ringkasan Analisis',
    empty: 'Klik "Jalankan Analisis" untuk melihat ringkasan.',
    byCategory: 'Distribusi per Kategori',
    foDistribution: 'Distribusi Status Jaringan',
    revenueByCategory: 'Revenue per Kategori',
    clusterTable: 'Daftar Rekomendasi ODP',
  },
  popup: {
    capacity: 'Kapasitas',
    revenue: 'Revenue bulanan',
    foStatus: 'Status',
    distance: 'Jarak ke supply terdekat',
    utilization: 'Utilisasi',
    servedPoi: 'PoI terlayani',
    member: 'Jumlah anggota',
    recommendOdp: 'Rekomendasi ODP baru',
    totalCapacity: 'Total kapasitas',
    totalRevenue: 'Total revenue peluang',
    nearestOdp: 'ODP terdekat',
  },
  methodology: {
    title: 'Metodologi',
    bufferRationale:
      'Radius 200 m mengikuti rekomendasi APJATEL untuk jangkauan layanan ODP di area urban.',
    clusterRationale:
      'Batas 300 m antar-anggota klaster memastikan kandidat lokasi ODP baru dapat melayani seluruh anggota dalam radius operasional drop cable.',
    capacityRationale:
      'Estimasi kapasitas dan revenue mengikuti rata-rata enterprise bandwidth untuk tiap subtype institusi publik.',
  },
  about: {
    scope:
      'Showcase metodologi perencanaan infrastruktur fixed broadband berbasis demand — dari supply/demand mapping hingga rekomendasi penempatan ODP baru lewat recursive K-means.',
    disclaimer:
      'Seluruh data pada dashboard ini adalah data dummy hasil sintesis untuk kebutuhan demonstrasi metodologi.',
  },
} as const
