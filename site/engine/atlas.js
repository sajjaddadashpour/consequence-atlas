// Consequence Atlas browser engine. Spec: LOCKED_SITE_ENGINE.md (stamp 2026-11-14 17:16:50 -0600 America/Regina).
// Plain ES module, no dependencies. No new physics. Labels are those already on the repo links.

export const id = "atlas";
export const cards = [];

// ---- constants (LOCKED §1) ----
export const A0_DERIVE = 1 / 137.035999;
export const B0_DERIVE = 1 / 1836.15267;
export const A0_DIAL = 0.0072973525693;
export const B0_DIAL = 0.000544617021;
export const MP_MEV = 938.272;
export const Q_NP = 2.52;
export const E_NP = -1.00;
export const DQ_HYPOT = Math.hypot(0.17, 0.24);
export const DE_HYPOT = Math.hypot(0.07, 0.14);
export const DQ_BOX = 0.294;
export const DE_BOX = 0.157;
export const AS_MEV = 17.8;
export const AC_MEV = 0.711;
export const BARRIER = 2.62e-12;
export const K_ADAMS = 10 ** (-8 / 3);
export const K_TEGMARK = 1 / 200;
export const K_BARNES = 1 / 100;
export const LAMBDA_GALAXY = 57.5;
export const LAMBDA_LIFE = -7.09;
export const LAMBDA_LIFE_LOOSE = -53.9;
export const LAMBDA_T0 = 36.7; // Gyr, t = 36.7 / sqrt(|x|) for x < 0
export const KB = 1.380649e-23;
export const QE = 1.602176634e-19;

export const OURS = Object.freeze({
  dimensions: 3,
  alpha: A0_DIAL,
  beta: B0_DIAL,
  strong: 0,
  arrow: 1,
  cosmological_constant: 1,
});

export const DIAL_DEFS = [
  { id: "alpha", name: "Fine-structure constant", symbol: "α", units: "dimensionless", range: [1e-6, 1], scale: "log", default: A0_DIAL, locked: false, sources: ["barnes2012", "adams2019"] },
  { id: "beta", name: "Electron-to-proton mass ratio", symbol: "β = m_e/m_p", units: "dimensionless (proton mass held fixed)", range: [1e-5, 100], scale: "log", default: B0_DIAL, locked: false, sources: ["barnes2012", "tegmark1998"] },
  { id: "strong", name: "Strong-force change", symbol: "s", units: "fractional change of the strong coupling (0 = ours)", range: [-0.2, 0.6], scale: "linear", default: 0, locked: false, sources: ["barnes2012", "adams2019"] },
  { id: "cosmological_constant", name: "Cosmological constant", symbol: "Λ", units: "rho_Lambda / rho_Lambda,ours (signed; negative = negative vacuum energy; UIs should use a symmetric-log axis)", range: [-1000, 1000], scale: "symlog", default: 1, locked: false, sources: ["weinberg1987", "msw1998", "planck2018", "barrow-tipler1986", "peacock2007"] },
  { id: "dimensions", name: "Number of space dimensions", symbol: "n", units: "count (one time dimension fixed in v0)", range: [1, 5], scale: "discrete", default: 3, locked: false, sources: ["tegmark1997", "barrow1983"] },
  { id: "arrow", name: "Arrow of time and records", symbol: "arrow", units: "0 = reversible laws, equilibrium start; 1 = reversible laws, low-entropy start (ours); 2 = irreversible laws", range: [0, 2], scale: "discrete", default: 1, locked: false, sources: ["rovelli2020", "wolpert1992"] },
];
export const dials = DIAL_DEFS;
export const LOCKED_NOT_DIALS = [
  { name: "time dimensions", value: 1, locked: true, reason: "fixed in v0; not a slider" },
  { name: "G", value: "ours", locked: true, reason: "Newton's G is held fixed; not a dial in v0" },
];

// Frozen D1 / D2 from derived.json (not recomputed). LOCKED §2.
export const D1_TABLE = {
  1: { extrema: [["min", 1.0]], stable_circular_orbit: true },
  2: { extrema: [["min", 1.0]], stable_circular_orbit: true },
  3: { extrema: [["min", 1.0]], stable_circular_orbit: true },
  4: { extrema: [], stable_circular_orbit: false },
  5: { extrema: [["max", 2.99999133271615]], stable_circular_orbit: false },
};
export const D2_TABLE = {
  3: { "0.1": -0.2180189558317851, "0.03": -0.24105326481206374, "0.01": -0.24999843751947215 },
  4: { "0.1": 0.004528008209490574, "0.03": 0.00431992700075675, "0.01": 0.004077743983553367 },
  5: { "0.1": -4.0245791498697905, "0.03": -19427.3181157315, "0.01": -960116.2776528426 },
};

