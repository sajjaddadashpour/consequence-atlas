# LOCKED: 100-origin sweep on Universe Starter v3
Lock stamp: 2026-11-13 14:11:22 -0600 (America/Regina). Written BEFORE any sweep run. No result of this sweep has been seen.
Brief: pt22u. Engine: universe_starter_v3/run/v3.ts (= sim3.ts, = canvas 73b9f73c page engine, readback-verified identical).
Mapping file for the 34 new ideas: origins/v3sweep/mapping_v3.json, sha256 b29a9dfd9eb38161bc29e02b43a704566451b59d7403c97a1cd17591fce6ae05
(21 FAITHFUL, 11 PROXY, 2 NOT RUNNABLE = LOCKED_UNIVERSE_STARTER_V3.md §2). Settings validated pre-lock: load, step 3x, no page clamp. The 66 v2 recipes are used unchanged from origins.json.

## 1. Arms
- A = idea settings merged over DEF (exactly as the page's Load). Seeds 1..5 (K = 5).
- Control (same seeds, same size/steps/dim as A):
  - P: DEF with family P, A's dim/size/steps/rho; start scattered; alphabet pm; d2 on; a2, ncons, records, light, leak, d3, feedback, attract, expand, attention, holes, open, bias, rsp, rcode all off/0; pc = 0.
  - F: A's size/steps; fstart random; noise off; gauge off; attention off; fixed on; audit off.
  - Q: A's dim/steps; one coherent walker: qn 1, deph 0, dephT 0, disorder 0, bath 0, measT 0.
  - C (cmode ca): A's dim/size/steps; 1D rule 30 / 2D B3/S23; cstart random, rho 0.5; rev off; mutate 0; echo = A's.
  - C (cmode potts): same as A with dh = 0 (unbiased Potts at the same temperature).
  - G: A's size/steps; gstart random; gnoise 0; grec off; echo = A's.
  - M pop: same as A with select off. M enum / consist: no control (DESCRIPTIVE).
- Half size (robustness), same seeds, applied identically to A and control: P/F/C/G size -> floor(size/2) (engine minimums apply); Q steps -> floor(steps/2); M pop popN -> floor(popN/2); M enum/consist steps -> floor(steps/2).
- A/B ideas (30, 71, 72, 75): add a secondary B arm, same seeds, full size only: 30 B = dim 1 size 4096 and dim 2 size 64 (two B arms); 71 B = gauge off; 72 B = expand off; 75 B = alphabet bin. A vs B reported with the same 3 SE rule; not used for the class.
- Sweep ideas (66 C, 68 P): 5 blocks b = 1..5, each 20 setups sampleCfg(fam, mulberry32(b), 1000 + i) (the page's Sweep). Report verdict shares mean ± SE over blocks; class DESCRIPTIVE. No half size.

## 2. Primary measures and "differs"
- P: density, clustering, dS. F: density (vortices/site), xi, energy. Q: beta, sigma (entropy too when both arms have qn = 1). C ca: density, activity, dS. C potts: domFrac, walls. G: S/Sref, dipRel. M pop: fitEnd, fitSlope.
- A measure differs if |mean_A − mean_ctl| > 3·SE, SE = sqrt(sd_A²/5 + sd_ctl²/5) (sample sd). If SE = 0, differs iff |Δ| > 1e-9. A measure that is null (or non-finite) in any seed of either arm is not compared.
- Robust: the same measure differs at full and half size with the same sign.

## 3. Classes (first that applies, judged on A)
1. NOT RUNNABLE (46, 83). DESCRIPTIVE (M enum/consist; Sweep ideas 66, 68).
2. FAILS: ≥ 3/5 full-size A verdicts FAILS.
3. DIES: ≥ 3/5 full-size A verdicts DIES.
4. STRUCTURE: robust difference AND structure marker in ≥ 3/5 seeds at both sizes. Markers: P clustering ≥ 2 (with ≥ 10 particles) or copies > 0 at the end; F verdict ORDERED or xi ≥ L/4; Q LOCALIZED; C potts ORDERED. (C ca, G, M have no marker.)
5. DIFFERS: robust difference, no marker.
6. NOT ROBUST: some measure differs at exactly one size, or at both with opposite signs.
7. INERT: no measure differs at either size.
Flags (not classes): "marker also in control"; "control DIES"; TIMEOUT if any run > 180 s (then the arm is reported incomplete).
"Surprises" in the write-up = results that contradict the idea's own one-line claim; chosen by reading, labelled as judgement.

## 4. Honesty rules
No re-running with other seeds, sizes or settings after seeing results. Any bug found mid-run is fixed, logged as an addendum, and the WHOLE sweep re-run. All outputs saved raw (origins/v3sweep/raw/*.json).
A result here is a statement about a toy recipe, never about cosmology.
