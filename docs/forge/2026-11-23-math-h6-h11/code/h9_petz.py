"""H9: Cencov (classical) vs Petz (quantum) monotone metrics on +/-1 (two-outcome / qubit) states.
  --instrument : classical-direction and r=0 checks only (known answers).
  --locked-commit <sha> : DECISIVE table of tangential/Bures ratios for r in (0,1) (theorem-determined; run only after lock).
"""
import argparse, json, math, os, sys
import numpy as np

F = {  # operator-monotone f with f(1)=1 ; c_f(x,y) = 1/(y f(x/y))
 "SLD/Bures (min)": lambda x: (1+x)/2,
 "Wigner-Yanase":   lambda x: ((1+math.sqrt(x))/2)**2,
 "Kubo-Mori/BKM":   lambda x: (x-1)/math.log(x) if abs(x-1) > 1e-12 else 1.0,
 "RLD (max)":       lambda x: 2*x/(1+x),
}
def c(f, x, y): return 1.0/(y*f(x/y))

def g(f, r, A):  # rho = diag((1+r)/2,(1-r)/2); A hermitian traceless tangent
    lam = [(1+r)/2, (1-r)/2]
    return sum(abs(A[i, j])**2 * c(f, lam[i], lam[j]) for i in range(2) for j in range(2))

RAD = np.array([[1, 0], [0, -1]], complex)/2      # d rho / d r  (classical, commuting direction)
TAN = np.array([[0, 1], [1, 0]], complex)/2       # rotation of the Bloch vector (non-commuting)

def instrument():
    ok = True
    for r in (0.0, 0.3, 0.9):
        vals = {k: g(f, r, RAD) for k, f in F.items()}; fisher = 1/(1-r**2)
        print(f"radial (classical) r={r}: ", {k: round(v, 6) for k, v in vals.items()}, f" Fisher 1/(1-r^2)={fisher:.6f}")
        ok &= all(abs(v-fisher) < 1e-9 for v in vals.values())
    vals = {k: g(f, 0.0, TAN) for k, f in F.items()}
    print("tangential at r=0 (maximally mixed):", {k: round(v, 6) for k, v in vals.items()})
    ok &= max(vals.values()) - min(vals.values()) < 1e-9
    print("Cencov (classical) uniqueness reproduced on the commuting direction:", ok)

def run(commit):
    rs = [0.1, 0.3, 0.5, 0.7, 0.9, 0.99]; tab = {}
    for k, f in F.items():
        tab[k] = [g(f, r, TAN)/g(F["SLD/Bures (min)"], r, TAN) for r in rs]
    spread = max(max(v) for v in tab.values())/min(min(v) for v in tab.values())
    v = "KILLED (quantum uniqueness)" if spread > 1 + 1e-6 else "SURVIVED"
    os.makedirs("../out", exist_ok=True); json.dump({"locked_commit": commit, "r": rs, "ratio_to_SLD": tab, "verdict": v}, open("../out/h9_result.json", "w"), indent=1)
    print("VERDICT:", v)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--instrument", action="store_true"); ap.add_argument("--locked-commit")
    a = ap.parse_args()
    if a.instrument: instrument()
    elif a.locked_commit: run(a.locked_commit)
    else: sys.exit("refusing")
