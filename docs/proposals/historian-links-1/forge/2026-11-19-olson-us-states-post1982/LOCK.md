# LOCK — Olson institutional sclerosis on US states, post-1982 (Historian, 2026-11-19, pre-data)

Locked before any state income or growth data were downloaded, opened, plotted or summarised, for any year. Only documentation and metadata were read (BEA table name SAINC1, its line codes and its 1929-2025 coverage). Cites shared definition 349ca7f and Amendment 1 d7f9e2f (2x tolerance; no MIXED). Sibling of the cross-country lock da40ecb (`2026-11-19-olson-sclerosis/LOCK.md`), which is now scored NOT-TESTABLE-YET.

## Disclosure (what the author already knows; written after seeing the cross-country numbers)
This lock is written AFTER the room saw the cross-country result. It is not a rescue of that test: it uses a different unit (US states), a different predictor (Olson's own state age, not Polity5 `durable`) and data nobody in the room has opened.

Already seen by the room (cross-country, Polity5 `durable` x Maddison 2023, lock da40ecb):
- W1 1960-2010: b = +0.28, p = 0.084. W2 1980-2018: b = -0.03, p = 0.85. Verdict NOT-TESTABLE-YET.
- Unscored no-income variant, 1960-2010: b = +0.24, p = 0.047. Footnote only; one of several models looked at (Gelman & Loken 2013, "The garden of forking paths", working paper, Columbia University).

Already-known US-state tests. Bibliographic records checked on Crossref (DOI given). "Years" and "measures" are from the abstract, the publisher's page, or a named secondary source; where they could not be checked they are marked NOT VERIFIED. No full text of any of them was read for this lock, and no coefficient from any of them is recalled.

| Study | Verified record | Years used | Measures | Direction (as reported in abstract / secondary source) |
|---|---|---|---|---|
| Olson 1982, *The Rise and Decline of Nations* (Yale UP), ch. 4; state regressions at pp. 92-117 per Rogowski 1983 (page range not checked against the book) | book; Rogowski, *International Organization* 37:713-738, doi:10.1017/S0020818300034822 | 1960s to 1970s. Wallis & Oates' abstract says "the United States in the 1960s"; exact window NOT VERIFIED | years since statehood (Confederate states re-clocked, see Predictor); income growth, total and per capita (per Wallis & Oates via Coates, below); union members as share of non-farm employment 1964 and 1970 (per Heckelman, below) | older states grew more slowly (Olson) |
| Olson 1983, "The South Will Fall Again", *Southern Economic Journal* 49(4):917-932 | doi:10.2307/1058096 | NOT VERIFIED | extends the Confederate-states case | discussion of the South (per vLex summary of a later review) |
| Choi 1983, "A statistical test of Olson's model", in Mueller (ed.), *The Political Economy of Growth* (Yale UP) | volume verified via reviews (Krueger 1984, *JPE* 92:558, doi:10.1086/261245); chapter itself NOT VERIFIED on Crossref | 1965-76 (per Rasmussen & Zuehlke 1990) | years since statehood; total and per-capita income growth | statehood "highly significant" (per Rasmussen & Zuehlke) |
| Vedder & Gallaway 1986, *Public Choice* 51:93-100 | doi:10.1007/BF00141689 | NOT VERIFIED | relative state and local welfare spending as a coalition proxy (per Rasmussen & Zuehlke); union-related policy (conclusions page) | coalitions slow growth (conclusions page) |
| Nardinelli, Wallace & Warner 1987, *Public Choice* 52:201-213 | doi:10.1007/BF00116703 | NOT VERIFIED | state age; initial income (catch-up); years since 1954 school desegregation as an alternative clock (per Rasmussen & Zuehlke, fn 5) | no Olson effect; initial income explains most of the variation (abstract) |
| Gray & Lowery 1988, *APSR* 82(1):109-131 | doi:10.2307/1958061 | "late 1970s and early 1980s" (abstract) | respecified Olson model with new measures of interest-group influence (state interest-group counts) | respecification; result not recalled |
| Wallis & Oates 1988, *Kyklos* 41(3):397-417 | doi:10.1111/j.1467-6435.1988.tb01262.x | 1902-1982 panel (Coates, below); "the twentieth century" (abstract) | state age; government size; total and per-capita income growth | no convincing support; per-capita growth favours OLDER states; support only with total income and Confederate states dated from the Civil War (abstract + Coates) |
| Rasmussen & Zuehlke 1990, *Environment and Planning C* 8(1):1-11 | doi:10.1068/c080001 | 1961-84 (abstract); union data 1964-82 | YEARS since statehood or readmission (Confederate); union density; welfare burden; taxes; pooled panel | "each theory has some empirical support" (abstract) |
| Yu, Wallace & Nardinelli 1991, *Public Finance Quarterly* 19(1):80-93 | doi:10.1177/109114219101900105 | 20th century, with a sub-period "since 1975" (abstract); end year NOT VERIFIED | catch-up, state taxes and spending; whether state age is included NOT VERIFIED | catch-up dominates (abstract) |
| Crain & Lee 1999, *Economic Inquiry* 37(2):242-257 | doi:10.1111/j.1465-7295.1999.tb01428.x | annual panel; start about 1977 per a search summary, end NOT VERIFIED (necessarily before 1999) | extreme-bounds over many state-growth controls; state age reportedly among them (NOT VERIFIED) | not recalled |
| Heckelman 2000, *Public Choice* 104:319-327 | doi:10.1023/A:1005170910936 | NOT VERIFIED | interest-group measures; unit (states vs countries) NOT VERIFIED | not recalled |
| Reed 2009, *Economic Inquiry* 47(4):685-700 | doi:10.1111/j.1465-7295.2008.00127.x | 1970-1999 (abstract) | robust determinants of state growth; whether state age is included NOT VERIFIED | not recalled |
| Cole 2014, MPRA Paper 54455 (working paper) | RePEc record, not on Crossref | 48 states, 1975-2004 (abstract) | union membership share, not state age | inverted-U in union share (abstract) |
| McLaughlin & Wong 2025, SSRN 5191651 (working paper) | SSRN record, not on Crossref | NOT VERIFIED | state age (Confederate states from 1868 readmission) used as an INSTRUMENT for regulation, outcome real GDP growth | regulation lowers growth (summary); reduced form state age -> growth not recalled |

Secondary sources used for the table: Coates, "Do better paid elected officials produce better outcomes?" (working paper, UMBC, userpages.umbc.edu/~coates/work/salaryre.pdf); Heckelman, "Absolute and relative effects of interest groups on the economy", ch. 8 of an edited volume (heckeljc.sites.wfu.edu/papers/published/CollectiveChoice8.pdf).

Prior lean, stated plainly: from the abstracts, the US-state literature leans AGAINST Olson once initial income is controlled (Nardinelli et al.; Wallis & Oates). The author expects b near zero or positive. That lean is written down here so it cannot be claimed as a surprise later.

What is NOT claimed: that the post-1982 years are unseen by the field. Panel studies (Crain & Lee, Reed, Cole, McLaughlin & Wong) cover some post-1982 years, but none of them is known to report Olson's own specification (long-window cross-section of per-capita income growth on state age with ln initial income) for a window starting after 1984. The claim is narrower: nobody in this room has seen these numbers, and the windows below start after the last year of every verified state-age-on-growth test (Rasmussen & Zuehlke, 1984).

## Claim (mechanism hypothesis in political economy; ANALOGY to the room's chaos/order dial)
Olson 1982: the longer a polity has been stable, the more narrow distributional coalitions accumulate, so growth slows. Within the US, a state's political age stands in for that accumulation.
- Dial type: **TARGET** (whose outcome counts: shared vs group share), not GAIN.
- Rung: **1 (seen together).** State age is not an intervention; nobody assigned it. A result here is a correlation in observational data.

## Predictor (fixed now)
STATEAGE_t = t - A_s, in units of 100 years, read at the window's start year t.
- A_s = year of admission to the Union, for the 37 non-Confederate states in the sample: DE 1787, PA 1787, NJ 1787, CT 1788, MA 1788, MD 1788, NH 1788, NY 1788, RI 1790, VT 1791, KY 1792, OH 1803, IN 1816, IL 1818, ME 1820, MO 1821, MI 1837, IA 1846, WI 1848, CA 1850, MN 1858, OR 1859, KS 1861, WV 1863, NV 1864, NE 1867, CO 1876, ND 1889, SD 1889, MT 1889, WA 1889, ID 1890, WY 1890, UT 1896, OK 1907, NM 1912, AZ 1912. (AK 1959, HI 1959 for the 50-state variant.)
- For the 11 former Confederate states, A_s = year of readmission to representation in Congress: TN 1866; AR, FL, AL, LA, NC, SC 1868; VA, MS, TX, GA 1870.
- Coding status: **ADOPTED, not verified against Olson's text.** The book could not be opened to the page (the Internet Archive copy is loan-restricted). Secondary sources disagree on what Olson did: Rogowski 1983 says "since the end of Reconstruction"; Rasmussen & Zuehlke 1990 (following Dye 1980, *Journal of Politics* 42:1085-1107, doi:10.2307/2130737) and McLaughlin & Wong 2025 use readmission (1868). Readmission is adopted as primary because two independent tests use it; the 1877 end-of-Reconstruction clock is listed below as an unscored variant. This choice is made before any income data are seen.
- Bluntness caveat (same as the cross-country lock): state age is a proxy for the density of interest groups, not a measure of it. It also tracks region, settlement history, industrial vintage and climate. A null here says little about interest groups themselves; a direct measure (association counts per state, e.g. Gray & Lowery's) would be needed for that.

## Outcome and control (fixed now)
- Source: BEA Regional Economic Accounts, table **SAINC1** (State annual personal income summary), **LineCode 3 = per capita personal income (dollars)**, GeoFips = the states, annual, coverage 1929-2025 per BEA metadata. Vintage: the release current on the day of download; its release date is recorded in the run log, and the data are downloaded once.
- Deflator: national **PCE chain-type price index** (BEA NIPA Table 2.3.4, line 1, annual). BEA's state real personal income (SARPI, regional price parities) starts in 2008 and does not cover the start years, so it is not used. A single national deflator shifts every state's log income by the same constant, so b, its standard error and c are unaffected; only the intercept moves.
- g_s = 100 x [ln(y_s,T / P_T) - ln(y_s,t / P_t)] / (T - t), in %/yr, where y is nominal per-capita personal income.
- Control: ln(y_s,t / P_t), the convergence (catch-up) term. Mandatory; it is the known rival explanation (Nardinelli et al. 1987).

## Sample (fixed now)
Lower 48 contiguous states. DC excluded (not a state). Alaska and Hawaii excluded a priori: both admitted 1959 (extreme leverage on STATEAGE) and Alaska's income is dominated by oil and the Permanent Fund dividend. No other exclusions, no outlier trimming.

## Model (one primary model, fixed now)
g_s = a + b * STATEAGE_s,t + c * ln(real per-capita income_s,t) + e_s, OLS, HC1 standard errors, two-sided p from the t distribution with n - 3 = 45 degrees of freedom.

Windows (both scored; endpoint years only are needed):
- **W1: 1985 to 2019.** Starts the year after Rasmussen & Zuehlke's last year (1984), the latest verified state-age-on-growth window; ends 2019 to keep the COVID transfer surge out of the endpoint.
- **W2: 2000 to 2019.** Justified a priori: starts after the last year of every pre-2000 panel listed above (Crain & Lee 1999 and Reed's 1970-1999), so it is the cleanest window relative to the known literature. W2 is nested inside W1, so the two windows are not independent; this is why a single-window result alone cannot give SURVIVED.

## Prediction and verdicts (per window, then combined; mirrors lock da40ecb)
Olson predicts b < 0 (older states grow more slowly).
- Per window: **SUPPORT** if b < 0 with p < 0.05; **AGAINST** if b >= 0 (point estimate), or b > 0 with p < 0.05; **WEAK** otherwise (b < 0, p >= 0.05).
- Combined:
  - **SURVIVED, counted as REDUCES-TO-KNOWN:** SUPPORT in both W1 and W2. It is a replication of a relation Olson already reported in-sample in 1982, so it adds no new law; it says the relation persisted out of sample.
  - **KILLED:** AGAINST in both windows (b >= 0 in all scored windows), or b > 0 with p < 0.05 in either.
  - **NOT-TESTABLE-YET:** any other combination (windows disagree, or WEAK in either).
- No MIXED (Amendment 1).

## Reported alongside, not scored (declared now)
- V1: same model without the ln initial income term (how much is catch-up).
- V2: all 50 states.
- V3: Confederate clock set to 1877 (end of Reconstruction) for all 11.
- V4: growth of TOTAL real personal income (SAINC1 line 1) instead of per capita; Wallis & Oates report that Olson's support came only from total income.
None of these can change the verdict, and none is promoted to primary afterwards, whatever it shows.

## Does not count toward any "same law" claim. History-only.