// ---- stages and links (repo yaml, locked) ----
// BEGIN GENERATED STAGES (verify/gen_stages.py)
export const STAGES = [
  { id: "s00.rules", name: "Chosen rules (dial settings)", order: 0, requires: [] },
  { id: "s01.predictable-laws", name: "Predictable laws", order: 1, requires: ["s00.rules"] },
  { id: "s02.sharp-signals", name: "Sharp signals (light, sound)", order: 2, requires: ["s01.predictable-laws"] },
  { id: "s03.orbits-atoms-gravity", name: "Stable orbits, atoms and gravity", order: 3, requires: ["s01.predictable-laws"] },
  { id: "s04.stable-atoms", name: "Non-relativistic, stable atoms", order: 4, requires: ["s03.orbits-atoms-gravity"] },
  { id: "s05.hydrogen-table", name: "Hydrogen and a periodic table with C and O", order: 5, requires: ["s04.stable-atoms"] },
  { id: "s06.chemistry", name: "Ordered chemistry (molecules, water)", order: 6, requires: ["s05.hydrogen-table"] },
  { id: "s07g.galaxies", name: "Galaxies (gravitationally bound structures)", order: 7, requires: ["s03.orbits-atoms-gravity"] },
  { id: "s07.stars", name: "Stars", order: 8, requires: ["s03.orbits-atoms-gravity", "s04.stable-atoms", "s07g.galaxies"] },
  { id: "s08.fusion-hoyle", name: "Fusion chain and carbon/oxygen (Hoyle)", order: 9, requires: ["s07.stars"] },
  { id: "s09.planets", name: "Planets with long stable climates", order: 10, requires: ["s03.orbits-atoms-gravity", "s07.stars"] },
  { id: "s10.records", name: "Records and memory (arrow of time)", order: 11, requires: ["s01.predictable-laws", "s04.stable-atoms"] },
  { id: "s11.life", name: "Life", order: 12, requires: ["s06.chemistry", "s08.fusion-hoyle", "s09.planets", "s10.records"] },
  { id: "s12.minds", name: "Minds", order: 13, requires: ["s11.life"] },
  { id: "s13.carers", name: "Beings who can care", order: 14, requires: ["s12.minds"] },
];
// END GENERATED STAGES

const RANK = { PASS: 0, OPEN: 1, WEAK: 2, CONTESTED: 3, FAIL: 4 };
const VERDICT_OF = { PASS: "ok", OPEN: "ok", WEAK: "ok", CONTESTED: "CONTESTED", FAIL: "FAIL", BLOCKED: "BLOCKED" };

export function normalizeDials(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const n = r.dimensions ?? r.n ?? OURS.dimensions;
  const a = r.alpha ?? OURS.alpha;
  const b = r.beta ?? OURS.beta;
  const s = r.strong ?? r.s ?? OURS.strong;
  const arrow = r.arrow ?? OURS.arrow;
  const L = r.cosmological_constant ?? r["cosmological-constant"] ?? r.lambda ?? r.Lambda ?? OURS.cosmological_constant;
  return {
    dimensions: Math.round(Number(n)),
    alpha: Number(a),
    beta: Number(b),
    strong: Number(s),
    arrow: Math.round(Number(arrow)),
    cosmological_constant: Number(L),
  };
}

// ---- derive.py numeric ports (LOCKED §2) ----
export function A_of_Z(Z) {
  let lo = Z, hi = 4 * Z + 10;
  for (let i = 0; i < 60; i++) {
    const A = (lo + hi) / 2;
    const z = A / 2 - (0.2 * A * A) / (A + 200);
    if (z < Z) lo = A;
    else hi = A;
  }
  return (lo + hi) / 2;
}

export function Z_fis(alpha, s) {
  const crit = (2 * AS_MEV * (1 + s)) / ((AC_MEV * alpha) / A0_DERIVE);
  let Z = 1;
  while (Z < 2000 && (Z * Z) / A_of_Z(Z) < crit) Z++;
  return Z - 1;
}

export function table(alpha, s) {
  const zd = Math.floor(1 / alpha);
  const zc = Math.floor(1.24 / alpha);
  const zf = Z_fis(alpha, s);
  return { alpha, s, Z_dirac: zd, Z_cr: zc, Z_fis: zf, L: Math.min(zc, zf), L_point: Math.min(zd, zf) };
}

export function thresh(Zneed, s, useCr = true) {
  let lo = 1e-4, hi = 1.0;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    const t = table(m, s);
    const L = useCr ? t.L : t.L_point;
    if (L >= Zneed) lo = m;
    else hi = m;
  }
  return lo;
}

export function r_crit(Qv, Ev, beta) {
  return (beta * MP_MEV - Qv) / Ev;
}

export function d3_row(alpha) {
  return { alpha, a0_rel: A0_DERIVE / alpha, Ry_rel: (alpha / A0_DERIVE) ** 2, v_over_c: alpha };
}

export function d6_ours() {
  const ks = { Adams2019: K_ADAMS, Tegmark1998: K_TEGMARK, Barnes2012: K_BARNES };
  const out = {};
  for (const [k, v] of Object.entries(ks)) {
    out[k] = { beta_min: v * A0_DERIVE ** 2, margin: B0_DERIVE / (v * A0_DERIVE ** 2) };
  }
  out.alpha2beta = { value: A0_DERIVE ** 2 * B0_DERIVE, min: BARRIER, margin: (A0_DERIVE ** 2 * B0_DERIVE) / BARRIER };
  return out;
}

export function d6_alpha_max_at_our_beta() {
  return {
    Adams2019: Math.sqrt(B0_DERIVE / K_ADAMS),
    Tegmark1998: Math.sqrt(B0_DERIVE / K_TEGMARK),
    Barnes2012: Math.sqrt(B0_DERIVE / K_BARNES),
  };
}

