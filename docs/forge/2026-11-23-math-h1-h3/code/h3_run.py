"""H3 LOCKED RUNNER (Physicist lock 2026-11-23). DO NOT EDIT AFTER THE LOCK COMMIT.
Large-scale spectral dimension d_s = -2 dlnP/dln(sigma) of a continuous-time random walk (generator L = I - A D^-1)
on candidate PRR graphs (R1, R2), an imported-dimension causal-set control (R3), and lattice instruments (Z4, Z2 tori).
Run (Mathematician): <python with numpy+scipy> code/h3_run.py [--smoke]  ->  out/h3_output.json, out/h3_output.txt
Everything below is fixed by H3-LOCK.md. Any change = a new lock."""
import json, sys, time, os
import numpy as np
import scipy
import scipy.sparse as sp
from scipy.sparse.linalg import expm_multiply, eigsh

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
BASE_SEED = 20261124
N_SOURCES = 64; N_SIGMA = 24; SIG_LO = 24.0; SIG_CAP = 256.0; WIN_FACTOR = 0.5; MIN_RATIO = 2.0
SAT_FACTOR = 5.0
BAND = (3.7, 4.3); Z2_BAND = (1.7, 2.3)
RULE_SIZES = {'R1': [10_000, 100_000], 'R2': [10_000, 100_000], 'R3': [5_000, 10_000]}
SEEDS = [1, 2, 3]

# ---------------- generators ----------------
def adj_from_edges(n, e):
    e = np.asarray(e, dtype=np.int64); A = sp.coo_matrix((np.ones(len(e)), (e[:, 0], e[:, 1])), shape=(n, n))
    A = ((A + A.T) > 0).astype(np.float64).tocsr(); A.setdiag(0); A.eliminate_zeros(); return A

def gen_R1(n, rng):
    """R1 'born together' with closure (random 2-tree). Start: one link {0,1}. Step: pick an existing link (u,v)
    uniformly from ALL links ever made; new node w links to BOTH u and v (creates triangle u,v,w)."""
    E = np.empty((2 * n, 2), dtype=np.int64); E[0] = (0, 1); m = 1
    picks = rng.random(n)
    for w in range(2, n):
        u, v = E[int(picks[w] * m)]; E[m] = (u, w); E[m + 1] = (v, w); m += 2
    return adj_from_edges(n, E[:m])

def gen_R2(n, rng):
    """R2 stacked-simplex growth (random Apollonian network = boundary graph of a random stacked 3-polytope).
    Start: K4 (tetrahedron), its 4 triangular faces. Step: pick a CURRENT face (a,b,c) uniformly; new node w links to
    a, b, c; face (a,b,c) is replaced by (a,b,w), (a,c,w), (b,c,w)."""
    F = np.empty((2 * n + 4, 3), dtype=np.int64); F[:4] = [(0, 1, 2), (0, 1, 3), (0, 2, 3), (1, 2, 3)]; nf = 4
    E = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]
    picks = rng.random(n)
    for w in range(4, n):
        k = int(picks[w] * nf); a, b, c = F[k]
        E += [(a, w), (b, w), (c, w)]
        F[k] = (a, b, w); F[nf] = (a, c, w); F[nf + 1] = (b, c, w); nf += 2
    return adj_from_edges(n, E)

def gen_R3(n, rng):
    """R3 CONTROL (imports d=4 by hand): n points uniform (rejection) in the 4D Minkowski causal diamond
    |t| + |x| <= 1 (t in [-1,1], x in R^3), c = 1. Fixed n (no Poisson draw on the count). x < y iff
    t_y - t_x > |x_y - x_x|. Undirected link graph (Hasse diagram): x<y with no z, x<z<y."""
    pts = []
    while sum(len(p) for p in pts) < n:
        q = rng.uniform(-1, 1, size=(4 * n, 4)); q = q[np.abs(q[:, 0]) + np.linalg.norm(q[:, 1:], axis=1) <= 1]; pts.append(q)
    P = np.concatenate(pts)[:n]; P = P[np.argsort(P[:, 0])]
    C = np.zeros((n, n), dtype=np.float32)
    for i in range(0, n, 1000):
        dt = P[None, :, 0] - P[i:i + 1000, None, 0]; dx = np.linalg.norm(P[None, :, 1:] - P[i:i + 1000, None, 1:], axis=2)
        C[i:i + 1000] = (dt > dx)
    L = (C > 0) & ~((C @ C) > 0)      # link iff related and no element in between
    ii, jj = np.nonzero(L); return adj_from_edges(n, np.stack([ii, jj], 1))

