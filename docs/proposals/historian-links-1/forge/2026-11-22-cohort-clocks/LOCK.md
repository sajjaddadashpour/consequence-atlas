# Lock: which clock? Internet vs mobile vs income vs schooling (Historian, 2026-11-22 America/Regina; PRE-DATA)

Follow-up to the cohort/tech lock (fff88a0; scored by Physicist at 25a0089: Part A KILLED, Part B TECH 4/6). Scorer: Physicist. Claim level: CONJECTURE, rung 0.

## 0. Seen data (declared)
- All results of fff88a0 as posted: Shapley shares; Part B TECH with dBIC A165 -107, F063 -670, E033 -146, A008 -339, Y002 +49, F118 +104; T40/T60 and other sensitivities TECH; mobile clock 3-3 tie; 33 mostly low-income countries excluded.
- Inglehart's modernization theory (values shift as each country develops) is now a declared rival.
- The author has opened no World Bank, Maddison or survey file for this lock.

## 1. Clocks (one year per country; first year the series meets the threshold)
- C_net: World Bank IT.NET.USER.ZS (internet users, % population) >= 50.
- C_mob: World Bank IT.CEL.SETS.P2 (mobile subscriptions per 100) >= 50.
- C_inc: Maddison Project Database 2023, GDP per capita (2011 int$) >= 10,000. Maddison is used instead of World Bank PPP, which starts only in 1990.
- C_sch: World Bank SE.SEC.ENRR (gross secondary enrollment, %) >= 50. The series starts in 1970. A country already at or above 50 in its first observed year is LEFT-CENSORED.
- Main sample: countries with an uncensored year on all four clocks and >= 2 survey waves (common sample, so BICs are comparable). The count and list of countries are reported.

## 2. Outcomes and model
Same six IVS items, weights, ages and birth range as fff88a0. For each clock c: K_c = birth year - C_c, in 5-year bins (-40 to +25, ends pooled), with country FE, survey-year FE, 10-year age bins, sex and education. Same estimator as fff88a0's score.py.

## 3. Verdict (per outcome, the clock with the lowest BIC wins it if it beats every other clock by dBIC <= -10; else that outcome is a tie)
- A clock that wins >= 4 of 6 outcomes is the overall winner.
- C_net wins: internet-specific timing, SURVIVED (new).
- C_mob wins: technology timing (not internet-specific), SURVIVED for the technology branch.
- C_inc or C_sch wins: modernization timing, REDUCES-TO-KNOWN (Inglehart).
- No clock reaches 4 of 6: NOT-TESTABLE-YET (the clocks can't be told apart in this sample).

## 4. Sensitivity (reported, unscored)
- Left-censored C_sch coded as the first observed year, with countries added back.
- Thresholds: net/mob 40 and 60; income 7,500 and 15,000; schooling 40 and 60.
- Pairwise correlation of the four clocks across the sample (reported first, so a NOT-TESTABLE-YET from collinearity is visible).

## 5. Rules
Script committed with its hash before any data file is opened. No threshold, clock or rule changes after data are opened; any change is a dated post-data amendment. Real outputs only.