export function d9() {
  const dQ = DQ_HYPOT, dE = DE_HYPOT;
  const rc = (Qv, Ev) => r_crit(Qv, Ev, B0_DERIVE);
  return {
    dQ, dE,
    r_crit_central: rc(Q_NP, E_NP),
    r_crit_lo: rc(Q_NP - dQ, E_NP - dE),
    r_crit_hi: rc(Q_NP + dQ, E_NP + dE),
    alpha_crit_central: A0_DERIVE * rc(Q_NP, E_NP),
    lattice_mn_mp_ours: Q_NP + E_NP,
    beta_crit_at_alpha0: (Q_NP + E_NP) / MP_MEV,
  };
}

export function d7() {
  const J = KB * 300 * Math.log(2);
  return { D7_landauer_300K_J: J, D7_eV: J / QE };
}

export function derivedTables() {
  const D3_ALPHAS = [1e-4, 1e-3, 1 / 137.036, 0.02, 0.05, 0.1, 0.2, 1 / 3, 0.5];
  const d7v = d7();
  return {
    D1: D1_TABLE,
    D2_ground_vs_cutoff: D2_TABLE,
    D3: D3_ALPHAS.map(d3_row),
    D5_ours: table(A0_DERIVE, 0),
    D5_grid: [A0_DERIVE, 0.02, 0.05, 0.1, 1 / 8, 0.2].flatMap((a) => [0, -0.2, 0.3].map((s) => table(a, s))),
    D5_alpha_max_for_O: { finite_size: thresh(8, 0, true), point: thresh(8, 0, false) },
    D5_alpha_max_for_C: { finite_size: thresh(6, 0, true), point: thresh(6, 0, false) },
    D5_alpha_max_for_Fe: { finite_size: thresh(26, 0, true), point: thresh(26, 0, false) },
    D6_ours: d6_ours(),
    D6_alpha_max_at_our_beta: d6_alpha_max_at_our_beta(),
    D6_alpha_min_at_our_beta: Math.sqrt(BARRIER / B0_DERIVE),
    beta_max_ordered: 1 / 81,
    beta_margin_ordered: (1 / 81) / B0_DERIVE,
    D7_landauer_300K_J: d7v.D7_landauer_300K_J,
    D7_eV: d7v.D7_eV,
    D9: d9(),
  };
}

export function hydrogenBox(alpha, beta) {
  const r = alpha / A0_DIAL;
  const corners = [
    [Q_NP - DQ_BOX, E_NP - DE_BOX],
    [Q_NP + DQ_BOX, E_NP + DE_BOX],
    [Q_NP - DQ_BOX, E_NP + DE_BOX],
    [Q_NP + DQ_BOX, E_NP - DE_BOX],
  ].map(([q, e]) => q + e * r);
  return { lo: Math.min(...corners), hi: Math.max(...corners), me: beta * MP_MEV, r };
}

export function lambdaLifetimeGyr(x) {
  if (!(x < 0)) return Infinity;
  return LAMBDA_T0 / Math.sqrt(Math.abs(x));
}

