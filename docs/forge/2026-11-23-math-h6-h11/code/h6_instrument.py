"""H6 INSTRUMENT checks only (known answers). Does NOT compute the locked statistics T1/T2."""
import itertools, math, sys
import numpy as np
from symn import SymN, partitions

def per_ryser(A):
    n = A.shape[0]; tot = 0.0
    for S in range(1, 1 << n):
        cols = [j for j in range(n) if S >> j & 1]
        tot += (-1) ** len(cols) * np.prod(A[:, cols].sum(axis=1))
    return (-1) ** n * tot

rng = np.random.default_rng(12345)
ok = True
print("check 1: character orthogonality sum_mu |C_mu| chi_l chi_m = n! delta")
for n in range(2, 8):
    G = SymN(n)
    M = (G.chi * G.classsize) @ G.chi.T
    err = np.abs(M - math.factorial(n) * np.eye(len(G.lams))).max()
    print(f"  n={n}: #irreps={len(G.lams)} max|err|={err:.1e}"); ok &= err < 1e-6

print("check 2: imm_(1^n)=det, imm_(n)=per, Z_{-1}=(-1)^n det, Z_{+1}=per (Gaussian real matrices)")
for n in range(2, 8):
    G = SymN(n)
    for t in range(3):
        A = rng.standard_normal((n, n))
        im = G.imm(A); d = np.linalg.det(A); p = per_ryser(A)
        e1 = abs(im[G.idx[tuple([1]*n)]] - d); e2 = abs(im[G.idx[(n,)]] - p)
        e3 = abs(G.cycle_weight(A, -1) - (-1)**n * d); e4 = abs(G.cycle_weight(A, 1) - p)
        ok &= max(e1, e2, e3, e4) < 1e-8 * max(1, abs(p), abs(d))
    print(f"  n={n}: last trial errs det {e1:.1e} per {e2:.1e} Z-1 {e3:.1e} Z+1 {e4:.1e}")

print("check 3: sum_pi y^c(pi) = y(y+1)...(y+n-1)  (all-ones matrix)")
for n in range(1, 9):
    G = SymN(n); J = np.ones((n, n))
    for y in [-1, -2, -3, 0.5, np.exp(2j*np.pi/3), 1j]:
        rf = np.prod([y + k for k in range(n)])
        e = abs(G.cycle_weight(J, y) - rf); ok &= e < 1e-6 * max(1, abs(rf))
    print(f"  n={n}: ok, e.g. y=-2 -> {G.cycle_weight(J,-2).real:.0f} (rising factorial {np.prod([-2+k for k in range(n)]):.0f})")

print("check 4: exhaustive +-1 matrices, n=2 and n=3 (declared SEEN)")
for n in (2, 3):
    G = SymN(n); N = 2 ** (n*n)
    vals = np.zeros((N, len(G.lams)))
    for m in range(N):
        bits = [(m >> k) & 1 for k in range(n*n)]
        A = (1 - 2*np.array(bits, dtype=float)).reshape(n, n)
        vals[m] = G.imm(A)
    second = (vals**2).mean(axis=0)
    print(f"  n={n}: E[imm_lambda^2] =", dict(zip(G.lams, np.round(second, 6))), f"(DERIVED prediction n! = {math.factorial(n)})")
    ok &= np.allclose(second, math.factorial(n))
    per = vals[:, G.idx[(n,)]]; det = vals[:, G.idx[tuple([1]*n)]]
    ks = 2 ** (n - int(math.floor(math.log2(n+1))))
    print(f"  n={n}: P(per=0)={np.mean(per==0):.4f}  P(det=0)={np.mean(det==0):.4f}  "
          f"all per divisible by 2^(n-floor(log2(n+1)))={ks}: {bool(np.all(per % ks == 0))}; "
          f"all det divisible by 2^(n-1)={2**(n-1)}: {bool(np.all(det % 2**(n-1) == 0))}")
    if n == 3: ok &= bool(np.all(per != 0))
print("ALL INSTRUMENT CHECKS PASS" if ok else "INSTRUMENT FAILURE")
sys.exit(0 if ok else 1)
