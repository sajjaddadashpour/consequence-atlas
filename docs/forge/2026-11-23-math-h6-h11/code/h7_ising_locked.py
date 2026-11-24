"""H7 LOCKED (Physicist lock 2026-11-23; derived from orig/h7_ising.py, instrument() and measure() unchanged). H7: +/-1 Ising, Kramers-Wannier self-dual point, and the D2 (charge-conserving, M=0) ensemble.
  --instrument : canonical Metropolis Binder crossing near Onsager K_c (KNOWN answer) + Kawasaki U limits far from K_c.
  --locked-commit <sha> : DECISIVE fixed-M=0 run (do not execute before the H7 lock is committed).
"""
import argparse, json, math, os, sys, time
import numpy as np
from numba import njit

KC = 0.5 * math.log(1 + math.sqrt(2))  # Onsager / KW self-dual point, sinh(2K)=1

@njit(cache=True)
def nbsum(s, x, y, L):
    return s[(x+1) % L, y] + s[(x-1) % L, y] + s[x, (y+1) % L] + s[x, (y-1) % L]

@njit(cache=True)
def metropolis(s, K, sweeps, seed):
    np.random.seed(seed); L = s.shape[0]
    for _ in range(sweeps * L * L):
        x = np.random.randint(L); y = np.random.randint(L)
        dE = 2.0 * K * s[x, y] * nbsum(s, x, y, L)
        if dE <= 0 or np.random.random() < math.exp(-dE):
            s[x, y] = -s[x, y]

@njit(cache=True)
def kawasaki_nonlocal(s, K, sweeps, seed):
    """Exchange a random (+,-) pair anywhere: samples the fixed-magnetization canonical ensemble."""
    np.random.seed(seed); L = s.shape[0]
    for _ in range(sweeps * L * L):
        x1 = np.random.randint(L); y1 = np.random.randint(L)
        x2 = np.random.randint(L); y2 = np.random.randint(L)
        if s[x1, y1] == s[x2, y2]: continue
        dE = 2.0 * K * (s[x1, y1] * nbsum(s, x1, y1, L) + s[x2, y2] * nbsum(s, x2, y2, L))
        adj = ((x1 == x2) and ((y1 - y2) % L == 1 or (y2 - y1) % L == 1)) or \
              ((y1 == y2) and ((x1 - x2) % L == 1 or (x2 - x1) % L == 1))
        if adj: dE += 4.0 * K
        if dE <= 0 or np.random.random() < math.exp(-dE):
            s[x1, y1] = -s[x1, y1]; s[x2, y2] = -s[x2, y2]

def stripe_S(s):
    L = s.shape[0]; ph = np.exp(2j * np.pi * np.arange(L) / L)
    mx = (s.sum(axis=1) * ph).sum() / L**2; my = (s.sum(axis=0) * ph).sum() / L**2
    return abs(mx)**2 + abs(my)**2