// ---- link tests (LOCKED §3) ----
function linksOf(d) {
  const n = d.dimensions, a = d.alpha, b = d.beta, s = d.strong, arr = d.arrow, L = d.cosmological_constant;
  const box = hydrogenBox(a, b);
  const tab = table(a, s);
  const Ltab = tab.L;
  const xstar = b / (a * a);
  const da = Math.abs(a / A0_DIAL - 1);
  const ds = Math.abs(s);
  const out = [];

  const add = (id, from, to, label, sources, status, reason) => {
    out.push({ id, from, to, label, sources, status, reason });
  };

  add("l.s01.hyperbolic-laws", "s00.rules", "s01.predictable-laws", "IMPORTED", ["tegmark1997"], "PASS",
    "One time dimension (fixed in v0): field equations are hyperbolic, so the present predicts the future. PASS always in v0.");

  add("l.s02.huygens", "s01.predictable-laws", "s02.sharp-signals", "IMPORTED", ["courant-hilbert", "barrow1983"],
    (n === 3 || n === 5) ? "PASS" : "WEAK",
    (n === 3 || n === 5) ? "Odd n >= 3, Huygens' principle holds (sharp signals)."
      : n === 1 ? "n = 1 (no spreading, no inverse-square law)."
        : "Even n (signals leave a tail inside the light cone).");

  add("l.s03.orbit-stability", "s01.predictable-laws", "s03.orbits-atoms-gravity", "DERIVED", ["derive.d1"],
    n === 3 ? "PASS" : n === 2 ? "WEAK" : "FAIL",
    n === 3 ? "PASS n = 3 (circular orbit at a minimum of the effective potential)."
      : n === 4 ? "FAIL n = 4 (no extremum)."
        : n === 5 ? "FAIL n = 5 (only a maximum, at r = 3 test units)."
          : n === 2 ? "WEAK n = 2 (log potential orbits stable, but see gravity link)."
            : "FAIL n = 1 (no sideways direction).");

  add("l.s03.hydrogen-ground-state", "s01.predictable-laws", "s03.orbits-atoms-gravity", "DERIVED", ["derive.d2"],
    n === 3 ? "PASS" : n >= 4 ? "FAIL" : "WEAK",
    n === 3 ? "PASS n = 3: numeric E = -0.2500 test units (exact -1/4)."
      : n === 4 ? "FAIL n = 4 (1/r^2 at the collapse threshold)."
        : n === 5 ? "FAIL n = 5 (energy falls without bound as the core shrinks)."
          : "WEAK n <= 2: everything binds; chemistry unrecognisable (no source; flagged).");

  add("l.s03.gravity-orbits", "s01.predictable-laws", "s03.orbits-atoms-gravity", "IMPORTED", ["tegmark1997"],
    n === 3 ? "PASS" : "FAIL",
    n === 3 ? "Inverse-square gravity with stable planetary orbits."
      : n < 3 ? "FAIL n < 3: no gravitational force (Tegmark 1997)."
        : "FAIL n > 3: no stable planetary orbits and no traditional atoms (Ehrenfest 1917, via Tegmark 1997).");

  add("l.s04.atomic-scales", "s03.orbits-atoms-gravity", "s04.stable-atoms", "DERIVED", ["derive.d3"], "PASS",
    `Informational, always PASS: atom size = ${(A0_DIAL * B0_DIAL) / (a * b)} x ours; Rydberg = ${(a / A0_DIAL) ** 2 * (b / B0_DIAL)} x ours (proton mass fixed).`);

  add("l.s04.nonrelativistic-atoms", "s03.orbits-atoms-gravity", "s04.stable-atoms", "IMPORTED", ["barnes2012", "adams2019"],
    a < 0.2 ? "PASS" : a < 1 / 3 ? "CONTESTED" : "FAIL",
    a < 0.2 ? "PASS alpha < 0.2: ground-state electron speed v/c = alpha."
      : a < 1 / 3 ? "CONTESTED 0.2 <= alpha < 1/3: between Barrow & Tipler (via Barnes 2012) and Adams 2019."
        : "FAIL alpha >= 1/3: relativistic electrons, unstable to pair creation.");

  add("l.s07.coulomb-barrier", "s03.orbits-atoms-gravity", "s07.stars", "IMPORTED", ["adams2019", "adams2008"],
    a * a * b >= BARRIER ? "PASS" : "FAIL",
    a * a * b >= BARRIER ? "Coulomb barrier high enough for slow, steady burning."
      : "FAIL alpha^2*beta < 2.6e-12: Coulomb barrier too low, stars burn their fuel at once.");

  add("l.s07.star-mass-window", "s03.orbits-atoms-gravity", "s07.stars", "DERIVED-UNDER-ASSUMPTION",
    ["derive.d6", "adams2019", "tegmark1998", "barnes2012"],
    xstar >= 1 / 100 ? "PASS" : xstar < K_ADAMS ? "FAIL" : "CONTESTED",
    xstar >= 1 / 100 ? "PASS beta/alpha^2 >= 1/100 (above all three published limits)."
      : xstar < K_ADAMS ? "FAIL below 10^(-8/3): the smallest hydrogen-burning star would outweigh the largest stable one."
        : "CONTESTED between 10^(-8/3) ~ 1/464 and 1/100.");

  add("l.s07g.lambda-galaxies", "s03.orbits-atoms-gravity", "s07g.galaxies", "DERIVED-UNDER-ASSUMPTION",
    ["weinberg1987", "msw1998", "planck2018", "derive.d10"],
    L < LAMBDA_GALAXY ? "PASS" : "FAIL",
    L < LAMBDA_GALAXY ? "PASS below the z~4 galaxy-formation bound (57.5 in dial units), including negative Lambda."
      : "FAIL above the bound: a positive vacuum energy too large stops galaxies forming.");

  add("l.s05.carbon-nuclei", "s04.stable-atoms", "s05.hydrogen-table", "IMPORTED", ["tegmark1998"],
    0.1 * (1 + s) >= 0.3 * Math.sqrt(a) ? "PASS" : "FAIL",
    0.1 * (1 + s) >= 0.3 * Math.sqrt(a)
      ? "Carbon and heavier nuclei hold together (alpha_s >= 0.3*sqrt(alpha), alpha_s = 0.1 scaled by the strong dial)."
      : "FAIL: carbon and heavier nuclei fall apart (Tegmark 1998, citing Barrow & Tipler).");

  add("l.s05.hydrogen-stable", "s04.stable-atoms", "s05.hydrogen-table", "DERIVED-UNDER-ASSUMPTION",
    ["borsanyi2015", "derive.d9"],
    box.lo > box.me ? "PASS" : box.hi < box.me ? "FAIL" : "CONTESTED",
    box.lo > box.me ? `PASS: 1-sigma n-p gap ${box.lo}–${box.hi} MeV exceeds m_e = ${box.me} MeV.`
      : box.hi < box.me ? `FAIL: gap ${box.lo}–${box.hi} MeV is below m_e = ${box.me} MeV.`
        : `CONTESTED: gap ${box.lo}–${box.hi} MeV straddles m_e = ${box.me} MeV.`);

  add("l.s05.table-length", "s04.stable-atoms", "s05.hydrogen-table", "DERIVED-UNDER-ASSUMPTION",
    ["derive.d5", "zeldovich-popov1972", "bohr-wheeler1939", "rohlf1994"],
    Ltab >= 26 ? "PASS" : Ltab >= 8 ? "WEAK" : "FAIL",
    `Periodic table ends at L = ${Ltab} (Z_cr = ${tab.Z_cr}, Z_fis = ${tab.Z_fis}). ` +
      (Ltab >= 26 ? "PASS end >= 26 (iron)." : Ltab >= 8 ? "WEAK 8 <= end < 26 (C and O exist, heavier missing)." : "FAIL end < 8."));

  add("l.s06.nuclei-still", "s05.hydrogen-table", "s06.chemistry", "IMPORTED", ["tegmark1998", "barnes2012", "adams2019"],
    b < 1 / 81 ? "PASS" : b > 81 ? "CONTESTED" : "FAIL",
    b < 1 / 81 ? "PASS beta^(1/4) < 1/3: nuclei sit still inside molecules."
      : b > 81 ? "CONTESTED beta > 81: second window with electron heavier than proton (Adams 2019), chemistry unworked."
        : "FAIL: ordered molecules melt.");

  add("l.s06.water", "s05.hydrogen-table", "s06.chemistry", "IMPORTED", ["adams2019"],
    a <= 10 * A0_DIAL ? "PASS" : "WEAK",
    a <= 10 * A0_DIAL ? "PASS: water energetics shift well under 10%."
      : "WEAK alpha > 10 x ours: O-H bond weakens; roughly a 10% shift (Adams 2019 benchmark).");

  add("l.s08.hoyle-window", "s07.stars", "s08.fusion-hoyle", "IMPORTED",
    ["oberhummer2000", "epelbaum2013", "adams2019", "kragh2010"],
    ds <= 0.005 && da <= 0.02 ? "PASS" : "CONTESTED",
    ds <= 0.005 && da <= 0.02 ? "PASS inside strong +/-0.5% (Oberhummer 2000) and alpha +/-2% (Epelbaum 2013)."
      : ds <= 0.005 && da <= 0.04 ? "CONTESTED alpha 2-4%: outside Epelbaum 2013's window, inside Oberhummer 2000's."
        : "CONTESTED outside the Hoyle window: models predict C or O output drops; Adams 2019 argues viable universes remain.");

  add("l.s08.pp-chain", "s07.stars", "s08.fusion-hoyle", "IMPORTED",
    ["adams2019", "adams-grohs2017", "macdonald-mullan2009", "barnes2012"],
    (s > 0.06 || s < -0.04) ? "CONTESTED" : "PASS",
    s > 0.06 ? "CONTESTED s > 0.06 (diproton may bind; edge +6% square well to +17% Yukawa, Adams 2019). Classic papers: fatal. MacDonald & Mullan 2009: hydrogen survives."
      : s < -0.04 ? "CONTESTED s < -0.04 (deuteron may unbind; edge -4% square well to -6% Yukawa, Adams 2019). Classic papers: no pp chain. Adams & Grohs 2017: stars still work."
        : "PASS: deuteron bound, diproton unbound.");

  add("l.s09.planet-orbits", "s07.stars", "s09.planets", "IMPORTED", ["tegmark1997", "adams2019"],
    n === 3 ? "PASS" : "FAIL",
    n === 3 ? "Stable orbits around long-lived stars only for n = 3." : "No stable planetary orbits.");

  add("l.s11.lambda-lifetime", "s09.planets", "s11.life", "CONTESTED",
    ["barrow-tipler1986", "msw1998", "peacock2007", "planck2018", "derive.d11"],
    L >= LAMBDA_LIFE ? "PASS" : L >= LAMBDA_LIFE_LOOSE ? "CONTESTED" : "FAIL",
    L >= 0 ? "PASS for every positive Lambda."
      : L >= LAMBDA_LIFE ? `PASS under the 13.787 Gyr benchmark (t = ${lambdaLifetimeGyr(L)} Gyr, threshold x >= -7.09).`
        : L >= LAMBDA_LIFE_LOOSE ? "CONTESTED: fails the 13.787 Gyr benchmark but passes the 5 Gyr benchmark (x >= -53.9) stated in the same notes."
          : "FAIL: lifetime shorter than both stated benchmarks (13.787 Gyr and 5 Gyr).");

  add("l.s10.landauer", "s01.predictable-laws", "s10.records", "DERIVED", ["landauer1961", "derive.d7"], "PASS",
    "Each erased record bit costs at least k_B T ln 2 = 0.018 eV at 300 K. Always PASS; a cost, not a gate.");

  add("l.s10.past-traces", "s01.predictable-laws", "s10.records", "IMPORTED", ["rovelli2020", "wolpert1992", "landauer1961"],
    arr >= 1 ? "PASS" : "FAIL",
    arr === 1 ? "arrow = 1: low-entropy past + separated systems + slow thermalisation leave traces of the past (Rovelli 2020)."
      : arr === 0 ? "arrow = 0: no entropy gradient, no traces."
        : "arrow = 2: records form, but the past cannot be recovered even in principle.");

  add("l.s10.toy-arrow", "s01.predictable-laws", "s10.records", "DERIVED", ["derive.us27"],
    arr >= 1 ? "PASS" : "FAIL",
    arr === 1 ? "Toy (lattice gas, 5 seeds): low-entropy start S 0.84 -> 3.26 of max 3.74 with an exact backward echo."
      : arr === 0 ? "Toy: equilibrium start stays at 1.965 (its maximum)."
        : "Toy with 2% noise: S reaches 3.74 and the echo misses 21.6% of sites.");

  add("l.s11.life", "s10.records", "s11.life", "CONJECTURE", [], "OPEN",
    "OPEN. Requires S6, S8, S9, S10. Whether life follows from chemistry, stars, C/O (or substitutes), planets and records is not settled by physics.");

  add("l.s12.minds", "s11.life", "s12.minds", "CONJECTURE", ["rovelli2020"], "OPEN",
    arr === 2
      ? "OPEN. Memory and a model of the future are physically possible; with arrow = 2 the past is lost faster, so minds may lean harder on records."
      : "OPEN. Memory and a model of the future are physically possible.");

  add("l.s13.carers", "s12.minds", "s13.carers", "CONJECTURE", [], "OPEN",
    "OPEN. Caring needs memory, anticipation and a lasting self. At best no physical precondition above has failed (check for CONTESTED ones). The rest is biology and philosophy; no 'ought' is derived from any 'is' here.");

  return out;
}