def gen_torus(d, side):
    n = side ** d; idx = np.arange(n).reshape((side,) * d); E = []
    for ax in range(d):
        E.append(np.stack([idx.ravel(), np.roll(idx, -1, axis=ax).ravel()], 1))
    return adj_from_edges(n, np.concatenate(E))

# ---------------- measurement ----------------
def largest_component(A):
    nc, lab = sp.csgraph.connected_components(A, directed=False)
    if nc == 1: return A, 1.0
    big = np.argmax(np.bincount(lab)); keep = np.nonzero(lab == big)[0]
    return A[keep][:, keep].tocsr(), len(keep) / A.shape[0]

def lambda2(A, rng, exact=None):
    if exact is not None: return exact, 'analytic'
    deg = np.asarray(A.sum(1)).ravel(); Dm = sp.diags(1 / np.sqrt(deg))
    M = sp.identity(A.shape[0]) + Dm @ A @ Dm          # = 2I - L_sym ; top eigs 2, 2 - lambda2
    vals = eigsh(M, k=2, which='LA', tol=1e-8, maxiter=50000, v0=rng.random(A.shape[0]), return_eigenvectors=False)
    return float(2 - np.sort(vals)[0]), 'eigsh'

def spectral_dimension(A, rng, l2_exact=None):
    A, frac = largest_component(A); n = A.shape[0]; deg = np.asarray(A.sum(1)).ravel(); twoE = deg.sum()
    l2, how = lambda2(A, rng, l2_exact)
    hi = min(SIG_CAP, WIN_FACTOR / l2); res = dict(n=n, lcc_frac=frac, mean_deg=float(deg.mean()), max_deg=int(deg.max()),
                                                    lambda2=l2, lambda2_method=how, sigma_lo=SIG_LO, sigma_hi=hi)
    if hi < MIN_RATIO * SIG_LO: res.update(status='NO-WINDOW'); return res
    src = rng.choice(n, size=min(N_SOURCES, n), replace=False)
    G = -(sp.identity(n, format='csr') - A @ sp.diags(1 / deg)).tocsr()   # dp/dsigma = -(I - A D^-1) p
    V = np.zeros((n, len(src))); V[src, np.arange(len(src))] = 1.0
    sig = np.geomspace(SIG_LO, hi, N_SIGMA); prev = 0.0; Pm = []
    for s in sig:
        V = expm_multiply(G * (s - prev), V); prev = s; Pm.append(V[src, np.arange(len(src))].mean())
    Pinf = (deg[src] / twoE).mean(); y = np.array(Pm)          # NO stationary subtraction (see H3-LOCK.md)
    res.update(P=list(map(float, Pm)), P_inf=float(Pinf), sigma=list(map(float, sig)))
    if y[-1] < SAT_FACTOR * Pinf: res.update(status='SATURATED'); return res   # counts as NO-WINDOW
    x = np.log(sig); y = np.log(y); fit = lambda a, b: float(-2 * np.polyfit(x[a:b], y[a:b], 1)[0])
    res.update(status='OK', ds=fit(0, N_SIGMA), ds_lo=fit(0, N_SIGMA // 2), ds_hi=fit(N_SIGMA // 2, N_SIGMA)); return res

def in_band(r, band=BAND):
    return r.get('status') == 'OK' and all(band[0] <= r[k] <= band[1] for k in ('ds', 'ds_lo', 'ds_hi'))

def rule_verdict(runs):   # runs at the largest size, 3 seeds
    ok = [r for r in runs if r.get('status') == 'OK']; nowin = len(runs) - len(ok)   # NO-WINDOW or SATURATED
    if nowin >= 2: return 'KILLED', f'NO-WINDOW in {nowin}/3 seeds'
    mean = float(np.mean([r['ds'] for r in ok]))
    if not (BAND[0] <= mean <= BAND[1]): return 'KILLED', f'mean d_s {mean:.3f} outside {BAND}'
    if len(ok) == 3 and all(in_band(r) for r in runs): return 'SURVIVED', f'mean d_s {mean:.3f}; all seeds and halves in band'
    return 'NOT-TESTABLE-YET', f'mean d_s {mean:.3f} in band but not every seed/half in band (or one NO-WINDOW)'

def main(smoke=False):
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True); lines = []; R = {}
    def out(s): print(s, flush=True); lines.append(s)
    out(f'numpy {np.__version__} scipy {scipy.__version__}  python {sys.version.split()[0]}  smoke={smoke}')
    if smoke:
        for rule, gen in (('R1', gen_R1), ('R2', gen_R2), ('R3', gen_R3)):
            A = gen(100, np.random.default_rng([BASE_SEED, 99, 100])); A2, f = largest_component(A)
            out(f'SMOKE {rule} n=100: edges={int(A.nnz // 2)} connected_frac={f:.2f} symmetric={(A != A.T).nnz == 0}')
        T = gen_torus(4, 4); out(f'SMOKE Z4 torus side 4: n={T.shape[0]} degrees={sorted(set(np.asarray(T.sum(1)).ravel().astype(int).tolist()))}')
        r = spectral_dimension(gen_R1(100, np.random.default_rng([BASE_SEED, 99, 100])), np.random.default_rng(0))
        out(f'SMOKE pipeline on R1 n=100: status={r["status"]} lambda2={r["lambda2"]:.4f} sigma_hi={r["sigma_hi"]:.2f}')
        r = spectral_dimension(gen_torus(2, 60), np.random.default_rng(0), l2_exact=(1 - np.cos(2 * np.pi / 60)) / 2)
        out('SMOKE pipeline code-path check on Z2 torus side 60 (instrument geometry, not a locked size): '
            + json.dumps({k: r.get(k) for k in ('status', 'ds', 'ds_lo', 'ds_hi', 'sigma_hi')}))
        open(os.path.join(ROOT, 'out', 'h3_smoke.txt'), 'w').write('\n'.join(lines) + '\n'); return
    # instruments first
    for name, d, side in (('INSTR_Z4_torus24', 4, 24), ('INSTR_Z2_torus316', 2, 316)):
        A = gen_torus(d, side); l2 = (1 - np.cos(2 * np.pi / side)) / d
        R[name] = spectral_dimension(A, np.random.default_rng([BASE_SEED, 7, d]), l2_exact=l2)   # tori: analytic lambda2
        out(f'{name}: ' + json.dumps({k: R[name].get(k) for k in ('status', 'ds', 'ds_lo', 'ds_hi', 'lambda2', 'sigma_hi')}))
    inst = in_band(R['INSTR_Z4_torus24']) and in_band(R['INSTR_Z2_torus316'], Z2_BAND)
    out(f'INSTRUMENT {"PASS" if inst else "FAIL"}')
    for rid, (rule, gen) in enumerate((('R1', gen_R1), ('R2', gen_R2), ('R3', gen_R3)), start=1):
        R[rule] = {}
        for n in RULE_SIZES[rule]:
            R[rule][n] = []
            for seed in SEEDS:
                rng = np.random.default_rng([BASE_SEED, rid, n, seed]); t0 = time.time()
                r = spectral_dimension(gen(n, rng), rng); r['seed'] = seed; r['secs'] = round(time.time() - t0, 1); R[rule][n].append(r)
                out(f'{rule} n={n} seed={seed}: ' + json.dumps({k: r.get(k) for k in ('status', 'ds', 'ds_lo', 'ds_hi', 'lambda2', 'sigma_hi', 'mean_deg', 'max_deg', 'lcc_frac', 'secs')}))
    V = {}
    for rule in ('R1', 'R2', 'R3'):
        V[rule] = rule_verdict(R[rule][max(RULE_SIZES[rule])]) if inst else ('NOT-TESTABLE-YET', 'instrument failed')
        out(f'RULE {rule}: {V[rule][0]} -- {V[rule][1]}')
    if not inst: prr = ('NOT-TESTABLE-YET', 'instrument failed; nothing scored')
    elif 'SURVIVED' in (V['R1'][0], V['R2'][0]):
        prr = ('SURVIVED', 'a no-dimension-input rule gives d_s in band: ' + ','.join(k for k in ('R1', 'R2') if V[k][0] == 'SURVIVED'))
    else: prr = ('NOT-TESTABLE-YET', 'no PRR rule (R1, R2) gives d_s ~ 4; PRR still lacks a locality rule. R3 is context only.')
    out(f'VERDICT H3 (PRR-level): {prr[0]} -- {prr[1]}')
    json.dump(dict(results=R, rules=V, prr=prr, instrument_pass=inst), open(os.path.join(ROOT, 'out', 'h3_output.json'), 'w'), indent=1, default=str)
    open(os.path.join(ROOT, 'out', 'h3_output.txt'), 'w').write('\n'.join(lines) + '\n')

if __name__ == '__main__':
    main(smoke='--smoke' in sys.argv)
