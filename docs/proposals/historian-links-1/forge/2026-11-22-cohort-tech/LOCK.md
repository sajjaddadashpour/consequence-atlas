# Lock: birth year vs technology as predictor of worldview (Historian, 2026-11-22 America/Regina; PRE-DATA)

Hypothesis (Sajjad, TOE room, 2026-11-22): the best predictor of how a person perceives reality is when they were born (shared news, events, technology); either the calendar birth date or technological similarity is what matters. Claim level: CONJECTURE, rung 0. Scorer: Physicist. Rival to be added by Biologist as an amendment (twins/heritability; WVS/EVS has no twin data, so that rival needs its own source).

## 0. Seen data (declared)
- No WVS or EVS microdata, tables of cohort results, or ITU country series have been opened by the author.
- Literature already known to the room, so its findings count as seen: Mannheim 1928; Ryder 1965; Mason et al. 1973 (APC problem); Inglehart 1977 and Inglehart & Baker 2000 (cohort shifts exist, but country/religious heritage differences are larger); Krosnick & Alwin 1989 and Schuman & Scott 1989 (impressionable years, roughly 15-25); Ghitza & Gelman 2014; Jensen & Oster 2009; Gentzkow 2006; Polderman et al. 2015.
- General knowledge that internet adoption was staggered across countries (e.g. Korea well before India). No exact adoption years have been looked up.

## 1. Data
- Outcomes: EVS/WVS Integrated Values Surveys 1981-2022 (trend file), respondents born 1940-2005, aged 18+.
- Technology dates: ITU "Individuals using the Internet (% of population)", World Telecommunication/ICT Indicators. For each country, T50 = first year the share is >= 50%. Countries that never reach 50% by their last survey wave are excluded from Part B (censored), and that count is reported.
- Countries enter Part B only if they have T50 and at least 2 survey waves.
- Record the sha256 of every downloaded file before analysis.

## 2. Outcomes (fixed; variable codes from the IVS codebook, item wording binding if a code differs)
1. A165 Most people can be trusted (binary)
2. F063 How important is God in your life (1-10)
3. Y002 Post-materialist index, 4 items (1-3)
4. E033 Left-right self-placement (1-10)
5. F118 Justifiable: homosexuality (1-10)
6. A008 Feeling of happiness (1-4)
Covariates: X002 year of birth; S003 country; S020 survey year; X025R education (3 levels); F025 religious denomination (as coded); X001 sex. Survey weights S017 used.

## 3. The age-period-cohort tie and how it is broken (stated assumption)
Within one country, cohort = survey year - age, so calendar cohort alone cannot be separated from age and period. Part B breaks the tie with staggered adoption: the technology cohort, K = birth year - T50(country), shifts by a different amount in each country, so it is not a linear function of age, period and calendar cohort pooled across countries. ASSUMED: age effects are common across countries and are captured by 10-year age bins; period effects are captured by survey-year fixed effects.

## 4. Part A (seen; caps at REDUCES-TO-KNOWN) - "best predictor"
For each outcome, a dominance (Shapley) R-squared decomposition of an OLS (logit pseudo-R2 for A165) with four blocks: calendar cohort (5-year birth bins), country, education, religious denomination. Survey-year fixed effects are partialled out first.
- Cohort has the largest share in >= 4 of 6 outcomes: strong version SURVIVED (contradicts seen Inglehart result, so flag for re-check).
- Cohort is not first but not last in >= 4 of 6: REDUCES-TO-KNOWN ("strong predictor, not the best"), matching seen literature.
- Cohort is last in >= 4 of 6: strong version KILLED.
- Otherwise: NOT-TESTABLE-YET.

## 5. Part B (fresh; the scored question) - calendar time or technology?
Two non-nested models per outcome, same sample, both with country FE, survey-year FE, 10-year age bins, sex, education:
- M_cal: + calendar cohort in 5-year birth-year bins.
- M_tech: + technology cohort K in 5-year bins (K binned from -40 to +25, ends pooled).
Compare BIC. dBIC = BIC(M_tech) - BIC(M_cal).
- dBIC <= -10 in >= 4 of 6 outcomes: TECH wins.
- dBIC >= +10 in >= 4 of 6: CALENDAR wins.
- Otherwise: NO WINNER, scored NOT-TESTABLE-YET.
Verdict mapping for Sajjad's either/or: TECH or CALENDAR are each SURVIVED for that branch and KILLED for the other. No winner is NOT-TESTABLE-YET.

## 6. Sensitivity (reported, unscored)
- T40 and T60 thresholds in place of T50.
- Mobile-cellular subscriptions per 100 (ITU) as the technology in place of internet.
- Drop countries with fewer than 3 waves.
- Unweighted.

## 7. Rules
- Analysis script committed with its hash before any data file is opened.
- No outcome, threshold or bin is changed after data are opened; any change is a dated amendment and is reported as post-data.
- Real outputs only.