export function windowsAt(d) {
  const der = derivedTables();
  const tab = table(d.alpha, d.strong);
  const box = hydrogenBox(d.alpha, d.beta);
  const tL = lambdaLifetimeGyr(d.cosmological_constant);
  return {
    derived: der,
    at_dials: {
      atom_size_rel: (A0_DIAL * B0_DIAL) / (d.alpha * d.beta),
      Ry_rel: (d.alpha / A0_DIAL) ** 2 * (d.beta / B0_DIAL),
      v_over_c: d.alpha,
      Z_dirac: tab.Z_dirac,
      Z_cr: tab.Z_cr,
      Z_fis: tab.Z_fis,
      L: tab.L,
      L_point: tab.L_point,
      beta_over_alpha2: d.beta / (d.alpha * d.alpha),
      alpha2_beta: d.alpha * d.alpha * d.beta,
      mn_mp_lo: box.lo,
      mn_mp_hi: box.hi,
      me: box.me,
      lambda_lifetime_Gyr: Number.isFinite(tL) ? tL : null,
    },
    margins_at_ours: {
      beta_chemistry: (1 / 81) / B0_DIAL,
      beta_stars_Adams2019: der.D6_ours.Adams2019.margin,
      beta_stars_Tegmark1998: der.D6_ours.Tegmark1998.margin,
      beta_stars_Barnes2012: der.D6_ours.Barnes2012.margin,
      alpha2beta_barrier: der.D6_ours.alpha2beta.margin,
      lambda_galaxy: LAMBDA_GALAXY / 1,
    },
    thresholds: {
      alpha_max_O: der.D5_alpha_max_for_O,
      alpha_max_C: der.D5_alpha_max_for_C,
      alpha_max_Fe: der.D5_alpha_max_for_Fe,
      D6_alpha_max_at_our_beta: der.D6_alpha_max_at_our_beta,
      D6_alpha_min_at_our_beta: der.D6_alpha_min_at_our_beta,
      beta_max_ordered: 1 / 81,
      lambda_galaxy: LAMBDA_GALAXY,
      lambda_lifetime: LAMBDA_LIFE,
      lambda_lifetime_loose: LAMBDA_LIFE_LOOSE,
    },
  };
}

