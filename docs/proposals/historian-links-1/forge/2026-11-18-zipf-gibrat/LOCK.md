# LOCK: Zipf / Gibrat for city sizes (Historian, 2026-11-18)

Status: LOCKED pre-data, 2026-11-18 20:15 America/Regina. No analysis code has been written or run. No city-size distribution, exponent, or growth regression has been computed from the locked file. Not pushed.
This is a new-sample test, not a replication of Soo 2005 (see §7).

Labels used: established / mainstream hypothesis / CONJECTURE.
Verdicts used: SURVIVED / KILLED / REDUCES-TO-KNOWN / NOT-TESTABLE-YET, plus MIXED as defined in §6 (an explicit extra verdict for estimator disagreement; not silently mapped to the other four).

## 1. Claims

- Z (Zipf regularity). In the locked 2020 sample, the upper-tail city-size distribution has Pareto exponent α = 1 (the rank-size rule). Label: mainstream, empirically contested and estimator-dependent (Soo 2005, already seen; see §7).
- G (Gibrat in the upper tail). For the same cities, log growth from 2010 to 2020 is independent of log size in 2010 (slope b = 0). Label: mainstream hypothesis, empirically contested.
- E (Gibrat explains Zipf). Size-independent growth in the upper tail yields Zipf (Gabaix 1999, *QJE* 114(3):739–767, doi:10.1162/003355399556133). Label: established as a derived result under Gabaix's stated conditions; applying it as the explanation of real city systems is a mainstream hypothesis. Even if E is not killed, a pass is recorded as REDUCES-TO-KNOWN (Gabaix 1999), not as a new law.
- Cross-field identity with word frequencies, incomes or biological genera (Simon 1955, *Biometrika* 42(3-4):425–440, doi:10.1093/biomet/42.3-4.425) is same-mathematics only. Label: CONJECTURE. This lock does not test that identity.

Link type: same-mathematics, not one causal mechanism.

## 2. Data (URL checked 2026-11-18, America/Regina)

Soo's source, Thomas Brinkhoff, City Population, http://www.citypopulation.de, still answers HTTP 200, but it is a live website, not a frozen, openly downloadable extract of the 1972–2001 snapshots Soo used (75 countries collected, Zipf reported for 73 latest-year samples; I could not find in the text why two were dropped). That extract is therefore not the locked sample.

Locked file (open, named, downloadable; year and source both unused by Soo):

- United Nations, Department of Economic and Social Affairs, Population Division (2025). *World Urbanization Prospects: The 2025 Revision*, Online Edition. Suggested citation from the file's info sheet. Licence: CC BY 3.0 IGO.
- File 21: "Population Residing in Cities with 50,000 Inhabitants or More at Mid-Year by Country or area, 1975-2050 (thousands)". Document ID POP/DB/WUP/Rev.2025/F21.
- URL (HTTP 200 on 2026-11-18): https://population.un.org/wup/assets/Download/Cities/WUP2025-F21-DEGURBA-Cities_Pop.xlsx
- Catalogue page: https://population.un.org/wup/downloads?tab=Cities
- Downloaded copy (same day): 10,671,837 bytes; HTTP last-modified Fri, 06 Mar 2026 19:35:48 GMT (13:35 America/Regina that day); sha256 `3a96030d87aec6c1c50f658d5321067d6345e1ab936c5d2854524f972caa75c0`.
- Sheets verified by name and headers only: `info`, `Data`, `NOTES`. The `Data` header is: Index, Location, Notes, LocID, ISO3_Code, ISO2_Code, City_Code, City_Name, Capital, PWCent_Longitude, PWCent_Latitude, then annual mid-year columns 1975 through 2050 inclusive. Columns 2010 and 2020 exist. No per-country counts, exponents, or growth statistics were computed.
- Unit, from the info sheet: DEGURBA "cities (densely populated areas)": at least 1,500 inhabitants per km² and at least 50,000 inhabitants, on 1 km² population grids. Values are in thousands of persons.
- The info sheet does not state which years are estimates and which are projections. This lock therefore uses mid-2020 (Zipf) and mid-2010 to mid-2020 (Gibrat), both before the 2025 revision, and does not use years after 2024.

If a later download has a different sha256, record the new hash and stop if the sheet names, header, units, or year columns differ; do not proceed silently.

## 3. Sample rules (fixed before seeing any size distribution)

Zipf sample, per country or area, mid-2020:

1. Keep a `Data` row only if `City_Name` is non-empty and `ISO3_Code` is a three-letter code (this drops regional aggregates, if any).
2. A city is in the 2020 sample iff the 2020 cell is numeric and population ≥ 50,000 inhabitants, i.e. the cell value is ≥ 50 (thousands). Empty or non-numeric cells are out.
3. Country or area i is eligible for Z iff it then has n_i ≥ 20 cities (the same minimum Soo used).
4. If the number of eligible countries N_Z is < 20, claim Z is NOT-TESTABLE-YET.

