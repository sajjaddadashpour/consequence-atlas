"""CH-G2 Monte Carlo: Mg.ATP2- uncatalysed hydrolysis half-life at 122 C vs M. kandleri 116 doubling time.
Inputs (all from the sources the forge run opened, /workspace/physics/forge/2026-11-19-1930-chem-g2/data):
 - Stockbridge & Wolfenden 2009 JBC (doi 10.1074/jbc.M109.017806) Table 2, Mg.ATP2- hydrolysis:
   k25 = 3.8e-8 s^-1, dH = 25.6 kcal/mol, TdS = -1.9 kcal/mol. Footnote: 'estimated errors ... from Arrhenius plots are <=0.4 kcal/mol'
   (table note also says 'S.D. of the measurements ranged from 0.1 to 1.0 kcal/mol'). Arrhenius data taken 50-110 C (+/-1.5 C ovens),
   >=6 points, R^2>=0.975. k25 is itself an Arrhenius extrapolation DOWN from 50-110 C, so the rate is best known near the
   centre of the measured range, not at 25 C. We therefore parameterise ln k by its value at the pivot T_p (centre of 1/T over 50-110 C).
 - Takai et al. 2008 PNAS (doi 10.1073/pnas.0712334105) Fig. 2A: mu = 0.058 h^-1 (forge digitisation, higher of two 122 C points,
   ASSUMED = 20 MPa). Paper: piezophilic growth rates 'estimated only from 3-4 data points'; no error bars, no T uncertainty given.
   Forge cross-check from Fig. 1B overall rise: t_d = 15.5 h (mu = 0.0447). The other 122 C point (40 MPa?) is mu = 0.010.
"""
import numpy as np, math, json
R=1.987204e-3; kB_h=2.083661912e10  # kB/h in s^-1 K^-1
T25=298.15; Tlock=395.15; k25=3.8e-8; dH0=25.6
# Eyring with constant dH: k(T) = k(Tp) * (T/Tp) * exp(-dH/R (1/T - 1/Tp))
inv=np.linspace(1/(50+273.15),1/(110+273.15),1001); Tp=1/inv.mean()
k_p0 = k25*(Tp/T25)*math.exp(-dH0/R*(1/Tp-1/T25))
def k_at(T,k_p,dH): return k_p*(T/Tp)*np.exp(-dH/R*(1/T-1/Tp))
LN2=math.log(2); EDGE=0.01
rng=np.random.default_rng(20261120); N=400_000
def run(sig_dH=0.2, sig_lnkp=0.10, sig_lnmu=0.25, sig_T=1.0, mu_med=0.058, convention='half', anchor='pivot'):
    dH=rng.normal(dH0,sig_dH,N); T=rng.normal(Tlock,sig_T,N)
    if anchor=='pivot':
        kp=k_p0*np.exp(rng.normal(0,sig_lnkp,N)); k=k_at(T,kp,dH)
    else:  # naive: anchor at 25 C as the forge did, dH error levered over 25->122 C
        k=k25*np.exp(rng.normal(0,sig_lnkp,N))*(T/T25)*np.exp(-dH/R*(1/T-1/T25))
    mu=mu_med*np.exp(rng.normal(0,sig_lnmu,N))   # per hour
    t_dec=(LN2/k if convention=='half' else 1/k)/3600
    td=LN2/mu; r=t_dec/td
    q=np.percentile(r,[5,50,95])
    return dict(P_kill=float((r<EDGE).mean()), P_inside=float(((r>=EDGE)&(r<=100)).mean()), median=float(q[1]), p05=float(q[0]), p95=float(q[2]))
def fmt(d): return f"P(ratio<0.01)={d['P_kill']:.3f}  median={d['median']:.4f}  90% [{d['p05']:.4f}, {d['p95']:.4f}]"
out={}
print(f"pivot T_p={Tp:.1f} K ({Tp-273.15:.1f} C); point k(122C)={k_at(Tlock,k_p0,dH0):.4g} s^-1; t1/2={LN2/k_at(Tlock,k_p0,dH0)/60:.2f} min; td={LN2/0.058:.2f} h")
print(f"point ratios: t1/2/td={LN2/k_at(Tlock,k_p0,dH0)/3600/(LN2/0.058):.4f}   tau/td={1/k_at(Tlock,k_p0,dH0)/3600/(LN2/0.058):.4f}")
print("\n== BASE (sigma_dH 0.2 kcal/mol [<=0.4 read as 2 sigma], sigma_lnk(Tp) 0.10, sigma_ln mu 0.25, sigma_T 1 K, mu 0.058) ==")
for conv in ('half','tau'):
    d=run(convention=conv); out[f'base_{conv}']=d; print(f"{conv:4s}: {fmt(d)}")
print("note: tau/td mixes conventions; the like-for-like pair (tau vs 1/mu) has exactly the half-life ratio.")
print("\n== SENSITIVITY SWEEPS (half-life run; tau run in brackets) ==")
sweeps=[('sig_dH',[0.1,0.4,1.0]),('sig_lnkp',[0.05,0.2,0.3]),('sig_lnmu',[0.1,0.4,0.6]),('sig_T',[0.5,2.0])]
for name,vals in sweeps:
    for v in vals:
        a=run(convention='half',**{name:v}); b=run(convention='tau',**{name:v}); out[f'{name}={v}']=dict(half=a,tau=b)
        print(f"{name}={v}: {fmt(a)}   [tau: P={b['P_kill']:.3f}, med={b['median']:.4f}]")
print("\n== mu centre alternatives (discrete source ambiguity, not mixed into base) ==")
for lab,m in [('Fig1B cross-check td=15.5h',LN2/15.5),('other 122C point mu=0.010 (40 MPa?)',0.010),('digitisation +/-1px (~0.003)',0.061)]:
    a=run(mu_med=m); b=run(mu_med=m,convention='tau'); out[lab]=dict(half=a,tau=b)
    print(f"{lab}: {fmt(a)}   [tau: P={b['P_kill']:.3f}]")
print("\n== naive anchor at 25 C (forge-style; overstates dH leverage) ==")
for s in (0.2,0.4):
    a=run(anchor='k25',sig_dH=s); out[f'naive_25C_sigdH{s}']=a; print(f"sig_dH={s}: {fmt(a)}")
print("\n== species (systematic, unscored in lock; point values from Table 2) ==")
for sp,(k,dh) in {'ATP4-':(1.5e-9,27.9),'ATP3-':(1.7e-8,27.6),'Mg.ATP2-':(3.8e-8,25.6),'Mn.ATP2-':(1.3e-7,25.4),'Mg.ADP-':(5.3e-9,25.8)}.items():
    kk=k*(Tlock/T25)*math.exp(-dh/R*(1/Tlock-1/T25)); print(f"{sp:9s}: t1/2(122C)={LN2/kk/3600:.4f} h  ratio={LN2/kk/3600/(LN2/0.058):.4f}")
json.dump(out,open('chg2_mc_output.json','w'),indent=1)