export function evaluate(raw) {
  const d = normalizeDials(raw);
  const linkRows = linksOf(d);
  const byTo = {};
  for (const s of STAGES) byTo[s.id] = [];
  for (const ln of linkRows) {
    if (byTo[ln.to]) byTo[ln.to].push(ln);
  }
  // s00 has no incoming links; it is the chosen rules and always PASS.
  const stageMap = {};
  const ordered = [...STAGES].sort((a, b) => a.order - b.order);
  for (const s of ordered) {
    const lines = s.id === "s00.rules"
      ? [{ id: "s00.rules", from: null, to: s.id, label: "ASSUMED", sources: [], status: "PASS", reason: "Dial settings are chosen, not derived." }]
      : byTo[s.id];
    const own = lines.reduce((w, l) => (RANK[l.status] > RANK[w] ? l.status : w), "PASS");
    const ups = s.requires.map((p) => stageMap[p]);
    const blocked = ups.some((u) => u && (u.status === "FAIL" || u.status === "BLOCKED"));
    const upContested = ups.some((u) => u && (u.status === "CONTESTED" || u.upContested));
    const status = blocked ? "BLOCKED" : own;
    stageMap[s.id] = {
      id: s.id,
      name: s.name,
      order: s.order,
      requires: s.requires,
      status,
      verdict: VERDICT_OF[status],
      upContested,
      links: lines,
      honesty: [...new Set(lines.map((l) => l.label))],
      sources: [...new Set(lines.flatMap((l) => l.sources))],
    };
  }
  const stages = ordered.map((s) => stageMap[s.id]);
  return { dials: d, stages, links: linkRows, windows: windowsAt(d) };
}

// ---- sampling helpers ----
export function logspace(lo, hi, n, snap) {
  const a = Math.log(lo), b = Math.log(hi);
  const xs = [];
  for (let i = 0; i < n; i++) xs.push(Math.exp(a + (i / (n - 1)) * (b - a)));
  if (snap != null && snap >= lo && snap <= hi) {
    let j = 0, best = Infinity;
    for (let i = 0; i < xs.length; i++) {
      const e = Math.abs(Math.log(xs[i]) - Math.log(snap));
      if (e < best) { best = e; j = i; }
    }
    xs[j] = snap;
  }
  xs[0] = lo; xs[n - 1] = hi;
  return xs;
}

export function linspace(lo, hi, n, include) {
  const xs = [];
  for (let i = 0; i < n; i++) xs.push(lo + (i / (n - 1)) * (hi - lo));
  if (include) {
    for (const v of include) {
      if (v < lo || v > hi) continue;
      if (xs.some((x) => x === v)) continue;
      let j = 0, best = Infinity;
      for (let i = 0; i < xs.length; i++) {
        const e = Math.abs(xs[i] - v);
        if (e < best) { best = e; j = i; }
      }
      // do not overwrite endpoints if v is not an endpoint and they are already reserved? lock says force-include
      xs[j] = v;
    }
  }
  return xs;
}

