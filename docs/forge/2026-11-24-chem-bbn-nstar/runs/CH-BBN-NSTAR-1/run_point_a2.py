# CH-BBN-NSTAR-1 A2 runner. Usage: run_point_a2.py <codedir> <label> [SM | dE_eV g_ratio tau_ratio variant]
import sys, os, json, time, numpy as np
codedir, label = sys.argv[1], sys.argv[2]
os.chdir(codedir); sys.path.insert(0, codedir)
import PRyM.PRyM_init as I
mode = sys.argv[3] if len(sys.argv) > 3 else "SM"
info = {"label": label, "codedir": codedir, "tau_n": I.tau_n/I.second, "Omegabh2": I.Omegabh2,
        "DeltaNeff": I.DeltaNeff, "rates_dir": I.rates_dir, "nacreii": I.nacreii_flag, "smallnet": I.smallnet_flag}
K2MeV = 1.0/I.MeV_to_Kelvin
g = 0.0; dE = 0.0
if mode != "SM":
    dE = float(sys.argv[3])*1e-6; g = float(sys.argv[4]); tr = float(sys.argv[5]); var = sys.argv[6]
    def x(TK): return g*np.exp(-dE/(TK*K2MeV))
    def fn(TK): return 1.0/(1.0 + x(TK))
    I.nstar_weak   = lambda TK: fn(TK) + (1.0 - fn(TK))*tr      # n->p total (all channels), unchanged from run 1
    I.nstar_weak_b = lambda TK: 1.0 + tr*x(TK)                   # A2: p->n total (all channels)
    if var == "B": I.nstar_nucl = fn
    info.update({"dE_eV": float(sys.argv[3]), "g_ratio": g, "tau_g_over_tau_e": tr, "variant": var})
import PRyM.PRyM_main as M
t0 = time.time(); c = M.PRyMclass(); r = c.PRyMresults()
info.update({"Neff": float(r[0]), "YPCMB": float(r[3]), "YPBBN": float(r[4]), "DoH_x1e5": float(r[5]),
             "He3oH_x1e5": float(r[6]), "Li7oH_x1e10": float(r[7]), "runtime_s": time.time()-t0})
# sanity-gate exports
Q = float(I.mn - I.mp)
info["Q_MeV"] = Q
info["HT_T_MeV"] = c.HT_T_MeV.tolist(); info["HT_Yn"] = c.HT_Yn.tolist(); info["HT_Yp"] = c.HT_Yp.tolist()
Tg = np.logspace(0.0, np.log10(3.0), 200)
rates = [c.HT_rates(T/K2MeV) for T in Tg]
info["gate_T_MeV"] = Tg.tolist(); info["gate_rates_frwrd_bkwrd_mf_mb"] = rates
out = f"/workspace/chemist/bbn-code/runs/CH-BBN-NSTAR-1-A2/{label}.json"
os.makedirs(os.path.dirname(out), exist_ok=True); json.dump(info, open(out, "w"), indent=1)
print(label, info["YPBBN"], info["DoH_x1e5"], round(info["runtime_s"],1))
