# CH-BBN-NSTAR-1 runner. Usage: run_point.py <codedir> <label> [dE_eV g_ratio tau_ratio variant|ONES]
import sys, os, json, time, numpy as np
codedir, label = sys.argv[1], sys.argv[2]
os.chdir(codedir); sys.path.insert(0, codedir)
import PRyM.PRyM_init as I
mode = sys.argv[3] if len(sys.argv) > 3 else None
info = {"label": label, "codedir": codedir, "tau_n": I.tau_n/I.second, "Omegabh2": I.Omegabh2,
        "DeltaNeff": I.DeltaNeff, "rates_dir": I.rates_dir, "nacreii": I.nacreii_flag, "smallnet": I.smallnet_flag}
if mode == "ONES":
    I.nstar_weak = lambda T: 1.0
    I.nstar_nucl = lambda T: 1.0
    info["hooks"] = "identity"
elif mode is not None:
    dE = float(sys.argv[3])*1e-6   # MeV
    g = float(sys.argv[4]); tr = float(sys.argv[5]); var = sys.argv[6]
    K2MeV = 1.0/I.MeV_to_Kelvin
    def fn(TK):
        T = TK*K2MeV
        return 1.0/(1.0 + g*np.exp(-dE/T))
    I.nstar_weak = lambda TK: fn(TK) + (1.0 - fn(TK))*tr
    if var == "B":
        I.nstar_nucl = fn
    info.update({"dE_eV": float(sys.argv[3]), "g_ratio": g, "tau_g_over_tau_e": tr, "variant": var})
import PRyM.PRyM_main as M
t0 = time.time()
c = M.PRyMclass()
r = c.PRyMresults()
info.update({"Neff": float(r[0]), "YPCMB": float(r[3]), "YPBBN": float(r[4]), "DoH_x1e5": float(r[5]),
             "He3oH_x1e5": float(r[6]), "Li7oH_x1e10": float(r[7]), "runtime_s": time.time()-t0})
if hasattr(c, "Hubble_of_Tg") and c.Hubble_of_Tg is not None:
    Ts = np.logspace(np.log10(0.07), 0.0, 200)
    info["H_grid_T_MeV"] = Ts.tolist()
    info["H_grid"] = [float(c.Hubble_of_Tg(T)) for T in Ts]
    info["Tg_min_MeV"] = c.Tg_min_MeV
    info["H_at"] = {str(T): float(c.Hubble_of_Tg(T)) for T in [0.01, 0.03, c.Tg_min_MeV]}
out = f"/workspace/chemist/bbn-code/runs/CH-BBN-NSTAR-1/{label}.json"
json.dump(info, open(out, "w"), indent=1)
print(label, info["YPBBN"], info["DoH_x1e5"], info["Neff"], round(info["runtime_s"],1))