export function symlogForward(x, linthresh = 1) {
  const s = Math.sign(x) || 1;
  const ax = Math.abs(x);
  if (ax <= linthresh) return x / linthresh; // [-1,1] linear
  return s * (1 + Math.log10(ax / linthresh));
}
export function symlogInverse(u, linthresh = 1) {
  const s = Math.sign(u) || 1;
  const au = Math.abs(u);
  if (au <= 1) return u * linthresh;
  return s * linthresh * 10 ** (au - 1);
}
export function symlogspace(lo, hi, n, include, linthresh = 1) {
  const u0 = symlogForward(lo, linthresh), u1 = symlogForward(hi, linthresh);
  const us = [];
  for (let i = 0; i < n; i++) us.push(u0 + (i / (n - 1)) * (u1 - u0));
  let xs = us.map((u) => symlogInverse(u, linthresh));
  if (include) {
    for (const v of include) {
      if (v < lo || v > hi) continue;
      const tv = symlogForward(v, linthresh);
      let j = 0, best = Infinity;
      for (let i = 0; i < xs.length; i++) {
        const e = Math.abs(symlogForward(xs[i], linthresh) - tv);
        if (e < best) { best = e; j = i; }
      }
      xs[j] = v;
    }
  }
  xs[0] = lo; xs[n - 1] = hi;
  return xs;
}

function axisSamples(dialId, n, includeExtra) {
  const def = DIAL_DEFS.find((x) => x.id === dialId || (dialId === "cosmological-constant" && x.id === "cosmological_constant"));
  if (!def) throw new Error("unknown dial " + dialId);
  const id = def.id;
  if (def.scale === "discrete") {
    const lo = def.range[0], hi = def.range[1];
    const xs = [];
    for (let k = lo; k <= hi; k++) xs.push(k);
    return { id, scale: def.scale, values: xs, def };
  }
  if (id === "cosmological_constant") {
    const must = [-1000, -53.9, -7.09, -1, 0, 1, 57.5, 100, 1000].concat(includeExtra || []);
    return { id, scale: "symlog", values: symlogspace(def.range[0], def.range[1], n, must), def };
  }
  if (def.scale === "log") {
    const snap = def.default;
    return { id, scale: "log", values: logspace(def.range[0], def.range[1], n, snap), def };
  }
  return { id, scale: "linear", values: linspace(def.range[0], def.range[1], n, [def.default].concat(includeExtra || [])), def };
}

const FEATURED = ["s03.orbits-atoms-gravity", "s05.hydrogen-table", "s07.stars", "s07g.galaxies"];
const REGION_OF = { PASS: "ok", WEAK: "weak", OPEN: "open", CONTESTED: "contested", FAIL: "fail", BLOCKED: "blocked" };

function summarise(ev, featured) {
  const ids = featured || FEATURED;
  const st = ev.stages.filter((s) => ids.includes(s.id));
  let worst = "PASS", worstRank = -1;
  for (const s of st) {
    const r = s.status === "BLOCKED" ? 5 : RANK[s.status];
    if (r > worstRank) { worstRank = r; worst = s.status; }
  }
  let gov = null, govRank = -1;
  for (const s of st) {
    for (const l of s.links) {
      const r = RANK[l.status] ?? -1;
      if (r > govRank || (r === govRank && gov && l.id < gov.id)) {
        govRank = r; gov = l;
      }
    }
  }
  const byId = Object.fromEntries(ev.stages.map((s) => [s.id, { status: s.status, verdict: s.verdict }]));
  return {
    region: REGION_OF[worst] || worst,
    worst_status: worst,
    governing: gov ? { id: gov.id, status: gov.status, label: gov.label, sources: gov.sources } : null,
    featured: Object.fromEntries(st.map((s) => [s.id, { status: s.status, verdict: s.verdict }])),
    stages: byId,
  };
}

function isOursOthers(hold, xId, yId) {
  const keys = ["dimensions", "alpha", "beta", "strong", "arrow", "cosmological_constant"];
  for (const k of keys) {
    if (k === xId || k === yId) continue;
    if (hold[k] !== OURS[k]) return false;
  }
  return true;
}

export function dialPairGrid(xDial, yDial, opts = {}) {
  const nx = opts.nx ?? 41;
  const ny = opts.ny ?? 41;
  const hold = normalizeDials(opts.hold || OURS);
  const featured = opts.featured || FEATURED;
  const xs = axisSamples(xDial, nx);
  const ys = axisSamples(yDial, ny);
  const cells = [];
  for (let j = 0; j < ys.values.length; j++) {
    for (let i = 0; i < xs.values.length; i++) {
      const d = { ...hold, [xs.id]: xs.values[i], [ys.id]: ys.values[j] };
      const ev = evaluate(d);
      const sum = summarise(ev, featured);
      cells.push({
        i, j,
        x: xs.values[i],
        y: ys.values[j],
        region: sum.region,
        worst_status: sum.worst_status,
        label: sum.governing ? sum.governing.label : null,
        governing: sum.governing,
        featured: sum.featured,
      });
    }
  }
  const oursOnPlane = isOursOthers(hold, xs.id, ys.id);
  return {
    x: { id: xs.id, scale: xs.scale, values: xs.values, symbol: xs.def.symbol, range: xs.def.range },
    y: { id: ys.id, scale: ys.scale, values: ys.values, symbol: ys.def.symbol, range: ys.def.range },
    cells,
    ours: { x: OURS[xs.id], y: OURS[ys.id], on_plane: oursOnPlane },
    featured,
    hold,
  };
}

