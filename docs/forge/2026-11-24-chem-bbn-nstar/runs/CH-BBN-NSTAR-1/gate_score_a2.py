# CH-BBN-NSTAR-1 A2 sanity gates + scoring helper (evaluates saved JSON only; runs no physics)
import json, glob, numpy as np, sys
R = '/workspace/chemist/bbn-code/runs/CH-BBN-NSTAR-1-A2/'
sm = json.load(open(R + 'SM_hooksNone_A2patch.json'))
Tsm = np.array(sm['HT_T_MeV']); Rsm = np.array(sm['HT_Yn'])/np.array(sm['HT_Yp'])
def gates(d):
    Q = d['Q_MeV']; g = d.get('g_ratio', 0.0); dE = d.get('dE_eV', 0.0)*1e-6
    Tg = np.array(d['gate_T_MeV']); rr = np.array(d['gate_rates_frwrd_bkwrd_mf_mb'])
    x = g*np.exp(-dE/Tg)
    g1 = (rr[:,1]*rr[:,3])/(rr[:,0]*rr[:,2]) / ((1+x)*np.exp(-Q/Tg)) - 1          # G1 binding
    T = np.array(d['HT_T_MeV']); Rm = np.array(d['HT_Yn'])/np.array(d['HT_Yp'])
    x0 = g*np.exp(-dE/T[0]); g1b = Rm[0]/((1+x0)*np.exp(-Q/T[0])) - 1             # G1b binding (T_start)
    m = (T >= 1) & (T <= 3); xm = g*np.exp(-dE/T[m])
    g2_lit = Rm[m]/((1+xm)*np.exp(-Q/T[m])) - 1                                     # G2 literal, diagnostic
    order = np.argsort(Tsm); Rsm_i = np.exp(np.interp(np.log(T[m]), np.log(Tsm[order]), np.log(Rsm[order])))
    g2_sm = Rm[m]/((1+xm)*Rsm_i) - 1                                                # G2 SM-normalized, diagnostic
    return dict(G1_maxabs=float(np.abs(g1).max()), G1_pass=bool(np.abs(g1).max() <= 0.01),
                G1b=float(g1b), G1b_pass=bool(abs(g1b) <= 0.01),
                G2lit_min=float(g2_lit.min()), G2lit_max=float(g2_lit.max()),
                G2sm_min=float(g2_sm.min()), G2sm_max=float(g2_sm.max()))
if __name__ == '__main__':
    for f in sorted(glob.glob(R + '*.json')):
        d = json.load(open(f)); print(d['label'], d['YPBBN'], d['DoH_x1e5'], gates(d))
