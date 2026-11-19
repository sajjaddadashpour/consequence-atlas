# LOCK — Olson institutional sclerosis (Historian, 2026-11-19, pre-data)

Locked before any data was downloaded or any regression was seen. Cites shared definition 349ca7f and Amendment 1 d7f9e2f (2x tolerance; no MIXED).

## Disclosure (what the author already knows)
- Olson 1982 argument and his anecdotes (West Germany and Japan grew fast after 1945; Britain slow). Olson's own US-state tests (ch. 4). A vague memory that later replications are mixed: not checked, no numbers recalled.
- No Polity5 DURABLE values and no Maddison growth figures have been opened for this lock.

## Claim (mechanism hypothesis in political economy; ANALOGY to the room's chaos/order dial)
Olson, *The Rise and Decline of Nations* (Yale UP, 1982): the longer a society has had stable institutions without upheaval, the more narrow interest groups accumulate and lock in rules that serve them, so growth slows. Upheaval clears them out.
- Dial type: **TARGET** (whose outcome counts: shared vs group share), not GAIN.

## Data (fixed now)
- Stability: Polity5 Annual Time-Series 1946-2018 (Center for Systemic Peace), variable `durable` = years since the last regime change (3-point Polity change within 3 years) or end of an interregnum. Read at the window's start year.
- Growth and initial income: Maddison Project Database 2023 (Bolt & van Zanden), GDP per capita (2011 int. $).
- Sample: every country with Polity5 `durable` at the start year and Maddison GDP per capita at both ends of the window, population >= 1 million at the start year. No other exclusions; no outlier trimming.

## Model (fixed now)
g = annualised growth of GDP per capita over the window, in %/yr.
g = a + b * ln(1 + durable_start) + c * ln(GDPpc_start) + e, OLS, HC1 standard errors.
The initial-income term is mandatory: catch-up after war damage is the known rival explanation for Olson's own anecdotes.

Windows (both scored):
- W1: 1960 to 2010.
- W2: 1980 to 2018.

## Prediction and verdicts (per window, then combined)
Olson predicts b < 0.
- Per window: SUPPORT if b < 0 with two-sided p < 0.05; AGAINST if b >= 0 (point estimate), or b > 0 with p < 0.05; WEAK otherwise (b < 0, p >= 0.05).
- Combined:
  - SURVIVED (= REDUCES-TO-KNOWN, a replication of a known hypothesis): SUPPORT in both windows.
  - KILLED: AGAINST in both windows, or b > 0 with p < 0.05 in either.
  - NOT-TESTABLE-YET: any other combination (windows disagree, or WEAK).
- No MIXED (Amendment 1).

## Reported alongside, not scored
- Same model without the initial-income term (shows how much of any Olson effect is catch-up).
- Same model on countries with durable_start >= 1 at independence before 1945 (removes the decolonisation cluster, where low durable and low income go together).
- Known limits written now: `durable` measures regime change, not destruction of interest groups (defeat, occupation and revolution are only partly captured); it counts from 1800 or independence, so old states are truncated.

## Does not count toward any "same law" claim. History-only.
