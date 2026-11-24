"""H1 LOCKED RUNNER (Physicist lock 2026-11-23). DO NOT EDIT AFTER THE LOCK COMMIT.
Statistic: mean ratio of consecutive level spacings <r~> (Atas et al., PRL 110, 084101, 2013). No unfolding.
Run (Mathematician): <python with numpy+scipy> code/h1_run.py  ->  out/h1_output.json, out/h1_output.txt
Everything below is fixed by H1-LOCK.md. Any change = a new lock."""
import json, sys, time, os
import numpy as np
import scipy.sparse as sp

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
REF = {'Poisson': 0.3863, 'GOE': 0.5307, 'GUE': 0.5996}   # Atas et al. 2013 Table I (Poisson = 2ln2-1)
TOL_FLOOR = 0.010; K_SE = 3.0
BASE_SEED = 20261124
SIZES = {500: 40, 1000: 20, 2000: 10}          # N -> number of samples
CHAIN = {10: 20, 12: 4}                          # L -> number of samples
SPARSE_DEG = 4                                   # REPORT ensemble F, reused exactly
DEGEN = 1e-10                                    # spacings below this are dropped (counted, reported)
ZERO_BLOCKS = 20

def ratios(ev):
    ev = np.sort(ev); n = len(ev); ev = ev[n // 4: 3 * n // 4]           # middle 50%
    s = np.diff(ev); dropped = int(np.sum(s <= DEGEN)); s = s[s > DEGEN]
    return np.minimum(s[:-1], s[1:]) / np.maximum(s[:-1], s[1:]), dropped

def classify(r, se):
    tol = max(K_SE * se, TOL_FLOOR)
    hits = [k for k, v in REF.items() if abs(r - v) <= tol]
    return (hits[0] if len(hits) == 1 else 'INDETERMINATE'), tol

def pm1(rng, shape): return rng.choice(np.array([-1.0, 1.0]), size=shape)

# ---- ensembles (eigenvalue generators) ----
def ens_a(rng, N):      # (a) real symmetric, iid +-1 entries INCLUDING diagonal
    M = pm1(rng, (N, N)); U = np.triu(M, 1); return np.linalg.eigvalsh(U + U.T + np.diag(np.diag(M)))
def ens_a0(rng, N):     # (a0) REPORT ensemble A exactly: off-diagonal +-1, zero diagonal (SEEN replication)
    M = pm1(rng, (N, N)); U = np.triu(M, 1); return np.linalg.eigvalsh(U + U.T)
def ens_b(rng, N):      # (b) complex Hermitian, off-diagonal iid from {+1,-1,+i,-i}, diagonal real +-1
    ph = rng.choice(np.array([1, -1, 1j, -1j]), size=(N, N)); U = np.triu(ph, 1)
    return np.linalg.eigvalsh(U + U.conj().T + np.diag(pm1(rng, N)))
def ens_c(rng, N):      # (c) REPORT ensemble F exactly: sparse real symmetric +-1, p = 4/N, zero diagonal
    M = np.zeros((N, N)); mask = np.triu(rng.random((N, N)) < SPARSE_DEG / N, 1)
    M[mask] = pm1(rng, int(mask.sum())); return np.linalg.eigvalsh(M + M.T)
def ens_goe(rng, N):
    A = rng.normal(size=(N, N)); return np.linalg.eigvalsh((A + A.T) / 2)
def ens_gue(rng, N):
    A = rng.normal(size=(N, N)) + 1j * rng.normal(size=(N, N)); return np.linalg.eigvalsh((A + A.conj().T) / 2)

# (d) REPORT spin chains C (real) and D (complex) reused exactly, incl. the 0.5 factor on g that REPORT's code uses
I2 = sp.identity(2, format='csr'); X = sp.csr_matrix([[0, 1], [1, 0]], dtype=complex)
Y = sp.csr_matrix([[0, -1j], [1j, 0]]); Z = sp.csr_matrix([[1, 0], [0, -1]], dtype=complex)
def site(m, i, L):
    out = sp.identity(1, format='csr', dtype=complex)
    for j in range(L): out = sp.kron(out, m if j == i else I2, format='csr')
    return out
def chain(rng, L, cplx):
    J = rng.choice([-1, 1], L - 1); h = rng.choice([-1, 1], L); g = rng.choice([-1, 1], L)
    Xs = [site(X, i, L) for i in range(L)]; Ys = [site(Y, i, L) for i in range(L)]; Zs = [site(Z, i, L) for i in range(L)]
    H = sum(J[i] * Zs[i] @ Zs[i + 1] for i in range(L - 1)) + sum(h[i] * Xs[i] for i in range(L)) \
        + sum(0.5 * g[i] * Zs[i] for i in range(L))
    if cplx:
        k = rng.choice([-1, 1], L - 1)
        H = H + sum(k[i] * (Xs[i] @ Ys[i + 1] - Ys[i] @ Xs[i + 1]) for i in range(L - 1))
        return np.linalg.eigvalsh(H.toarray())
    Hd = H.toarray(); assert np.abs(Hd.imag).max() == 0; return np.linalg.eigvalsh(Hd.real)
def ens_d1(rng, L): return chain(rng, L, False)
def ens_d2(rng, L): return chain(rng, L, True)

ENS = [  # id, name, role, generator, size table, alphabet
    (1, 'a_dense_real_pm1', 'REAL-PM1 (kill-eligible)', ens_a, SIZES),
    (2, 'a0_dense_real_pm1_zero_diag (REPORT A)', 'REAL-PM1 (kill-eligible, seen replication)', ens_a0, SIZES),
    (3, 'b_dense_hermitian_Z4', 'COMPLEX (must be GUE for REDUCES-TO-KNOWN)', ens_b, SIZES),
    (4, 'c_sparse_real_pm1_deg4 (REPORT F)', 'REAL-PM1 (kill-eligible)', ens_c, SIZES),
    (5, 'd1_chain_real (REPORT C)', 'REAL-PM1 (kill-eligible)', ens_d1, CHAIN),
    (6, 'd2_chain_complex (REPORT D)', 'COMPLEX control (reported only)', ens_d2, CHAIN),
    (7, 'ref_GOE_gaussian', 'INSTRUMENT', ens_goe, SIZES),
    (8, 'ref_GUE_gaussian', 'INSTRUMENT', ens_gue, SIZES),
]

def run_ensembles(out):
    res = {}
    for eid, name, role, gen, table in ENS:
        res[name] = {'role': role, 'sizes': {}}
        for n, S in table.items():
            rng = np.random.default_rng([BASE_SEED, eid, n]); means = []; allr = []; drop = 0; t0 = time.time()
            for _ in range(S):
                r, d = ratios(gen(rng, n)); means.append(r.mean()); allr.append(r); drop += d
            r = np.concatenate(allr); se = float(np.std(means, ddof=1) / np.sqrt(S))
            cls, tol = classify(float(r.mean()), se)
            res[name]['sizes'][n] = dict(samples=S, n_ratios=int(len(r)), r_mean=float(r.mean()), se=se, tol=tol,
                                         cls=cls, dropped_degenerate=drop, secs=round(time.time() - t0, 1))
            out(f'{name:42s} size={n:5d} S={S:3d} <r>={r.mean():.4f} SE={se:.4f} tol={tol:.4f} -> {cls}  (dropped {drop})')
        res[name]['final_size'] = max(table); res[name]['final_cls'] = res[name]['sizes'][max(table)]['cls']
    return res

def load_zeros(fn):   # values are gamma - offset; offset is NOT added (float64 cannot hold 1e20-sized heights)
    vals = []
    for line in open(os.path.join(ROOT, 'data', fn)):
        try: vals.append(float(line))
        except ValueError: pass
    return np.array(vals)

def run_zeros(out):
    res = {}
    for fn, role in (('zeros4', 'PRIMARY unseen: 10^21+1..10^21+10^4'), ('zeros5', 'SECONDARY unseen by us (Atas 2013 Fig.4 showed a histogram): 10^22+1..+10^4'),
                     ('zeros3', 'SEEN replication: 10^12+1..+10^4')):
        g = load_zeros(fn); assert len(g) == 10000, (fn, len(g))
        s = np.diff(g); assert np.all(s > 0)                         # all 10^4 zeros, no bulk cut, no unfolding
        r = np.minimum(s[:-1], s[1:]) / np.maximum(s[:-1], s[1:])
        blocks = np.array_split(r, ZERO_BLOCKS); bm = np.array([b.mean() for b in blocks])
        se = float(bm.std(ddof=1) / np.sqrt(ZERO_BLOCKS)); cls, tol = classify(float(r.mean()), se)
        res[fn] = dict(role=role, n_ratios=int(len(r)), r_mean=float(r.mean()), se_batch=se,
                       se_naive=float(r.std() / np.sqrt(len(r))), tol=tol, cls=cls)
        out(f'{fn} [{role}] <r>={r.mean():.4f} SE(batch)={se:.4f} tol={tol:.4f} -> {cls}')
    return res

def verdict(E, Zr):
    inst_ok = E['ref_GOE_gaussian']['final_cls'] == 'GOE' and E['ref_GUE_gaussian']['final_cls'] == 'GUE'
    if not inst_ok: return 'NOT-TESTABLE-YET', 'instrument failure: Gaussian reference misclassified at N=2000'
    real = [k for k, v in E.items() if v['role'].startswith('REAL-PM1')]
    real_gue = [k for k in real if E[k]['final_cls'] == 'GUE']
    zeros_goe = [z for z in ('zeros4', 'zeros5') if Zr[z]['cls'] == 'GOE']
    if real_gue or zeros_goe:
        return 'KILLED', f'real +-1 classes classified GUE: {real_gue}; locked zero windows classified GOE: {zeros_goe}'
    if Zr['zeros4']['cls'] == 'GUE' and Zr['zeros5']['cls'] == 'GUE' and E['b_dense_hermitian_Z4']['final_cls'] == 'GUE':
        return 'REDUCES-TO-KNOWN', 'zeros GUE, no real +-1 class GUE, complex Z4 class GUE: Wigner-Dyson universality + Montgomery-Odlyzko'
    return 'NOT-TESTABLE-YET', 'no kill, but a required GUE classification (zeros4, zeros5 or b) came out INDETERMINATE/other'

if __name__ == '__main__':
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True); lines = []
    def out(s): print(s, flush=True); lines.append(s)
    out(f'numpy {np.__version__}  python {sys.version.split()[0]}')
    Zr = run_zeros(out); E = run_ensembles(out); v, why = verdict(E, Zr)
    out(f'VERDICT H1: {v} -- {why}')
    json.dump(dict(zeros=Zr, ensembles=E, verdict=v, reason=why), open(os.path.join(ROOT, 'out', 'h1_output.json'), 'w'), indent=1)
    open(os.path.join(ROOT, 'out', 'h1_output.txt'), 'w').write('\n'.join(lines) + '\n')
