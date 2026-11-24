"""H6 DECISIVE RUN -- do not execute before Physicist commits the H6 lock.
Usage: python h6_run.py --locked-commit <sha>   (writes ../out/h6_*.json/.txt)
       python h6_run.py --smoke                 (deterministic all-ones/identity inputs only; prints no locked statistic)
"""
import argparse, json, math, os, sys, time
import numpy as np
from scipy.special import loggamma
from scipy.stats import spearmanr
from symn import SymN, b_of

THETAS = [k * np.pi / 12 for k in range(13)]
T1_NS = {6: 2000, 7: 2000, 8: 2000, 9: 2000, 10: 500}
T2_NS = (7, 8, 9)
BOOT = 1000

def meanfield(n, th):  # log |Gamma(n+y)/(Gamma(y) Gamma(n+1))|, y=e^{i th}; DERIVED ratio E[Z_y]/E[per]
    y = np.exp(1j * th)
    return float(np.real(loggamma(n + y) - loggamma(y) - loggamma(n + 1)))

def second_moments(G):
    """DERIVED: for A with iid Bernoulli(1/2) 0/1 entries, E[imm_l^2] = n!/d_l * imm_l(I+J) / 4^n."""
    n = G.n; IJ = np.ones((n, n)) + np.eye(n)
    d = G.chi[:, G.idx[tuple([1] * n)]]
    return math.factorial(n) / d * G.imm(IJ) / 4.0 ** n

def smoke():
    for n in (4, 5):
        G = SymN(n)
        J = np.ones((n, n))
        assert abs(G.cycle_weight(J, -1)) < 1e-9          # rising factorial vanishes at y=-1
        assert abs(G.imm(np.eye(n)) - G.chi[:, G.idx[tuple([1] * n)]]).max() < 1e-9  # imm(I)=chi(1)
        _ = second_moments(G); _ = meanfield(n, 1.0)
    print("smoke OK (no locked statistic computed)")

def boot_median_diff(a, b, rng):
    idx = rng.integers(0, len(a), size=(BOOT, len(a)))
    d = np.median(a[idx], axis=1) - np.median(b[idx], axis=1)
    return float(np.percentile(d, 2.5)), float(np.percentile(d, 97.5))

def run(commit):
    os.makedirs("../out", exist_ok=True)
    res = {"locked_commit": commit, "started": time.strftime("%Y-%m-%d %H:%M:%S %Z")}
    # ---- instrument gate (known answers) ----
    gate = True
    for n in T1_NS:
        G = SymN(n); J = np.ones((n, n))
        gate &= abs(G.cycle_weight(J, -1)) < 1e-6
        rng = np.random.default_rng(1)
        for _ in range(3):
            A = rng.integers(0, 2, (n, n)).astype(float)
            gate &= abs(G.cycle_weight(A, -1) - (-1) ** n * np.linalg.det(A)) < 1e-6
    res["instrument_gate"] = bool(gate)
    if not gate:
        res["verdict"] = "VOID"; json.dump(res, open("../out/h6_result.json", "w"), indent=1); return
    # ---- T1: cycle-weight scan ----
    T1 = {}
    for n, N in T1_NS.items():
        G = SymN(n); rng = np.random.default_rng(20261123 + n)
        L = []; nzero_per = 0
        while len(L) < N:
            A = rng.integers(0, 2, (n, n)).astype(float)
            S = G.S(A); per = S.sum()
            if per == 0: nzero_per += 1; continue
            Z = np.array([np.sum(S * np.exp(1j * th) ** G.ncyc) for th in THETAS])
            with np.errstate(divide="ignore"):
                L.append(np.log(np.abs(Z) / per))
        L = np.array(L)  # N x 13 ; -inf where Z==0 exactly (kept; median is robust)
        med = np.median(L, axis=0)
        brng = np.random.default_rng(7 + n)
        ci = boot_median_diff(L[:, 12], L[:, 11], brng)
        T1[n] = {"N": N, "discarded_per_zero": nzero_per, "median_log_ratio": med.tolist(),
                 "frac_exact_zero": np.mean(np.isinf(L), axis=0).tolist(),
                 "meanfield": [meanfield(n, th) for th in THETAS[:12]],
                 "ci95_median(pi)-median(11pi/12)": ci}
    res["T1"] = T1
    t1b = all(T1[n]["median_log_ratio"][12] < min(T1[n]["median_log_ratio"][:12]) and
              T1[n]["ci95_median(pi)-median(11pi/12)"][1] < 0 for n in (8, 9, 10))
    t1a = all(abs(T1[10]["median_log_ratio"][k] - T1[10]["meanfield"][k]) <= 0.5 for k in range(11))
    # ---- T2: immanant decoupling ----
    T2 = {}
    for n in T2_NS:
        G = SymN(n); rng = np.random.default_rng(20261123 + 100 + n)
        E2 = second_moments(G)
        logR = []
        while len(logR) < 2000:
            A = rng.integers(0, 2, (n, n)).astype(float)
            im = G.imm(A)
            with np.errstate(divide="ignore"):
                logR.append(np.log(im ** 2 / E2))
        logR = np.array(logR)
        med = np.median(logR, axis=0)
        lams = [l for l in G.lams if l != (n,)]
        ii = [G.idx[l] for l in lams]
        rho = spearmanr([b_of(l) for l in lams], med[ii]).correlation
        brng = np.random.default_rng(99 + n); rhos = []
        for _ in range(BOOT):
            s = brng.integers(0, len(logR), len(logR))
            rhos.append(spearmanr([b_of(l) for l in lams], np.median(logR[s][:, ii], axis=0)).correlation)
        T2[n] = {"lams": [list(l) for l in G.lams], "b": [b_of(l) for l in G.lams], "E2_derived": E2.tolist(),
                 "median_logR": med.tolist(), "frac_exact_zero": np.mean(np.isinf(logR), axis=0).tolist(),
                 "spearman_b_vs_median": float(rho), "spearman_ci95": [float(np.nanpercentile(rhos, 2.5)), float(np.nanpercentile(rhos, 97.5))]}
    res["T2"] = T2
    r9 = T2[9]["spearman_b_vs_median"]; lo, hi = T2[9]["spearman_ci95"]
    if abs(r9) <= 0.6: t2 = "PASS"
    elif lo > 0 or hi < 0: t2 = "FAIL"
    else: t2 = "AMBIGUOUS"
    res["checks"] = {"T1a_meanfield": bool(t1a), "T1b_mirror_strict_min": bool(t1b), "T2_decoupling": t2}
    if not t1b: v = "KILLED (mirror is not the point of maximal typical cancellation)"
    elif t2 == "FAIL": v = "KILLED (decoupling: cancellation tracks b(lambda))"
    elif t2 == "AMBIGUOUS" or not t1a: v = "NOT-TESTABLE-YET"
    else: v = "SURVIVED (math conjecture); PRR-level verdict REDUCES-TO-KNOWN"
    res["verdict"] = v
    json.dump(res, open("../out/h6_result.json", "w"), indent=1)
    print(json.dumps(res["checks"]), "\nVERDICT:", v)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--locked-commit"); ap.add_argument("--smoke", action="store_true")
    a = ap.parse_args()
    if a.smoke: smoke()
    elif a.locked_commit: run(a.locked_commit)
    else: sys.exit("refusing: pass --locked-commit <sha> after the lock is committed, or --smoke")
