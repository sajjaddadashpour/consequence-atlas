"""H10 instrument: real Clifford algebras Cl(p,q) (p generators square to +1, q to -1), p+q=4.
Builds explicit REAL 4x4 generators where the classification says Cl(p,q) = M4(R) and verifies them;
prints the mod-8 classification (imported, Lounesto 2001 Table) and pseudoscalar squares."""
import itertools
import numpy as np
X = np.array([[0, 1], [1, 0]]); Z = np.array([[1, 0], [0, -1]]); E = np.array([[0, -1], [1, 0]]); I = np.eye(2)
k = np.kron
TYPE = {0: "M(R)", 1: "M(R)+M(R)", 2: "M(R)", 3: "M(C)", 4: "M(H)", 5: "M(H)+M(H)", 6: "M(H)", 7: "M(C)"}
def check(gens, p, q):
    n = len(gens); ok = True
    for i in range(n):
        ok &= np.allclose(gens[i] @ gens[i], (1 if i < p else -1) * np.eye(4))
        for j in range(i+1, n): ok &= np.allclose(gens[i] @ gens[j] + gens[j] @ gens[i], 0)
    return ok
# candidate real 4x4 building blocks: squares +1: kron of {X,Z,I}; squares -1: contain one E
cands = [k(a, b) for a in (X, Z, I, E) for b in (X, Z, I, E)]
plus = [m for m in cands if np.allclose(m @ m, np.eye(4)) and not np.allclose(m, np.eye(4))]
minus = [m for m in cands if np.allclose(m @ m, -np.eye(4))]
for p in range(5):
    q = 4 - p; found = None
    for P in itertools.combinations(range(len(plus)), p):
        for Q in itertools.combinations(range(len(minus)), q):
            gens = [plus[i] for i in P] + [minus[j] for j in Q]
            if check(gens, p, q): found = gens; break
        if found: break
    w2 = (-1) ** (4*3//2) * (-1) ** q
    print(f"Cl({p},{q}): (p-q) mod 8 = {(p-q)%8} -> {TYPE[(p-q)%8]:10s} pseudoscalar^2 = {w2:+d}; "
          f"real 4x4 rep found among Pauli-kron candidates: {found is not None}")
print("Note: a search failure among this candidate set is consistent with, not a proof of, nonexistence; the proof is the classification.")
