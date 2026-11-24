"""H2 LOCKED CHECK (Physicist lock 2026-11-23). Independent recount of local tomography by explicit rank.
K = real dimension of the space of (unnormalised) states = dimension of the real span of observables.
Local tomography holds iff span{A (x) B : A in obs_A, B in obs_B} equals the full joint observable space."""
import numpy as np
from itertools import product
def basis(n, field):
    B = []
    for i in range(n):
        for j in range(i, n):
            E = np.zeros((n, n), complex); E[i, j] = E[j, i] = 1; B.append(E)
            if field == 'C' and i != j:
                F = np.zeros((n, n), complex); F[i, j] = -1j; F[j, i] = 1j; B.append(F)
    return B
def realrank(Ms): return np.linalg.matrix_rank(np.array([np.concatenate([M.real.ravel(), M.imag.ravel()]) for M in Ms]))
for field in ('R', 'C'):
    for n in (2, 3):
        KA = realrank(basis(n, field)); KAB = realrank(basis(n * n, field))
        Kloc = realrank([np.kron(a, b) for a, b in product(basis(n, field), basis(n, field))])
        print(f'{field} d={n}: K_A={KA} K_AB={KAB} span(local products)={Kloc} -> local tomography {"HOLDS" if Kloc == KAB else "FAILS"}'
              f'  | normalised: {KAB-1} vs (K_A-1+1)^2-1={KA*KA-1}')