export function alphaBetaGrid(opts = {}) {
  return dialPairGrid("alpha", "beta", opts);
}

export function lambdaLine(opts = {}) {
  const n = opts.n ?? 161;
  const hold = normalizeDials(opts.hold || OURS);
  const ax = axisSamples("cosmological_constant", n);
  const points = ax.values.map((x) => {
    const ev = evaluate({ ...hold, cosmological_constant: x });
    const g = ev.stages.find((s) => s.id === "s07g.galaxies");
    const life = ev.stages.find((s) => s.id === "s11.life");
    return {
      x,
      t_Gyr: x < 0 ? lambdaLifetimeGyr(x) : null,
      galaxies: g ? { status: g.status, verdict: g.verdict } : null,
      life: life ? { status: life.status, verdict: life.verdict } : null,
      region: summarise(ev, ["s07g.galaxies", "s11.life"]).region,
    };
  });
  return {
    scale: "symlog",
    values: ax.values,
    points,
    thresholds: [
      { x: LAMBDA_GALAXY, kind: "galaxy-formation", label: "DERIVED-UNDER-ASSUMPTION", sources: ["weinberg1987", "msw1998", "planck2018", "derive.d10"], link: "l.s07g.lambda-galaxies" },
      { x: LAMBDA_LIFE, kind: "recollapse-13.787Gyr", label: "CONTESTED", sources: ["barrow-tipler1986", "msw1998", "peacock2007", "planck2018", "derive.d11"], link: "l.s11.lambda-lifetime" },
      { x: LAMBDA_LIFE_LOOSE, kind: "recollapse-5Gyr", label: "CONTESTED", sources: ["barrow-tipler1986", "msw1998", "peacock2007", "planck2018", "derive.d11"], link: "l.s11.lambda-lifetime" },
    ],
    ours: { x: 1, on_plane: hold.dimensions === 3 && hold.alpha === A0_DIAL && hold.beta === B0_DIAL && hold.strong === 0 && hold.arrow === 1 },
    hold,
  };
}

export function dialStrips(opts = {}) {
  const n = opts.n ?? 81;
  const hold = normalizeDials(opts.hold || OURS);
  const strips = DIAL_DEFS.map((def) => {
    const ax = axisSamples(def.id, n);
    const points = ax.values.map((v) => {
      const ev = evaluate({ ...hold, [def.id]: v });
      return {
        x: v,
        stages: Object.fromEntries(ev.stages.map((s) => [s.id, s.status])),
        verdicts: Object.fromEntries(ev.stages.map((s) => [s.id, s.verdict])),
      };
    });
    const switches = {};
    for (const s of STAGES) {
      const sw = [];
      for (let i = 1; i < points.length; i++) {
        if (points[i].stages[s.id] !== points[i - 1].stages[s.id]) {
          sw.push({ from: points[i - 1].x, to: points[i].x, was: points[i - 1].stages[s.id], now: points[i].stages[s.id] });
        }
      }
      switches[s.id] = sw;
    }
    return { id: def.id, symbol: def.symbol, scale: ax.scale, range: def.range, values: ax.values, points, switches, ours: OURS[def.id] };
  });
  return { strips, hold };
}

export function dimensionPanel(opts = {}) {
  const hold = normalizeDials(opts.hold || OURS);
  const rows = [1, 2, 3, 4, 5].map((n) => {
    const ev = evaluate({ ...hold, dimensions: n });
    const pick = (id) => ev.links.find((l) => l.id === id);
    const st = (id) => ev.stages.find((s) => s.id === id);
    return {
      n,
      orbit_stability: pick("l.s03.orbit-stability"),
      hydrogen_ground_state: pick("l.s03.hydrogen-ground-state"),
      gravity_orbits: pick("l.s03.gravity-orbits"),
      huygens: pick("l.s02.huygens"),
      planet_orbits: pick("l.s09.planet-orbits"),
      s02: st("s02.sharp-signals") && { status: st("s02.sharp-signals").status, verdict: st("s02.sharp-signals").verdict },
      s03: st("s03.orbits-atoms-gravity") && { status: st("s03.orbits-atoms-gravity").status, verdict: st("s03.orbits-atoms-gravity").verdict },
      s09: st("s09.planets") && { status: st("s09.planets").status, verdict: st("s09.planets").verdict },
    };
  });
  return {
    note: "Stable planetary orbits and traditional atoms only at n = 3 (existing links l.s03.gravity-orbits, l.s03.orbit-stability, l.s03.hydrogen-ground-state, l.s09.planet-orbits).",
    ours: 3,
    rows,
    hold,
  };
}

export function run(dialValues) {
  const d = normalizeDials(dialValues);
  const ev = evaluate(d);
  const featuredIds = FEATURED;
  const strip = ev.stages.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    verdict: s.verdict,
    honesty: s.honesty,
    sources: s.sources,
    on: s.verdict === "ok",
    featured: featuredIds.includes(s.id),
  }));
  return {
    id,
    dialBoard: {
      dials: d,
      ours: { ...OURS },
      windows: ev.windows,
      stages: ev.stages,
      links: ev.links,
    },
    universeMap: dialPairGrid("alpha", "beta", { hold: d, nx: 41, ny: 41 }),
    stageStrip: { stages: strip, featured: featuredIds },
    lattice: null,
  };
}

export default { id, cards, dials, run, evaluate, dialPairGrid, alphaBetaGrid, lambdaLine, dialStrips, dimensionPanel, derivedTables, OURS };
