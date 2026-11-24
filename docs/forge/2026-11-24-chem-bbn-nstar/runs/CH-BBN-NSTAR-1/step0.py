import json, numpy as np, itertools, sys
sys.path.insert(0,'/workspace/chemist/bbn-code/PRyMordial-nstar')
d = json.load(open('runs/CH-BBN-NSTAR-1/patchcheck_identity.json'))
Ts = np.array(d['H_grid_T_MeV']); Hs = np.array(d['H_grid'])
import os; os.chdir('/workspace/chemist/bbn-code/PRyMordial-nstar')
import PRyM.PRyM_init as I, PRyM.PRyM_main as M
c = M.PRyMclass()   # identical SM background, used only for H(T) at T = dE
H = c.Hubble_of_Tg; Tmin = c.Tg_min_MeV
assert np.allclose([H(T) for T in Ts], Hs)
rows=[]
for dE_eV, g, te, tg in itertools.product([0.04,1e4,3e4],[1,2],['887.0','inf'],[4.0,100.0]):
    dE = dE_eV*1e-6
    nbar = 1/np.expm1(dE/Ts)
    ratio = g*nbar/tg/Hs
    c1min = float(ratio.min()); Tat = float(Ts[ratio.argmin()])
    T2 = dE if dE >= Tmin else Tmin
    c2 = tg*H(T2)          # need < 0.1
    rows.append(dict(dE_eV=dE_eV,g_ratio=g,tau_e=te,tau_gamma=tg,cut1_min_ratio=c1min,cut1_argmin_T_MeV=Tat,
        cut1_pass=c1min>=10, cut2_T_eval_MeV=T2, cut2_tau_gamma_times_H=float(c2), cut2_pass=bool(c2<0.1),
        scorable=bool(c1min>=10 and c2<0.1)))
json.dump(dict(Tg_min_MeV=Tmin,rows=rows),open('/workspace/chemist/bbn-code/runs/CH-BBN-NSTAR-1/step0.json','w'),indent=1)
for r in rows: print(r['dE_eV'],r['g_ratio'],r['tau_e'],r['tau_gamma'],'%.3g@%.3g'%(r['cut1_min_ratio'],r['cut1_argmin_T_MeV']),r['cut1_pass'],'%.3g@T=%.3g'%(r['cut2_tau_gamma_times_H'],r['cut2_T_eval_MeV']),r['cut2_pass'],r['scorable'])
print('Tg_min',Tmin)
