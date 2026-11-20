# Mamluk unrest coding: al-Maqrīzī, al-Sulūk, AH 648–844 (2026-11-19 America/Regina)

Text: redacted year files described by MANIFEST.json (sha256 d0191fc8e03ccd01970859bbd0bd1f3c3de30835b7b0f3c630fab5c6b6d2b1e3, after LOCK Amendment 7). All 197 Hijri years are headed and coded; none is missing.

## Coder 1 (primary series)
Fifteen fresh coders, one per batch: batch1 (648–700), 2a–2e (701–750 in tens), 3a–3e (751–800 in tens), 4a–4d (801–844 in elevens). Each wrote and hashed a from-memory list (memory_prelist.txt) before opening any year file, then read every assigned file in full, with no keyword searching, and checked every quote by script. Merged series: merged_years_coder1.csv (sha256 c4cd555b1ecf12892f4f61d1ad82b78c25c02e720a1dfdcaba54537dbc43a20d). 75 of 197 years have U_y = 1 (U1 or U3).

## Coder 2 (agreement)
A random 20% of years, `random.Random(20261119).sample(range(648,845), 39)`, listed in second_coder_sample.txt, coded by four more fresh coders (second a–d) who never saw coder-1 output. 

Agreement on the 39 years: U_y 38/39 (0.974), Cohen's κ = 0.948, which passes the lock's κ ≥ 0.6. The one disagreement is 789 AH (coder 1: 0, coder 2: U3, on the killing of the rebel Badr b. Sallām, which coder 2 calls borderline). Per category κ: U1 1.000, U2 1.000, U3 0.880, U4 0.897, P 1.000.

## Disclosures
- Discarded, never scored: the first batch-1 run (stopped for Amendment 6; its memory list is memory_prelist_discarded_first_batch1.txt), the first 801–844 run and the first 751–800 run (both searched by keyword instead of reading in full). Three runs stopped by a rate limit (old 701–750, first 771–780, first 791–800) wrote only memory lists and no codes.
- Batch 1 was given an inline brief slightly less detailed than coder_brief_template.txt; its category rules matched. All other coders got the template.
- Memory lists overlap the text in places (for example 651, 662, 694–695, 701, 754, 776, 806–808, 818). Physicist will report that overlap unscored, as agreed.
- Known file defects that coders flagged: page gaps in 688, 699, 713 and 805; 745 contains a duplicated stretch of 750 text (not coded under 745); 783 contains a retrospective on the 767 sack of Alexandria (not coded); the 753 plague passage may be misplaced (coded under 753 as the file stands).
- Sensitivity checks to report: U1 in 781 and 782 (crowds fighting inside amir factional wars), and U1 in 769 (a crowd raised by the sultan).

## Note (2026-11-20 08:15 America/Regina): stale per-year hashes in MANIFEST.json
MANIFEST.json still lists the pre-Amendment-7 per-year hashes for AH 783, 784, 788 and 789 (before 784 and 789 were split out of the 783 and 788 files). The redacted files themselves are unchanged since Amendment 7, and the manifest's own sha256 (d0191fc8e03ccd01970859bbd0bd1f3c3de30835b7b0f3c630fab5c6b6d2b1e3) still verifies. Those four per-year entries should be read as stale; the split script split_fix_784_789.py (sha256 6bb2b891…7b8) is the authority for those years. Flagged by Physicist during the item-19 scoring check.
