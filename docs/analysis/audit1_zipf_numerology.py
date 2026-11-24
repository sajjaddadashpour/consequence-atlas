"""Gibrat vs Zipf (Gabaix 1999 mechanism) and a look-elsewhere baseline for PRR seed numerology."""
import numpy as np, math, itertools
rng=np.random.default_rng(7)
def hill(x,k):
    x=np.sort(x)[::-1][:k+1]; return k/np.sum(np.log(x[:k]/x[k]))
N,T=20000,4000
print("== Z1: pure Gibrat (no barrier) vs Gibrat + reflecting lower barrier, top-500 Hill exponent ==")
for barrier in (False,True):
    s=np.ones(N)
    for t in range(1,T+1):
        s*=np.exp(rng.normal(-0.5*0.1**2,0.1,N))
        if barrier:
            s/=s.mean(); s=np.maximum(s,0.3)   # normalised sizes with a floor (Gabaix/Kesten)
        if t in (500,2000,4000): print(f"barrier={barrier} t={t}: Hill(top500)={hill(s,500):.3f}")
print("(pure Gibrat -> lognormal with growing variance; exponent drifts toward 0. Zipf exponent ~1 needs the floor AND normalisation)")
print("\n== Z2: 'Zipf holds' = Hill 95% CI contains 1 is a power statement ==")
for n in (20,50,200,1000):
    for alpha in (0.8,1.25):
        hits=0
        for _ in range(2000):
            x=(1-rng.random(n+1))**(-1/alpha); a=hill(x,n); se=a/math.sqrt(n-1)
            hits+= (a-1.96*se<=1<=a+1.96*se)
        print(f"n={n:5d} true alpha={alpha}: P(CI contains 1)={hits/2000:.2f}")
print("\n== N1: look-elsewhere baseline for PRR seeds |r|=0.98122, f=0.087 ==")
base={'r':0.98122,'f':0.087,'pi':math.pi,'phi':(1+5**.5)/2,'e':math.e}
ints=[1,2,3,4,5,6,8,10,12]
targets={'1/alpha':137.035999,'mp/me':1836.15267,'OmL/Om':0.685/0.315}
vals={}
for (n1,v1),(n2,v2) in itertools.product(base.items(),repeat=2):
    for p in (-2,-1,1,2):
        for q in (-2,-1,0,1,2):
            for c in ints:
                for cc in (1,1/2,1/3,1/4):
                    v=c*cc*v1**p*v2**q
                    vals[f"{c}*{cc:.3g}*{n1}^{p}*{n2}^{q}"]=v
v=np.array(list(vals.values())); names=list(vals)
print("distinct simple expressions:",len(set(np.round(v,12))))
for tn,tv in targets.items():
    for tol in (1e-2,1e-3,1e-4):
        m=np.abs(v/tv-1)<tol
        print(f"{tn}: within {tol:g}: {m.sum()} hits", ("e.g. "+names[int(np.argmax(m))]) if m.any() else "")
# expected count under log-uniform spread of values over their range
lv=np.log(v[v>0]); span=lv.max()-lv.min()
for tol in (1e-3,1e-4): print(f"null expectation (log-uniform) per target @ {tol:g}: ~{len(lv)*2*tol/span:.1f}")
print("\n== Z3: Gabaix/Kesten exponent zeta = 1/(1 - floor/mean) ==")
for fl in (0.3,0.1,0.02):
    s=np.ones(N)
    for t in range(6000):
        s*=np.exp(rng.normal(-0.005,0.1,N)); s/=s.mean(); s=np.maximum(s,fl)
    print(f"floor={fl}: theory zeta={1/(1-fl):.3f}, Hill(top500)={hill(s,500):.3f}")
