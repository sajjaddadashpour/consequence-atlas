"""H8 LOCKED (Physicist lock 2026-11-23; derived from orig/h8_berry.py; theory functions and instrument() unchanged). H8: Berry (1988) number variance of Riemann zeros predicted from primes.
  --instrument : reproduce Berry's own quoted numbers (theory side) + GUE matrices vs exact GUE Sigma^2.
  --locked-commit <sha> : DECISIVE comparison on Odlyzko windows (downloads its own copies to ../data).
Formula (reconstructed from Berry 1988 eqs 9,14-21; checked against his quoted 0.4663 / 0.4659):
 V(L) = V_GUE(L) - (1/pi^2)[ln(2 pi L tau*) + gamma - Ci(2 pi L tau*)]
        + (2/pi^2) sum_{p^r <= (E/2pi)^tau*} sin^2(pi L r ln p / ln(E/2pi)) / (r^2 p^r)
 V_GUE(L) = (1/pi^2)[ln(2 pi L) + gamma + 1 - cos(2 pi L) - Ci(2 pi L)] + L[1 - (2/pi) Si(2 pi L)]
"""
import argparse, json, math, os, sys, hashlib, re, urllib.request
import numpy as np
from scipy.special import sici
from sympy import primerange

G_E = 0.5772156649015329

def V_gue(L):
    L = np.asarray(L, float); si, ci = sici(2*np.pi*L)
    return (np.log(2*np.pi*L) + G_E + 1 - np.cos(2*np.pi*L) - ci) / np.pi**2 + L * (1 - 2/np.pi*si)

def prime_powers(X, primes):
    out = []
    for p in primes:
        r = 1
        while p**r <= X:
            out.append((p, r)); r += 1
    return out

def V_berry(L, E, tau=0.25, primes=None):
    lnE = math.log(E/(2*np.pi)); X = math.exp(tau*lnE)
    if primes is None: primes = list(primerange(2, int(X)+1))
    pr = prime_powers(X, primes)
    L = np.asarray(L, float); s = np.zeros_like(L)
    for p, r in pr:
        s += np.sin(np.pi*L*r*math.log(p)/lnE)**2 / (r*r*p**r)
    si, ci = sici(2*np.pi*L*tau)
    return V_gue(L) - (np.log(2*np.pi*L*tau) + G_E - ci)/np.pi**2 + 2*s/np.pi**2

def cramer_primes(X, rng):
    ps = [2] + [m for m in range(3, int(X)+1) if rng.random() < 1/math.log(m)]
    return ps

def sigma2(x, Ls, ngrid=20000):
    x = np.sort(x); out = []
    for L in Ls:
        x0 = np.linspace(x[0], x[-1]-L, ngrid)
        n = np.searchsorted(x, x0+L) - np.searchsorted(x, x0)
        out.append(np.mean((n-L)**2))
    return np.array(out)

