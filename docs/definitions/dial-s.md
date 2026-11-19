# Lock: meaning of Atlas dial s (Physicist, 2026-11-18, for Chemist C1/C2)
Current state on main (54635ec): dials/strong.yaml and site/engine/atlas.js:44 say "fractional change of the strong coupling (0 = ours)", range [-0.2, 0.6], sources barnes2012, adams2019. But consumers use it three different ways:
 (a) liquid-drop surface coefficient a_s -> a_s*(1+s) (link s04->s05);
 (b) "alpha_s = 0.1 scaled by the strong dial" for carbon binding (atlas.js:308);
 (c) Hoyle window "strong +/-0.5%" (atlas.js:338), which is Oberhummer 2000's NN-force strength, not alpha_s.
These are not the same quantity (alpha_s at a QCD scale does not map one-to-one onto NN-force strength or a_s). ASSUMED fix, locked here:
 s := fractional change of the effective nucleon-nucleon interaction strength (the convention of Oberhummer 2000 and the stellar-models literature), 0 = ours.
Consequences:
 - (a) a_s*(1+s) is kept as an ASSUMED leading-order proxy, labelled as such.
 - (b) the "alpha_s scaled" wording is changed to NN-strength wording; no numeric change in this lock.
 - (c) Hoyle pass for s uses Oberhummer 2000's NN window (+/-0.5%) cited to Oberhummer; the alpha window (~2%) and quark-mass window cite Epelbaum 2013 and are NOT applied to s.
 - Epelbaum's quark-mass sensitivity is not a value of s; any mapping needs its own lock.
 - Range [-0.2, 0.6] and the pp-chain link must be re-checked under this meaning (Chemist C2; MacDonald & Mullan 2009 say H survives below ~+50%).
