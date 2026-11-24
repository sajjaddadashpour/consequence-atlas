"""H8: Berry (1988) number variance of Riemann zeros predicted from primes.
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

URLS = {"zeros3": "https://www-users.cse.umn.edu/~odlyzko/zeta_tables/zeros3",
        "zeros4": "https://www-users.cse.umn.edu/~odlyzko/zeta_tables/zeros4",
        "zeros5": "https://www-users.cse.umn.edu/~odlyzko/zeta_tables/zeros5"}

def load(name):
    os.makedirs("../data", exist_ok=True); path = f"../data/{name}"
    if not os.path.exists(path): urllib.request.urlretrieve(URLS[name], path)
    raw = open(path, "rb").read(); h = hashlib.sha256(raw).hexdigest()
    txt = raw.decode(); off = int(re.search(r"gamma\s*-\s*([0-9]+)", txt).group(1))
    vals = [float(t) for t in re.findall(r"^\s*([0-9]+\.[0-9]+)\s*$", txt, re.M)]
    return off, np.array(vals), h

def unfold(off, d):
    E0 = off + np.median(d); t = E0/(2*np.pi); lnt = math.log(t)
    rho = lnt/(2*np.pi); drho = 1/(2*np.pi*E0)
    dd = d - np.median(d)
    return rho*dd + 0.5*drho*dd**2, E0

def run(commit):
    Ls = np.arange(0.5, 50.01, 0.5); res = {"locked_commit": commit, "windows": {}}
    verdict_ok, kill = True, False
    for name in ("zeros3", "zeros4", "zeros5"):
        off, d, h = load(name); x, E0 = unfold(off, d)
        V = sigma2(x, Ls); blocks = np.array_split(x, 10)
        Vb = np.array([sigma2(b, Ls, 4000) for b in blocks]); se = Vb.std(axis=0, ddof=1)/math.sqrt(10)
        vb = V_berry(Ls, E0); vb15 = V_berry(Ls, E0, tau=0.15); vg = V_gue(Ls)
        D = lambda m: float(np.sqrt(np.mean(((V - m)/m)**2)))
        X = math.exp(0.25*math.log(E0/(2*np.pi))); rng = np.random.default_rng(2026)
        Dc = [D(V_berry(Ls, E0, primes=cramer_primes(X, rng))) for _ in range(20)]
        w = {"sha256": h, "n_zeros": len(d), "E_median": E0, "D_berry": D(vb), "D_berry_tau015": D(vb15),
             "D_gue": D(vg), "D_cramer_min": min(Dc), "D_cramer_all": Dc, "V": V.tolist(), "SE": se.tolist()}
        res["windows"][name] = w
        ok = w["D_berry"] <= 0.03 and w["D_berry"] < w["D_gue"] and w["D_berry"] < w["D_cramer_min"]
        verdict_ok &= ok
        if name in ("zeros4", "zeros5") and (w["D_berry"] >= w["D_gue"] or w["D_berry"] > 0.05): kill = True
    res["verdict"] = "KILLED" if kill else ("REDUCES-TO-KNOWN" if verdict_ok else "NOT-TESTABLE-YET")
    os.makedirs("../out", exist_ok=True); json.dump(res, open("../out/h8_result.json", "w"), indent=1)
    print("VERDICT:", res["verdict"])

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--instrument", action="store_true"); ap.add_argument("--locked-commit")
    a = ap.parse_args()
    if a.instrument: instrument()
    elif a.locked_commit: run(a.locked_commit)
    else: sys.exit("refusing: --instrument, or --locked-commit <sha> after the H8 lock is committed")
