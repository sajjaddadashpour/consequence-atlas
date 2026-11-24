"""H11 LOCKED RUNNER (Physicist lock 2026-11-23). DO NOT EDIT AFTER THE LOCK COMMIT.
Stacked-polytope / k-tree growth rules R4a, R4b, R5a, R5b, measured with the H3 pipeline UNCHANGED: this file imports
code/h3_run.py, a byte-identical copy of the H1-H3 lock file (sha256 6fb03b95...4895, lock 218a3a9), and uses its
spectral_dimension(), in_band(), rule_verdict(), gen_torus() and all constants (window, band, sources, caps).
Run (Mathematician): <python with numpy+scipy> code/h11_run.py [--smoke]  ->  out/h11_output.json, out/h11_output.txt"""
import json, sys, time, os, hashlib, itertools
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
H3_SHA = "6fb03b95e3eb4e07a3b34025ec00062f767c5dc668764469235f93b6f3c84895"
assert hashlib.sha256(open(os.path.join(HERE, "h3_run.py"), "rb").read()).hexdigest() == H3_SHA, "h3_run.py is not the locked file"
import h3_run as H3

SIZES = [10_000, 100_000]; SEEDS = [1, 2, 3]
RULE_IDS = {"R4a": 11, "R4b": 12, "R5a": 13, "R5b": 14}

def gen_stack(n, rng, k, mode):
    """k = facet/clique size (4 for R4, 5 for R5).
    mode 'a' (stacked polytope, Apollonian-style): start = boundary of the k-simplex = K_{k+1}, current facets = its k+1
      k-subsets. Step: pick a CURRENT facet uniformly; new vertex w joins its k vertices; the facet is REPLACED by the k
      new facets (each (k-1)-subset of it + w). (k=3 is H3's R2.)
    mode 'b' (random k-tree): start = K_k, clique list = [that k-clique]. Step: pick uniformly from ALL k-cliques ever
      listed; new vertex w joins its k vertices; the k new k-cliques ((k-1)-subset + w) are APPENDED; old ones stay.
      (k=2 is H3's R1.)"""
    start = k + 1 if mode == 'a' else k
    E = [(i, j) for i in range(start) for j in range(i + 1, start)]
    F = [tuple(c) for c in itertools.combinations(range(start), k)] if mode == 'a' else [tuple(range(k))]
    picks = rng.random(n)
    for w in range(start, n):
        idx = int(picks[w] * len(F)); f = F[idx]
        E += [(v, w) for v in f]
        new = [tuple(c) + (w,) for c in itertools.combinations(f, k - 1)]
        if mode == 'a': F[idx] = new[0]; F.extend(new[1:])
        else: F.extend(new)
    return H3.adj_from_edges(n, E)

GENS = {"R4a": lambda n, r: gen_stack(n, r, 4, 'a'), "R4b": lambda n, r: gen_stack(n, r, 4, 'b'),
        "R5a": lambda n, r: gen_stack(n, r, 5, 'a'), "R5b": lambda n, r: gen_stack(n, r, 5, 'b')}

def main(smoke=False):
    os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True); lines = []; R = {}
    def out(s): print(s, flush=True); lines.append(s)
    if smoke:
        for rule, gen in GENS.items():
            A = gen(100, np.random.default_rng([H3.BASE_SEED, 99, 100])); deg = np.asarray(A.sum(1)).ravel()
            out(f'SMOKE {rule} n=100: edges={A.nnz // 2} mean_deg={deg.mean():.2f} min_deg={int(deg.min())} '
                f'connected_frac={H3.largest_component(A)[1]:.2f} symmetric={(A != A.T).nnz == 0}')
        open(os.path.join(ROOT, 'out', 'h11_smoke.txt'), 'w').write('\n'.join(lines) + '\n'); return
    for name, d, side in (('INSTR_Z4_torus24', 4, 24), ('INSTR_Z2_torus316', 2, 316)):   # identical to H3 instruments
        A = H3.gen_torus(d, side); l2 = (1 - np.cos(2 * np.pi / side)) / d
        R[name] = H3.spectral_dimension(A, np.random.default_rng([H3.BASE_SEED, 7, d]), l2_exact=l2)
        out(f'{name}: ' + json.dumps({k: R[name].get(k) for k in ('status', 'ds', 'ds_lo', 'ds_hi', 'lambda2', 'sigma_hi')}))
    inst = H3.in_band(R['INSTR_Z4_torus24']) and H3.in_band(R['INSTR_Z2_torus316'], H3.Z2_BAND)
    out(f'INSTRUMENT {"PASS" if inst else "FAIL"}')
    V = {}
    for rule, gen in GENS.items():
        R[rule] = {}
        for n in SIZES:
            R[rule][n] = []
            for seed in SEEDS:
                rng = np.random.default_rng([H3.BASE_SEED, RULE_IDS[rule], n, seed]); t0 = time.time()
                r = H3.spectral_dimension(gen(n, rng), rng); r['seed'] = seed; r['secs'] = round(time.time() - t0, 1); R[rule][n].append(r)
                out(f'{rule} n={n} seed={seed}: ' + json.dumps({k: r.get(k) for k in ('status', 'ds', 'ds_lo', 'ds_hi', 'lambda2', 'sigma_hi', 'mean_deg', 'max_deg', 'lcc_frac', 'secs')}))
        V[rule] = H3.rule_verdict(R[rule][max(SIZES)]) if inst else ('NOT-TESTABLE-YET', 'instrument failed')
        out(f'RULE {rule}: {V[rule][0]} -- {V[rule][1]}')
    surv = [k for k in GENS if V[k][0] == 'SURVIVED']
    if not inst: prr = ('NOT-TESTABLE-YET', 'instrument failed; nothing scored')
    elif surv: prr = ('SURVIVED (NOT PRR-distinctive)', f'{",".join(surv)} give d_s in band, but the rule imports the simplex dimension; not PRR-distinctive unless PRR fixes that dimension itself')
    else: prr = ('NOT-TESTABLE-YET', 'no stacked rule gives d_s ~ 4; PRR still lacks a locality rule')
    out(f'VERDICT H11 (PRR-level): {prr[0]} -- {prr[1]}')
    json.dump(dict(results=R, rules=V, prr=prr, instrument_pass=inst), open(os.path.join(ROOT, 'out', 'h11_output.json'), 'w'), indent=1, default=str)
    open(os.path.join(ROOT, 'out', 'h11_output.txt'), 'w').write('\n'.join(lines) + '\n')

if __name__ == '__main__':
    main(smoke='--smoke' in sys.argv)
