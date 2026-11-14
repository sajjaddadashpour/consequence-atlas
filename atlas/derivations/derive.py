import numpy as np, json, math
out={}
a0=1/137.035999; b0=1/1836.15267
# D1 orbit stability
def phi(n,r): return r if n==1 else (np.log(r) if n==2 else -r**(2-n))  # attractive potential energy shape (k=1), V=k*phi
D1={}
for n in range(1,6):
    L=1.0; r=np.logspace(-3,3,200001)
    V=L**2/(2*r**2)+phi(n,r)
    dV=np.gradient(V,r); idx=np.where(np.diff(np.sign(dV))!=0)[0]
    res=[]
    for i in idx:
        d2=(V[i+1]-2*V[i]+V[i-1]) / ((r[i+1]-r[i])*(r[i]-r[i-1]))
        res.append(('min' if d2>0 else 'max', float(r[i])))
    D1[n]={'extrema':res,'stable_circular_orbit':any(k=='min' for k,_ in res)}
out['D1']=D1
# D2 hydrogen in n dims: potential ~ -g r^(2-n) for n>=3; n=4 is -g/r^2 critical; n>=5 steeper.
# numeric check: lowest eigenvalue of radial operator on a grid with shrinking inner cutoff
def lowest(n,g,rmin):
    N=4000; r=np.linspace(rmin,40,N); h=r[1]-r[0]
    l=0; cent=((n-1)*(n-3)/4+l*(l+n-2))/r**2  # radial reduction u=r^{(n-1)/2}R
    V=-g*r**(2-n) if n>=3 else (g*np.log(r))
    main=2/h**2+cent+V; off=-np.ones(N-1)/h**2
    from scipy.linalg import eigh_tridiagonal
    return float(eigh_tridiagonal(main,off,select='i',select_range=(0,0))[0][0])
D2={}
for n in (3,4,5):
    D2[n]={str(rm):lowest(n,1.0,rm) for rm in (1e-1,3e-2,1e-2)}
out['D2_ground_vs_cutoff']=D2
# D3
alphas=[1e-4,1e-3,1/137.036,0.02,0.05,0.1,0.2,1/3,0.5]
out['D3']=[{'alpha':a,'a0_rel':a0/a,'Ry_rel':(a/a0)**2,'v_over_c':a} for a in alphas]
# D4/D5
def A_of_Z(Z):
    # solve Z = A/2 - 0.2 A^2/(A+200)
    lo,hi=Z,4*Z+10
    for _ in range(60):
        A=(lo+hi)/2; z=A/2-0.2*A**2/(A+200)
        lo,hi=(A,hi) if z<Z else (lo,A)
    return (lo+hi)/2
def Zfis(alpha,s):
    crit=2*17.8*(1+s)/(0.711*alpha/a0)
    Z=1
    while Z<2000 and Z**2/A_of_Z(Z)<crit: Z+=1
    return Z-1
def table(alpha,s):
    zd=math.floor(1/alpha); zc=math.floor(1.24/alpha); zf=Zfis(alpha,s)
    return dict(alpha=alpha,s=s,Z_dirac=zd,Z_cr=zc,Z_fis=zf,L=min(zc,zf),L_point=min(zd,zf))
out['D5_ours']=table(a0,0)
out['D5_grid']=[table(a,s) for a in (a0,0.02,0.05,0.1,1/8,0.2) for s in (0,-0.2,0.3)]
# carbon/oxygen threshold in alpha (s=0): largest alpha with L>=8
def thresh(Zneed,s,useCr=True):
    lo,hi=1e-4,1.0
    for _ in range(60):
        m=(lo+hi)/2; t=table(m,s); L=t['L'] if useCr else t['L_point']
        lo,hi=(m,hi) if L>=Zneed else (lo,m)
    return lo
out['D5_alpha_max_for_O']={'finite_size':thresh(8,0),'point':thresh(8,0,False)}
out['D5_alpha_max_for_C']={'finite_size':thresh(6,0),'point':thresh(6,0,False)}
out['D5_alpha_max_for_Fe']={'finite_size':thresh(26,0),'point':thresh(26,0,False)}
# D6 stars at ours
ks={'Adams2019':10**(-8/3),'Tegmark1998':1/200,'Barnes2012':1/100}
out['D6_ours']={k:{'beta_min':v*a0**2,'margin':b0/(v*a0**2)} for k,v in ks.items()}
out['D6_ours']['alpha2beta']={'value':a0**2*b0,'min':2.62e-12,'margin':a0**2*b0/2.62e-12}
# alpha max for stars at our beta, each k
out['D6_alpha_max_at_our_beta']={k:math.sqrt(b0/v) for k,v in ks.items()}
out['D6_alpha_min_at_our_beta']=math.sqrt(2.62e-12/b0)
out['beta_max_ordered']=1/81
out['beta_margin_ordered']=(1/81)/b0
# D7
kB=1.380649e-23; out['D7_landauer_300K_J']=kB*300*math.log(2); out['D7_eV']=kB*300*math.log(2)/1.602176634e-19
json.dump(out,open('derived.json','w'),indent=1)
for k,v in out.items(): print(k, json.dumps(v)[:600])
# D9
Q,dQ=2.52,math.hypot(0.17,0.24); E,dE=-1.00,math.hypot(0.07,0.14)
def r_crit(Qv,Ev,beta): return (beta*938.272-Qv)/Ev   # alpha/alpha0 at which mn-mp = me
out['D9']={'dQ':dQ,'dE':dE,'r_crit_central':r_crit(Q,E,b0),'r_crit_lo':r_crit(Q-dQ,E-dE,b0),'r_crit_hi':r_crit(Q+dQ,E+dE,b0),
 'alpha_crit_central':a0*r_crit(Q,E,b0),'lattice_mn_mp_ours':Q+E,'beta_crit_at_alpha0':(Q+E)/938.272}
json.dump(out,open('derived.json','w'),indent=1)
print('D9',out['D9'])
