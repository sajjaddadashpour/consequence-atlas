"""Shared S_n machinery for H6: permutations, cycle types, characters (Murnaghan-Nakayama),
and per-matrix cycle-type sums S_mu(A) = sum_{pi of type mu} prod_i A[i, pi(i)]."""
import itertools, math
import numpy as np
from numba import njit

def partitions(n, maxpart=None):
    if maxpart is None: maxpart = n
    if n == 0: yield (); return
    for k in range(min(n, maxpart), 0, -1):
        for rest in partitions(n - k, k):
            yield (k,) + rest

def mn_char(lam, mu):
    """chi_lam(mu) by Murnaghan-Nakayama using beta-sets."""
    lam = tuple(x for x in lam if x > 0)
    if not mu:
        return 1 if sum(lam) == 0 else 0
    k, rest = mu[0], mu[1:]
    L = len(lam)
    beta = [lam[i] + (L - 1 - i) for i in range(L)]
    bset = set(beta)
    total = 0
    for b in beta:
        nb = b - k
        if nb < 0 or nb in bset: continue
        sign = (-1) ** sum(1 for x in beta if nb < x < b)
        newb = sorted([x for x in beta if x != b] + [nb], reverse=True)
        Ln = len(newb)
        newlam = tuple(newb[i] - (Ln - 1 - i) for i in range(Ln))
        total += sign * mn_char(newlam, rest)
    return total

def b_of(lam):  # boxes right of first column (Curticapean's b)
    return sum(lam) - len(lam)

class SymN:
    def __init__(self, n):
        self.n = n
        self.lams = list(partitions(n))          # also used as cycle types mu
        self.idx = {p: i for i, p in enumerate(self.lams)}
        P = np.array(list(itertools.permutations(range(n))), dtype=np.int8)
        self.P = P
        types = np.empty(len(P), dtype=np.int16)
        for r, perm in enumerate(P):
            seen = [False] * n; cyc = []
            for s in range(n):
                if not seen[s]:
                    L = 0; j = s
                    while not seen[j]:
                        seen[j] = True; j = perm[j]; L += 1
                    cyc.append(L)
            types[r] = self.idx[tuple(sorted(cyc, reverse=True))]
        self.types = types
        self.chi = np.array([[mn_char(l, m) for m in self.lams] for l in self.lams], dtype=np.float64)
        self.ncyc = np.array([len(m) for m in self.lams])
        self.classsize = np.bincount(types, minlength=len(self.lams)).astype(np.float64)

    def S(self, A):
        return _typesums(np.ascontiguousarray(A, dtype=np.float64), self.P, self.types, len(self.lams))

    def imm(self, A):            # vector over lambda (same order as self.lams)
        return self.chi @ self.S(A)

    def cycle_weight(self, A, y):  # Z_y(A) = sum_pi y^{c(pi)} prod A
        return np.sum(self.S(A) * (complex(y) ** self.ncyc))

@njit(cache=True)
def _typesums(A, P, types, ntypes):
    out = np.zeros(ntypes)
    n = A.shape[0]
    for r in range(P.shape[0]):
        p = 1.0
        for i in range(n):
            p *= A[i, P[r, i]]
            if p == 0.0: break
        if p != 0.0:
            out[types[r]] += p
    return out
