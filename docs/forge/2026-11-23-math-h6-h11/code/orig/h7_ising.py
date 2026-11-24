"""H7: +/-1 Ising, Kramers-Wannier self-dual point, and the D2 (charge-conserving, M=0) ensemble.
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

def run(commit):
    Ls = (16, 24, 32, 48); Ks = list(np.round(np.arange(0.40, 0.4801, 0.004), 3))
    res = {"locked_commit": commit, "Ks": Ks, "U": {}, "SE": {}}
    for L in Ls:
        Us, SEs = [], []
        for K in Ks:
            S = np.concatenate([measure(L, K, "kawasaki", 10000, 100000, 1, 1000*L + seed) for seed in (1, 2)])
            blocks = np.array_split(S, 20); ub = [U_stripe(b) for b in blocks]
            Us.append(U_stripe(S)); SEs.append(np.std(ub, ddof=1) / math.sqrt(20))
        res["U"][L] = Us; res["SE"][L] = SEs
    pairs = ((16, 24), (24, 32), (32, 48)); xs = []
    for a, b in pairs:
        xs.append(crossing(Ks, res["U"][a], res["U"][b]))
    res["crossings"] = dict(zip([f"{a}-{b}" for a, b in pairs], xs))
    Leff = np.array([math.sqrt(a*b) for a, b in pairs]); xs = np.array(xs)
    fits = {}
    for w in (1, 2):
        X = np.vstack([np.ones(3), Leff**-w]).T; coef, *_ = np.linalg.lstsq(X, xs, rcond=None)
        resid = xs - X @ coef; se = math.sqrt(max(resid @ resid, 1e-12) / 1 * np.linalg.inv(X.T @ X)[0, 0])
        fits[w] = {"K_inf": float(coef[0]), "SE": se}
    res["fits"] = fits
    ok = [abs(f["K_inf"] - KC) <= max(3*f["SE"], 0.005) for f in fits.values()]
    excl = [abs(f["K_inf"] - KC) > max(3*f["SE"], 0.005) for f in fits.values()]
    v = "REDUCES-TO-KNOWN" if all(ok) else ("SURVIVED (D2 shifts K_c; requires L=64 replication before any claim)" if all(excl) else "NOT-TESTABLE-YET")
    res["verdict"] = v; os.makedirs("../out", exist_ok=True)
    json.dump(res, open("../out/h7_result.json", "w"), indent=1, default=float); print("VERDICT:", v)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--instrument", action="store_true"); ap.add_argument("--locked-commit")
    a = ap.parse_args()
    if a.instrument: instrument()
    elif a.locked_commit: run(a.locked_commit)
    else: sys.exit("refusing: --instrument, or --locked-commit <sha> after the H7 lock is committed")