Gibrat sample, per eligible unit, 2010–2020:

1. Start from cities with numeric 2010 population ≥ 50,000 inhabitants. Keep them if 2020 is also numeric, even if 2020 has fallen below 50,000 (no selection on ending size). Drop the city if 2020 is missing.
2. Unit i is eligible for G iff that 2010-based sample has n_i^{G} ≥ 20.
3. The explanation test E uses the intersection of Z-eligible and G-eligible units, size N_E. If N_E < 20, claim E is NOT-TESTABLE-YET.

Ties for Zipf ranks: sort by 2020 population descending, then by `City_Code` ascending, and assign unique ranks 1…n (deterministic; no random tie-break). Logs are natural logs. Populations may be left in thousands or converted to persons; ranks and α are invariant to that choice if it is applied uniformly.

The eligible country list is whatever survives these rules. It is not picked in advance and was not inspected.

## 4. Estimators (fixed)

Two official Zipf estimators, both at the country level, 95% two-sided intervals. α = 1 is rejected if the interval excludes 1.

- OLS-GI (Gabaix and Ibragimov 2011, *JBES* 29(1):24–39, doi:10.1198/jbes.2009.06157). This is not Soo's OLS. Soo (2005, *Reg. Sci. Urban Econ.* 35(3):239–263, doi:10.1016/j.regsciurbeco.2004.04.004; full text read as CEP Discussion Paper 641) ran log(rank) = log A − α log(size) with heteroskedasticity-robust standard errors, and already noted, following Gabaix and Ioannides (2004, *Handbook of Regional and Urban Economics* vol. 4; cited by Soo as 2002, forthcoming), that those OLS standard errors are far too small. The official OLS column here is the later correction: ln(rank − 1/2) = a − α ln(size), with se(α̂) = α̂ √(2/n), not the OLS or White standard error. 95% CI: α̂ ± 1.96 se(α̂).
- Hill (Hill 1975, *Ann. Statist.* 3(5):1163–1174, as written in Soo CEP DP 641, eqs. (5)–(6)). For sizes x_1 ≥ … ≥ x_n,

  α̂ = (n−1) / Σ_{i=1}^{n−1} (ln x_i − ln x_n)

  and the printed standard-error formula (6) is

  σ_n(α̂) = α̂² [ (1/(n−1)) Σ_{i=1}^{n−1} (ln x_i − ln x_{i+1})²  −  1/α̂² ]^{1/2} n^{−1/2}.

  95% CI: α̂ ± 1.96 σ_n(α̂). If the term in brackets is negative or σ_n is not a real number, fall back to the classical Hill standard error α̂ / √(n−1) and flag that country as "Hill SE fallback". I transcribed (6) from page 9 of CEP DP 641; I have not opened the typeset RSUE page of (6). If the journal formula differs, the journal wins and the difference is recorded; the kill thresholds in §6 do not change.

Soo's uncorrected OLS and his quadratic log-rank regression are allowed only as labelled diagnostics. They are not official kill statistics.

Gibrat estimator, per G-eligible unit: g = ln(S_2020) − ln(S_2010), regression g = a + b ln(S_2010) + e, heteroskedasticity-robust (HC1) standard errors. 95% CI for b: b̂ ± 1.96 se_robust(b̂). Gibrat is rejected in that unit if the interval excludes 0.

## 5. What was already seen (disclosure)

From Soo 2005 (abstract and CEP DP 641 text), already read before this lock: Zipf was rejected for 53 of 73 countries with OLS and for 30 of 73 with Hill; with Hill, 43 of 73 were not significantly different from 1 (24 above, 6 below). Historian earlier misspoke in the room ("holds in fewer than half"); that is true only for OLS. Those figures must not be used as the verdict here. Headers and the info sheet of WUP F21 were opened to verify the URL, units and year columns. No Zipf or Gibrat statistic has been computed from WUP.

## 6. Kill / survive rules (numeric, fixed in advance)

Let N_Z be the number of Z-eligible countries. For estimator E ∈ {OLS-GI, Hill}, let R_E be the number of those countries whose 95% CI for α excludes 1, and let m_E be the median of α̂ under that estimator.

Claim Z:

- KILLED if R_Hill / N_Z ≥ 0.50 and R_OLS-GI / N_Z ≥ 0.50.
- SURVIVED if R_Hill / N_Z < 0.50 and R_OLS-GI / N_Z < 0.50 and both m_Hill and m_OLS-GI lie in [0.85, 1.15].
- MIXED if neither of those two rules is met (the two estimators disagree on the majority call, or majority non-rejection holds but a median α̂ lies outside [0.85, 1.15]). MIXED is defined here as an explicit overall verdict: the typical-α=1 claim is neither confirmed nor killed under the two-estimator majority rule. It is not mapped to SURVIVED, KILLED, or NOT-TESTABLE-YET.
- NOT-TESTABLE-YET if N_Z < 20, or if the file fails the identity check in §2.

