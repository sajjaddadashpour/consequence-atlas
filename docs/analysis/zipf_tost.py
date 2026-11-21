"""Bootstrap TOST rerun of forge Claim E (Zipf/Gibrat), WUP 2025 F21, same sample rules and Hill estimator as
/workspace/physics/forge/2026-11-18-zipf-gibrat-run/zipf_gibrat.py. NOT a locked test: written after the forge results were seen.
TOST at alpha=0.05 <=> 90% bootstrap percentile CI.  Zipf: margin alpha in [0.9,1.1].  Gibrat: margin b in [-M, M], M=0.01 base.
Per unit:  EQUIV  = 90% CI inside margin;  NONEQUIV = 90% CI entirely outside margin;  INCONCL = otherwise.
"""
import sys, math, json, hashlib
import numpy as np, pandas as pd
sys.path.insert(0,'/workspace/physics/forge/2026-11-18-zipf-gibrat-run')
from zipf_gibrat import hill, load, num, DATA_SHA
PATH='/workspace/physics/forge/2026-11-18-zipf-gibrat-run/data/WUP2025-F21.xlsx'
assert hashlib.sha256(open(PATH,'rb').read()).hexdigest()==DATA_SHA
B=2000; rng=np.random.default_rng(20261120)
def hill_a(x):
    x=np.sort(x)[::-1]; lx=np.log(x); return (len(x)-1)/np.sum(lx[:-1]-lx[-1])
def gib_b(s10,s20):
    X=np.log(s10); g=np.log(s20)-X; Xc=X-X.mean(); return np.sum(Xc*(g-g.mean()))/np.sum(Xc**2)
def classify(lo,hi,a,b):
    if a<=lo and hi<=b: return 'EQUIV'
    if hi<a or lo>b: return 'NONEQUIV'
    return 'INCONCL'
df=load(PATH)
keep=df["City_Name"].notna()&(df["City_Name"].astype(str).str.strip()!="")&df["ISO3_Code"].astype(str).str.fullmatch(r"[A-Z]{3}")
df=df[keep].copy(); df["p10"]=df["2010"].map(num); df["p20"]=df["2020"].map(num)
def analyse(cut, Ms=(0.005,0.01,0.02)):
    Z={}; G={}
    for iso,d in df.groupby("ISO3_Code",sort=True):
        z=d[d.p20.notna()&(d.p20>=cut)]["p20"].to_numpy(float)
        if len(z)>=20:
            a=hill_a(z); bs=np.array([hill_a(rng.choice(z,len(z))) for _ in range(B)])
            bs=bs[np.isfinite(bs)]; lo,hi=np.percentile(bs,[5,95])
            Z[iso]=dict(n=len(z),a=a,lo=lo,hi=hi,cls=classify(lo,hi,0.9,1.1))
        g=d[d.p10.notna()&(d.p10>=cut)&d.p20.notna()]
        if len(g)>=20:
            s10=g.p10.to_numpy(float); s20=g.p20.to_numpy(float); n=len(s10)
            b=gib_b(s10,s20); idx=rng.integers(0,n,(B,n))
            bs=np.array([gib_b(s10[i],s20[i]) for i in idx]); lo,hi=np.percentile(bs,[5,95])
            G[iso]=dict(n=n,b=b,lo=lo,hi=hi,cls={M:classify(lo,hi,-M,M) for M in Ms})
    return Z,G
def report(label,Z,G,Ms=(0.005,0.01,0.02)):
    res={'label':label,'N_Z':len(Z),'N_G':len(G)}
    cz=pd.Series([v['cls'] for v in Z.values()]).value_counts().to_dict(); res['Zipf']=cz
    print(f"\n=== {label}: N_Z={len(Z)}, N_G={len(G)}")
    print("Zipf TOST [0.9,1.1]:",cz, " median alpha=%.3f"%np.median([v['a'] for v in Z.values()]))
    E=sorted(set(Z)&set(G)); res['N_E']=len(E); thr=max(5,math.ceil(0.25*len(E)))
    for M in Ms:
        cg=pd.Series([G[i]['cls'][M] for i in G]).value_counts().to_dict()
        both=sum(Z[i]['cls']=='EQUIV' and G[i]['cls'][M]=='EQUIV' for i in E)
        zg=[i for i in E if Z[i]['cls']=='EQUIV' and G[i]['cls'][M]=='NONEQUIV']
        gz=[i for i in E if G[i]['cls'][M]=='EQUIV' and Z[i]['cls']=='NONEQUIV']
        anyinc=sum(Z[i]['cls']=='INCONCL' or G[i]['cls'][M]=='INCONCL' for i in E)
        print(f" Gibrat TOST |b|<={M}: {cg}")
        print(f"   E (N_E={len(E)}, forge threshold {thr}): both-EQUIV={both}; Zipf-EQUIV & Gibrat-NONEQUIV={len(zg)} {zg}; "
              f"Gibrat-EQUIV & Zipf-NONEQUIV={len(gz)} {gz}; units with any INCONCL={anyinc}")
        res[f'M={M}']=dict(Gibrat=cg,both_equiv=both,ZeqGneq=zg,GeqZneq=gz,any_inconcl=anyinc,threshold=thr)
    return res
out={}
Z,G=analyse(50); out['cut50k']=report('BASE: forge sample (>=50k, n>=20), Hill as forge',Z,G)
print("\nper-country Zipf (base):"); 
for k,v in Z.items(): print(f" {k} n={v['n']:5d} a={v['a']:.3f} 90%CI[{v['lo']:.3f},{v['hi']:.3f}] {v['cls']}"+(f" | b={G[k]['b']:+.4f} [{G[k]['lo']:+.4f},{G[k]['hi']:+.4f}] {G[k]['cls'][0.01]}" if k in G else ""))
out['base_units']={'Z':Z,'G':{k:{**v,'cls':{str(m):c for m,c in v['cls'].items()}} for k,v in G.items()}}
Z2,G2=analyse(100); out['cut100k']=report('ROBUSTNESS: tail cutoff >=100k (n>=20)',Z2,G2)
json.dump(out,open('zipf_tost_output.json','w'),indent=1,default=float)
