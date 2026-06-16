import type { PoISubtype, CostAssumptions } from '@/types/domain'

export const BUFFER_RADIUS_M = 200
export const KMEANS_MAX_DIST_M = 300
export const KMEANS_SEED = 42
export const KMEANS_MAX_DEPTH = 10

export const BANDUNG_RAYA_CENTER: [number, number] = [-6.9175, 107.6191]
export const BANDUNG_RAYA_ZOOM = 11

export const CARTO_POSITRON_TILE =
  'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

// ════════════════════════════════════════════════════════════════════
//  Tambahan v2 — Constraint-aware & cost-aware rollout engine (§8)
//  Semua tunable. Rasio biaya tervalidasi (FBA 2024/2025); nilai absolut
//  ILUSTRATIF dan perlu kalibrasi dengan unit cost FiberCo.
// ════════════════════════════════════════════════════════════════════

// ── ODP & klaster (pilar #3) ─────────────────────────────────────────
export const ODP_PORT_CAPACITY = 16 // 8 | 16 (standar ODP urban)
export const ODP_PORT_OPTIONS = [8, 16] as const
export const MAX_DROP_ROUTED_M = 250 // drop ter-route realistis (radius lama 300)
export const REROUTE_FLAG_RATIO = 1.6 // detour ratio ambang flag "memutar"
// (1.25 menangkap kelokan jalan biasa; 1.6 = memutar signifikan/akibat kendala)
export const SNAP_KNN_CANDIDATES = 12 // kandidat node terdekat saat snap centroid

// ── Cost model (pilar #2) — IDR/m, rasio tervalidasi ─────────────────
export const COST_AERIAL_IDR_PER_M = 28_000 // base "X"
export const COST_UNDERGROUND_MULT = 2.5 // × aerial (riil 2.3–2.7)
export const COST_BORING_MULT = 3.75 // × aerial (riil 3.5–4)
export const COST_UNDERGROUND_IDR_PER_M = COST_AERIAL_IDR_PER_M * COST_UNDERGROUND_MULT
export const COST_BORING_IDR_PER_M = COST_AERIAL_IDR_PER_M * COST_BORING_MULT
export const CONDUIT_REUSE_DISCOUNT = 0.19 // −19% underground bila reuse konduit
export const MAKE_READY_SHARE = 0.175 // +17.5% aerial bertiang sewa (riil 15–20%)

export const DEFAULT_COST_ASSUMPTIONS: CostAssumptions = {
  aerialIdrPerM: COST_AERIAL_IDR_PER_M,
  undergroundIdrPerM: COST_UNDERGROUND_IDR_PER_M,
  boringIdrPerM: COST_BORING_IDR_PER_M,
  conduitReuseDiscount: CONDUIT_REUSE_DISCOUNT,
  makeReadyShare: MAKE_READY_SHARE,
}

// ── Constraint multipliers (pilar #1) ────────────────────────────────
export const CONSTRAINT_SOFT_MULT_DEFAULT = 1.8 // override per-feature di constraints.geojson
export const HARD_BLOCK_COST_SENTINEL = 1e15 // → Infinity saat load
export const CONSTRAINT_BUFFER_ROW_M = 30 // buffer RoW default (rail/toll/hsr/sungai)

// ── Demand & ekonomi (pilar #5,#6) ───────────────────────────────────
export const TAKE_UP_RATE_DEFAULT = 0.35 // penetrasi (tunable)
export const MBPS_PER_HOME_DEFAULT = 30
export const ARPU_IDR_DEFAULT = 300_000 // ARPU residential FTTH blended /bln
export const AVG_HH_SIZE = 3.8 // rata-rata anggota rumah tangga (BPS)
export const H3_RESOLUTION = 8 // resolusi grid heksagonal demand
export const HOMES_PASSED_BUFFER_M = BUFFER_RADIUS_M // cakupan ODP utk homes-passed

export const DISCOUNT_RATE_ANNUAL = 0.13 // ~ min return FTTH 12–15%
export const DISCOUNT_RATE_MONTHLY = DISCOUNT_RATE_ANNUAL / 12
export const ANALYSIS_HORIZON_MONTHS = 60

// ── ODP / drop / distribusi capex (pilar #6) ─────────────────────────
export const ODP_HARDWARE_IDR = 5_000_000 // ODP 16-port + splitter + closure terpasang
export const DROP_PER_HOME_IDR = 2_500_000 // drop cable + ONT + aktivasi per home tersambung
// Jaringan distribusi yang MELEWATI tiap home (terhubung maupun tidak) — driver
// utama capex per home-passed (riil FTTH urban ID ≈ Rp1,5–2,5 jt/home passed).
export const COST_PER_HOME_PASSED_IDR = 2_000_000

// ── Slider budget capex (pilar #6) ───────────────────────────────────
export const DEFAULT_CAPEX_BUDGET_IDR = 5_000_000_000 // Rp 5 M default Phase-1 budget
export const CAPEX_BUDGET_MIN_IDR = 500_000_000
export const CAPEX_BUDGET_MAX_IDR = 50_000_000_000
export const CAPEX_BUDGET_STEP_IDR = 250_000_000

// ── ARPU enterprise per subtype (pilar #5/#6, opsional override) ──────
export const ARPU_BY_SUBTYPE_IDR: Partial<Record<PoISubtype, number>> = {
  // dipakai bila ingin revenue per-PoI; demand residential pakai ARPU_IDR_DEFAULT
}