def instrument():
    E = 2.677e11; lnE = math.log(E/(2*math.pi))
    print(f"Berry check at x=1e11 (E={E:.4g}):")
    print(f"  L_max = ln(E/2pi)/(2 pi ln2) = {lnE/(2*math.pi*math.log(2)):.2f}   (Berry: 5.62)")
    print(f"  longest wavelength ln(E/2pi)/ln2 = {lnE/math.log(2):.2f}   (Berry: 35.31)")
    print(f"  eq.(23) (ln ln(E/2pi)+1.4009)/pi^2 = {(math.log(lnE)+1.4009)/math.pi**2:.4f}   (Berry: 0.4659)")
    tau = 0.25; X = math.exp(tau*lnE); pr = prime_powers(X, list(primerange(2, int(X)+1)))
    half = (sum(1/(r*r*p**r) for p, r in pr) + 1 - math.log(tau))/math.pi**2
    print(f"  tau*=1/4 -> prime powers up to {X:.0f}, largest included {max(p**r for p,r in pr)}  (Berry: p^r <= 449)")
    print(f"  eq.(21) with sin^2=1/2: {half:.4f}   (Berry: 0.4663)")
    Lb = np.arange(200, 1000, 0.1); print(f"  mean of full formula over L in [200,1000): {V_berry(Lb, E).mean():.4f}")
    Ls = np.array([0.1, 0.5, 1.0, 2.0]); print("  small L: V_berry", np.round(V_berry(Ls, E), 4), " V_GUE", np.round(V_gue(Ls), 4))
    # GUE matrices instrument: unfold bulk eigenvalues with semicircle, compare Sigma^2 to exact GUE formula
    rng = np.random.default_rng(3); N = 400; Ls = np.array([0.5, 1.0, 2.0, 3.0]); acc = []
    for _ in range(200):
        H = rng.standard_normal((N, N)) + 1j*rng.standard_normal((N, N)); H = (H + H.conj().T)/2
        ev = np.linalg.eigvalsh(H); R = 2*math.sqrt(N)  # semicircle radius: E|H_ij|^2 = 1 -> R = 2 sqrt(N)
        u = np.clip(ev/R, -1, 1); Nbar = N*(0.5 + (u*np.sqrt(1-u**2) + np.arcsin(u))/np.pi)
        acc.append(sigma2(Nbar[N//4:3*N//4], Ls, 4000))
    print("GUE matrices N=400 x200, bulk half, Sigma^2:", np.round(np.mean(acc, axis=0), 4), " exact GUE:", np.round(V_gue(Ls), 4))

# ---------------- LOCKED decisive part (Physicist lock 2026-11-23; replaces orig load()/run()) ----------------
# Changes vs orig (before the lock commit; see H8-LOCK.md section 5): local byte-checked data (no download); two fixed
# L-regimes instead of one RMS over [0.5, 50]; SE-weighted statistics; an explicit power gate; seeded Cramer sets per
# window; house verdicts; instrument gate enforced in code. V_gue, V_berry, cramer_primes, sigma2, unfold: unchanged.
HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(os.path.dirname(HERE), "data")
SHA = {"zeros3": "75a1f1a978d5e3eddd16518f661d41a95a40b33782389ba02ec4ed0ce0764807",
       "zeros4": "10d9f7dab2bbfff6b8befbe6f765969b0b3f38f6110ed1df423931addd52da8f",
       "zeros5": "250ac4ba722c6face4d07c05777376fc2b9bc021b05232e8f53c91b1eb2b7e0d"}
L_GUE = np.arange(0.25, 2.001, 0.25)                 # GUE regime: >= 5000 non-overlapping windows per 10^4 zeros
NBLK = 10; NCRAMER = 20; Z_OK = 2.0; Z_BAD = 3.0; POWER_MIN = 3.0

def load(name):
    raw = open(os.path.join(DATA, name), "rb").read(); h = hashlib.sha256(raw).hexdigest()
    if h != SHA[name]: sys.exit(f"ABORT: {name} sha256 {h} != locked {SHA[name]}")
    txt = raw.decode(); off = int(re.search(r"gamma\s*-\s*([0-9]+)", txt).group(1))
    vals = [float(t) for t in re.findall(r"^\s*([0-9]+\.[0-9]+)\s*$", txt, re.M)]
    assert len(vals) == 10000, (name, len(vals))
    return off, np.array(vals), h

# unfold(): verbatim from orig/h8_berry.py (second-order local Riemann-von Mangoldt about the median height)
def unfold(off, d):
    E0 = off + np.median(d); t = E0/(2*np.pi); lnt = math.log(t)
    rho = lnt/(2*np.pi); drho = 1/(2*np.pi*E0)
    dd = d - np.median(d)
    return rho*dd + 0.5*drho*dd**2, E0

def L_sat(E0):   # saturation regime: from 2*L_max (Berry 1988: L_max = ln(E/2pi)/(2 pi ln 2)), rounded UP to 0.5, to 50
    lmax = math.log(E0 / (2 * np.pi)) / (2 * np.pi * math.log(2))
    return np.arange(math.ceil(4 * lmax) / 2, 50.001, 0.5), lmax

def zrms(V, M, SE): return float(np.sqrt(np.mean(((V - M) / SE) ** 2)))

def gate():
    E = 2.677e11; lnE = math.log(E / (2 * math.pi)); ok = True
    ok &= round(lnE / (2 * math.pi * math.log(2)), 2) == 5.62 and round(lnE / math.log(2), 2) == 35.31
    ok &= round((math.log(lnE) + 1.4009) / math.pi ** 2, 4) == 0.4659
    X = math.exp(0.25 * lnE); pr = prime_powers(X, list(primerange(2, int(X) + 1)))
    ok &= max(p ** r for p, r in pr) == 449 and round((sum(1 / (r * r * p ** r) for p, r in pr) + 1 - math.log(0.25)) / math.pi ** 2, 4) == 0.4663
    ok &= bool(np.all(np.abs(V_berry(np.array([0.1, 0.5]), E) - V_gue(np.array([0.1, 0.5]))) < 0.002))
    return bool(ok)

def run(commit):
    res = {"locked_commit": commit, "gate": gate(), "windows": {}}
    if not res["gate"]:
        res["verdict"] = "NOT-TESTABLE-YET (instrument gate failed)"
    else:
        for wi, name in enumerate(("zeros3", "zeros4", "zeros5")):
            off, d, h = load(name); x, E0 = unfold(off, d); LS, lmax = L_sat(E0); w = {"sha256": h, "E_median": E0, "L_max": lmax,
                                                                                    "L_sat": [float(LS[0]), float(LS[-1]), len(LS)]}
            blocks = np.array_split(x, NBLK); rng = np.random.default_rng([20261124, wi])
            X = math.exp(0.25 * math.log(E0 / (2 * np.pi))); cr = [cramer_primes(X, rng) for _ in range(NCRAMER)]
            for reg, Ls in (("G", L_GUE), ("S", LS)):
                V = sigma2(x, Ls); Vb = np.array([sigma2(b, Ls, 4000) for b in blocks]); SE = Vb.std(axis=0, ddof=1) / math.sqrt(NBLK)
                vb, vg = V_berry(Ls, E0), V_gue(Ls); vc = [V_berry(Ls, E0, primes=p) for p in cr]
                w[reg] = {"L": Ls.tolist(), "V": V.tolist(), "SE": SE.tolist(), "z_berry": zrms(V, vb, SE), "z_gue": zrms(V, vg, SE),
                          "z_cramer": [zrms(V, c, SE) for c in vc], "z_berry_tau015": zrms(V, V_berry(Ls, E0, tau=0.15), SE),
                          "power_berry_vs_gue": zrms(vb, vg, SE), "power_berry_vs_cramer_median": float(np.median([zrms(vb, c, SE) for c in vc])),
                          "D_rel_berry": float(np.sqrt(np.mean(((V - vb) / vb) ** 2))), "D_rel_gue": float(np.sqrt(np.mean(((V - vg) / vg) ** 2)))}
            G, S = w["G"], w["S"]
            w["G_consistent"] = G["z_berry"] <= Z_OK and G["z_gue"] <= Z_OK
            w["S_powered"] = S["power_berry_vs_gue"] >= POWER_MIN
            w["kill"] = G["z_berry"] > Z_BAD or (w["S_powered"] and (S["z_berry"] > Z_BAD or S["z_berry"] >= S["z_gue"]))
            w["berry_confirmed"] = w["G_consistent"] and w["S_powered"] and S["z_berry"] <= Z_OK and S["z_gue"] >= Z_BAD
            if S["power_berry_vs_cramer_median"] < POWER_MIN: w["cramer_subquestion"] = "NOT-TESTABLE-YET (underpowered)"
            elif S["z_berry"] <= Z_OK and min(S["z_cramer"]) >= Z_BAD: w["cramer_subquestion"] = "Berry beats every Cramer set"
            else: w["cramer_subquestion"] = "Berry does not beat Cramer"
            res["windows"][name] = w
            print(name, {k: (round(v, 4) if isinstance(v, float) else v) for k, v in w.items() if k not in ("G", "S")},
                  "| G z_B/z_GUE", round(G["z_berry"], 3), round(G["z_gue"], 3), "| S z_B/z_GUE", round(S["z_berry"], 3), round(S["z_gue"], 3),
                  "power", round(S["power_berry_vs_gue"], 2), round(S["power_berry_vs_cramer_median"], 2), flush=True)
        U = [res["windows"][n] for n in ("zeros4", "zeros5")]
        if any(u["kill"] for u in U): res["verdict"] = "KILLED"
        elif all(u["berry_confirmed"] for u in U): res["verdict"] = "REDUCES-TO-KNOWN (replication; literature-seen)"
        else: res["verdict"] = "NOT-TESTABLE-YET" + (" (saturation regime underpowered)" if not all(u["S_powered"] for u in U) else "")
    os.makedirs(os.path.join(os.path.dirname(HERE), "out"), exist_ok=True)
    json.dump(res, open(os.path.join(os.path.dirname(HERE), "out", "h8_result.json"), "w"), indent=1, default=float)
    print("VERDICT:", res["verdict"])

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--instrument", action="store_true"); ap.add_argument("--locked-commit")
    a = ap.parse_args()
    if a.instrument: instrument()
    elif a.locked_commit: run(a.locked_commit)
    else: sys.exit("refusing: --instrument, or --locked-commit <sha> after the H8 lock is committed")