def measure(L, K, mode, therm, meas, every, seed):
    rng = np.random.default_rng(seed)
    if mode == "canonical":
        s = rng.choice(np.array([-1, 1], dtype=np.int64), size=(L, L)); step = metropolis
    else:
        flat = np.array([1] * (L*L//2) + [-1] * (L*L//2), dtype=np.int64); rng.shuffle(flat); s = flat.reshape(L, L); step = kawasaki_nonlocal
    step(s, K, therm, seed)
    obs = []
    for t in range(meas // every):
        step(s, K, every, seed + 1 + t)
        obs.append(s.mean() if mode == "canonical" else stripe_S(s))
    return np.array(obs)

def U_canon(m): m2 = np.mean(m**2); return 1 - np.mean(m**4) / (3 * m2**2)
def U_stripe(S): return 2 - np.mean(S**2) / np.mean(S)**2

def crossing(K, Ua, Ub):
    d = np.array(Ua) - np.array(Ub)
    for i in range(len(K) - 1):
        if d[i] == 0: return K[i]
        if d[i] * d[i+1] < 0: return K[i] - d[i] * (K[i+1] - K[i]) / (d[i+1] - d[i])
    return float("nan")

def instrument():
    out = {}
    Ks = [0.425, 0.43, 0.435, 0.44, 0.445, 0.45, 0.455]
    U = {}
    for L in (8, 16, 32):
        U[L] = [U_canon(measure(L, K, "canonical", 2000, 20000, 2, 11 + L)) for K in Ks]
        print(f"canonical L={L}: U4 =", np.round(U[L], 4))
    for a, b in ((8, 16), (16, 32)):
        c = crossing(Ks, U[a], U[b]); out[f"cross_{a}_{b}"] = c
        print(f"  Binder crossing L={a},{b}: K = {c:.4f}   (Onsager/KW K_c = {KC:.6f}, diff {c-KC:+.4f})")
    for K in (0.2, 0.8):
        S = measure(16, K, "kawasaki", 2000, 20000, 2, 5)
        print(f"Kawasaki M=0, L=16, K={K}: U_stripe = {U_stripe(S):.3f}  (known limit {'0.5 Gaussian' if K<KC else '1.0 ordered stripe'})")
    print("KW check: sinh(2*K_c) =", math.sinh(2*KC), "; dual of K_c:", -0.5*math.log(math.tanh(KC)))

# ---------------- LOCKED run (Physicist lock 2026-11-23; replaces orig/h7_ising.py run()) ----------------
# Changes vs orig (made BEFORE the lock commit; see H7-LOCK.md section 4):
#  (1) seeds: orig used seed = 1000*L + s and reseeded every sweep with seed+1+t, so seed 1 and seed 2 replayed the same
#      random stream shifted by one sweep, and streams overlapped across L. Now every (ensemble, L, K, s) run gets its own
#      base, spaced 200_003 apart (> 10^5 + 2 reseeds per run), so no two runs share a stream.
#  (2) same-code canonical control: identical L, K grid, sweeps, crossing and extrapolation, using Metropolis + Binder U4.
#  (3) verdict vocabulary: house verdicts only; precision guard; NaN crossings -> NOT-TESTABLE-YET.
LS = (16, 24, 32, 48); KS = [round(0.400 + 0.004 * i, 3) for i in range(21)]
THERM, MEAS, EVERY, SEEDS, NBLK = 10000, 100000, 1, (1, 2), 20
PAIRS = ((16, 24), (24, 32), (32, 48)); TOL_FLOOR = 0.005; PREC_CAP = 0.02
GATE_SEEN = {"cross_16_32": 0.4424, "diff": +0.0017}   # instrument gate, run by Mathematician before the lock (SEEN)

def base_seed(mode, li, ki, s):
    return ((((mode * 4 + li) * 21 + ki) * 2 + (s - 1)) + 1) * 200_003

def pipeline(mode):
    U, SE = {}, {}
    for li, L in enumerate(LS):
        Us, SEs = [], []
        for ki, K in enumerate(KS):
            obs = np.concatenate([measure(L, K, "kawasaki" if mode == 0 else "canonical", THERM, MEAS, EVERY, base_seed(mode, li, ki, s)) for s in SEEDS])
            f = U_stripe if mode == 0 else U_canon
            blocks = np.array_split(obs, NBLK); ub = [f(b) for b in blocks]
            Us.append(float(f(obs))); SEs.append(float(np.std(ub, ddof=1) / math.sqrt(NBLK)))
            print(f"  mode={'M0-kawasaki' if mode == 0 else 'canonical'} L={L} K={K}: U={Us[-1]:.4f} +- {SEs[-1]:.4f}", flush=True)
        U[L], SE[L] = Us, SEs
    xs = np.array([crossing(KS, U[a], U[b]) for a, b in PAIRS])
    Leff = np.array([math.sqrt(a * b) for a, b in PAIRS]); fits = {}
    for w in (1, 2):
        if np.any(np.isnan(xs)): fits[w] = {"K_inf": float("nan"), "SE": float("nan")}; continue
        X = np.vstack([np.ones(3), Leff ** -w]).T; coef, *_ = np.linalg.lstsq(X, xs, rcond=None)
        resid = xs - X @ coef; se = math.sqrt(max(resid @ resid, 1e-12) / 1 * np.linalg.inv(X.T @ X)[0, 0])
        fits[w] = {"K_inf": float(coef[0]), "SE": float(se)}
    return {"U": U, "SE": SE, "crossings": dict(zip([f"{a}-{b}" for a, b in PAIRS], xs.tolist())), "fits": fits}

def classify(fits):
    """EQUIVALENT / SHIFTED / MIXED / IMPRECISE for one ensemble. tol = max(3*SE_fit, 0.005)."""
    st = []
    for f in fits.values():
        if not np.isfinite(f["K_inf"]) or 3 * f["SE"] > PREC_CAP: return "IMPRECISE"
        st.append(abs(f["K_inf"] - KC) <= max(3 * f["SE"], TOL_FLOOR))
    return "EQUIVALENT" if all(st) else ("SHIFTED" if not any(st) else "MIXED")

def run(commit):
    res = {"locked_commit": commit, "Ks": KS, "Ls": LS, "gate_seen": GATE_SEEN}
    print("canonical control (same code):", flush=True); res["canonical"] = pipeline(1)
    print("fixed M=0 (D2) Kawasaki:", flush=True); res["M0"] = pipeline(0)
    cc = classify(res["canonical"]["fits"]); cm = classify(res["M0"]["fits"]); res["class"] = {"canonical": cc, "M0": cm}
    if cc != "EQUIVALENT": v = "NOT-TESTABLE-YET (same-code canonical control did not recover K_c: " + cc + ")"
    elif cm == "EQUIVALENT": v = "REDUCES-TO-KNOWN"
    elif cm == "SHIFTED": v = "SURVIVED (provisional: D2 ensemble shifts K_c; L=64 replication required before any atlas claim)"
    else: v = "NOT-TESTABLE-YET (" + cm + ")"
    res["verdict"] = v; os.makedirs("../out", exist_ok=True)
    json.dump(res, open("../out/h7_result.json", "w"), indent=1, default=float); print("CLASS:", res["class"], "\nVERDICT:", v)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--instrument", action="store_true"); ap.add_argument("--locked-commit")
    a = ap.parse_args()
    if a.instrument: instrument()
    elif a.locked_commit: run(a.locked_commit)
    else: sys.exit("refusing: --instrument, or --locked-commit <sha> after the H7 lock is committed")