Claim G (reported separately, among G-eligible units, N_G of them):

- KILLED if the 95% CI for b excludes 0 in a majority (≥ 50%) of G-eligible units.
- SURVIVED if it contains 0 in a majority and the median b̂ lies in [−0.05, 0.05] per log-point of 2010 size.
- Otherwise MIXED, with the same meaning as above (majority and median rules split).
- NOT-TESTABLE-YET if N_G < 20.

Claim E, among the N_E jointly eligible units (and only if N_E ≥ 20):

- Let Z_hold mean the Hill 95% CI contains 1, and G_hold mean the 95% CI for b contains 0.
- KILLED if the number of units with (Z_hold and not G_hold) is at least max(5, ceil(0.25 N_E)), or the number with (G_hold and not Z_hold) is at least max(5, ceil(0.25 N_E)). These are the two breaks already named in the proposal record: Gibrat fails where Zipf holds, or Gibrat holds where Zipf fails.
- If E is not killed: record REDUCES-TO-KNOWN (Gabaix 1999). Do not record SURVIVED as a new result.
- NOT-TESTABLE-YET if N_E < 20.

A miss within a factor of 2 in an upkeep-threshold U_eff test is NOT-TESTABLE-YET under Amendment 1 (d7f9e2f) to the shared copy-decay definition (349ca7f). That tolerance does not apply here: this lock does not use u, U or sigma.

## 7. Why this is not a Soo replication

Soo's rejected-in-53/73 (OLS) and 30/73 (Hill) results are already seen, so a lock on his citypopulation.de 1972–2001 extract would only be a replication. This lock uses a later year (2020), a different open file (WUP 2025 F21), and a uniform DEGURBA 50,000 cutoff rather than each country's own administrative threshold (≥ 10,000 in Soo). OLS-GI replaces Soo's uncorrected OLS as an official estimator; Hill is kept as in Soo. Software is whatever implements §4 faithfully (Python 3 with numpy, scipy and pandas, or an equivalent R stack). No seed is required for Z (deterministic given the file). Gibrat uses no random numbers.

## 8. Run order

1. Download F21, confirm sha256 or record a documented replacement that still matches §2.
2. Apply §3; report N_Z, N_G, N_E and the eligible ISO3 lists; do not drop units after seeing α̂ or b̂.
3. Estimate official OLS-GI and Hill; then Gibrat; then apply §6.
4. Diagnostics only after the verdict: Soo-style uncorrected OLS, quadratic term, kernel densities of α̂.

No code for those steps is included in this commit.

## Amendment 1 (2026-11-18, pre-data)

Dated 2026-11-18 20:18 America/Regina, before any city-size or growth statistic has been computed from the locked file. The text above is unchanged. This amendment drops MIXED and splits the lock into separate claims. Each claim receives exactly one of SURVIVED / KILLED / REDUCES-TO-KNOWN / NOT-TESTABLE-YET. Where this amendment and §6 conflict, this amendment wins.

Claim Z (Zipf, mid-2020), among the N_Z eligible countries, using the two official estimators OLS-GI and Hill:

- NOT-TESTABLE-YET if N_Z < 20, or if the file fails the identity check in §2.
- KILLED if both estimators reject α = 1 (95% CI excludes 1) in at least half of eligible countries.
- SURVIVED if both estimators reject in fewer than half of eligible countries and both median α̂ lie in [0.85, 1.15].
- KILLED if both estimators reject in fewer than half but either median α̂ falls outside [0.85, 1.15].
- NOT-TESTABLE-YET if the estimators disagree on the majority (one rejects in at least half, the other in fewer than half).

Claim G (Gibrat, 2010–2020), among the N_G eligible units. The lock has one official estimator, HC1 OLS of log growth on log 2010 size, not two. The analogous median band is the one already locked in §6: median b̂ in [−0.05, 0.05] per log-point of 2010 size. There is no second official estimator, so estimator disagreement cannot arise.

- NOT-TESTABLE-YET if N_G < 20.
- KILLED if that estimator rejects b = 0 (95% CI excludes 0) in at least half of eligible units.
- SURVIVED if it rejects in fewer than half and the median b̂ lies in [−0.05, 0.05].
- KILLED if it rejects in fewer than half but the median b̂ falls outside [−0.05, 0.05].

Claim E (Gibrat explains Zipf) is unchanged: KILLED at max(5, 25%) mismatches as written in §6; otherwise REDUCES-TO-KNOWN (Gabaix 1999); NOT-TESTABLE-YET if N_E < 20.

MIXED is no longer a verdict for any claim in this lock.
