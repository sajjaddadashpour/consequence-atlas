# Religion layer of the causal map (patch note)

**Author of the draft:** Priest (TOE group). **Filed:** 2026-11-19, America/Regina (CST, UTC-6), as a patch only: no new atlas stage, and no live link whose label or rung is stronger than the draft allows. Nothing here is rung 3, and nothing is labelled ESTABLISHED.

**Source.** `/workspace/priest/causal-map/RELIGION_CAUSAL_LAYER.md` at commit `7238fceb52e73920ae622066b20c8c7838e01184` (short `7238fce`; 2026-11-19 19:45:21 America/Regina; message: "Draft religion layer of the causal map (8 links)"). The working tree matched that commit (sha256 `30650bbae2cae5a0e04f80ee7d5a2b53e3e24bce7d550b6c094acf4762150fb7`).

This branch is stacked on PR #23 (`philosopher-evidence-rung-1`), because the evidence-rung fields are not yet on `main`. After #23 merges, retarget this PR to `main`. PR #24 was left untouched; `docs/missing-experiments.md` is not edited here.

**Scope.** Each live row is a causal link in which religion (a practice, a rule, a belief, or a tradition's transmission method) is a cause or an effect, with a real mechanism and a published result. Traditions are described as their practitioners would recognise them. Nothing here claims that science proves or disproves a faith. A chain cannot outrun its weakest step.

## Live crosslinks (R1-R5, R8)

| Draft | Proposed id | Filed as | Fields | Label | Rung | Notes |
|---|---|---|---|---|---|---|
| R1 | `l.religion.disaster-coping` | `x.religion.disaster-coping` in `atlas/crosslinks/physics__religion__disaster-coping.yaml` | physics (no geology field; earthquake / unpredictable disaster) → religion (effect) | MAINSTREAM-HYPOTHESIS | 2 | Exogenous quake timing (Christchurch; Bentzen geological risk). Bentzen numbers are from a 2018 author PDF; typeset EJ 2019 was not opened. |
| R2 | `l.religion.costly-requirements` | `x.religion.costly-requirements` in `atlas/crosslinks/religion__history__costly-requirements.yaml` | religion → history (commune longevity) | MAINSTREAM-HYPOTHESIS | 1 | Already-seen Sosis and Bressler 2003 sample, not re-scored. Signaling vs screening is open. The biological-handicap parallel is analogy (rung 0) and is not a second live card. Inbox item 14. |
| R3 | `l.religion.protestant-literacy` | `x.religion.protestant-literacy` in `atlas/crosslinks/religion__economics__protestant-literacy.yaml` | religion → economics | MAINSTREAM-HYPOTHESIS | 2 | Rung 2 rests on distance to Wittenberg used as an instrumental variable, with the exclusion restriction assumed. Numbers are from IZA DP 2886; typeset QJE 2009 was not opened. |
| R4 | `l.religion.extreme-ritual-giving` | `x.religion.extreme-ritual-giving` in `atlas/crosslinks/religion__economics__extreme-ritual-giving.yaml` | religion → economics (charitable giving) | MAINSTREAM-HYPOTHESIS | 1 | Ordeal / perceived pain, not synchrony. Who performs Kavadi is not randomly assigned. |
| R5 | `l.religion.moralistic-gods-impartiality` | `x.religion.moralistic-gods-impartiality` in `atlas/crosslinks/religion__economics__moralistic-gods-impartiality.yaml` | religion → economics (impartial allocations) | MAINSTREAM-HYPOTHESIS | 1 | Beliefs measured, not assigned; priming arm had no overall effect. Do not merge with R6. |
| R8 | `l.religion.ramadan-fasting-growth` | `x.religion.ramadan-fasting-growth` in `atlas/crosslinks/religion__economics__ramadan-fasting-growth.yaml` | religion → economics | MAINSTREAM-HYPOTHESIS | 2 | Calendar-by-latitude natural experiment. Abstract-plus-design only; numeric claims unverified until the typeset QJE is opened. No numbers taken from the CID working paper. |

## R6 — retracted / contested note (not a live link)

**Draft id:** `l.religion.moralizing-gods-complexity`. **Not filed** as `atlas/crosslinks/*.yaml`. The 2019 Letter is retracted; there is no standing causal result to carry as a live link. The historical direction (moralizing gods versus the rise of social complexity) is contested and is a gap. Pointer: proposed test G1, below. Do not merge this note with R5 (`x.religion.moralistic-gods-impartiality`), which is a different claim (impartiality in a game).

**Cause and effect as proposed, direction unsettled:** moralizing gods ↔ rise of social complexity.

**Why it is not a live link.** The "big gods" hypothesis had said morally concerned, punitive gods helped large societies hold together. Whitehouse et al. 2019, *Nature* 568(7751):226-229, doi:10.1038/s41586-019-1043-4, used Seshat to argue the reverse timing: complex "megasocieties" came first. That Letter was **retracted**. Crossref lists the work as a retracted article, updated by the Retraction Note doi:10.1038/s41586-021-03656-3 (publisher update 2021-07-07; Retraction Watch 2021-07-06). **Do not use Whitehouse et al. 2019 as evidence.**

The Retraction Note (Whitehouse et al. 2021, *Nature* 595(7866):320, doi:10.1038/s41586-021-03656-3, full text as used in the draft): Beheim and colleagues argued that treatment of missing data called the primary results into question; the authors accept that they "should have labelled moralizing gods as 'absent' or 'inferred absent' rather than 'unknown' … rather than converting 'NAs' to zeros during the phase of analysis." Some co-authors did not agree with the retraction. The note points to later preprints; those preprints were **not opened** in the draft and do not restore the retracted Letter.

**Beheim et al. 2021** (*Nature* 595(7866):E29-E34, doi:10.1038/s41586-021-03655-4; accepted manuscript opened in the draft, typeset *Nature* pages not opened): 61% (n = 490) of moralizing-god observations passed to the tests were originally "Unknown"; recoding them as absent produced a correlation r = 0.97 between missingness and coded absence. Only one of 12 key regions (Middle Yellow River Valley) has a known absence before a first appearance, and that point is disputed. When the analysis is confined to extant data, or missing values are imputed by standard methods, "the reported finding is reversed: moralizing gods precede increases in social complexity." Shifting each "first appearance" back by one century also reverses the main result (accepted-MS wording). Beheim's reanalysis is about missing-data treatment, not a new locked causal test, so it does not by itself earn rung 2. There is no settled mechanism and no locked prediction.

**Label, if this were scored:** RETRACTED as a published *Nature* result; the historical direction is CONTESTED and a GAP. No standing evidence rung.

### G1 (proposed). Moralizing-gods timing, after a locked recoding of missingness

- **id / filed by / date:** G1 (proposed) / Priest / 2026-11-19. Status: proposed in the draft and repeated here only, **not filed** to the inbox, not locked, not hashed.
- **Pattern in field A (religion):** appearance, in a historical dataset, of "moralizing gods" (morally concerned, punitive supernatural agents), with missing values treated as missing, not as absence.
- **Pattern in field B (history / social complexity):** a pre-registered social-complexity threshold (the threshold and the god codes locked before any timing comparison).
- **Link type:** same-mechanism to be checked (big-gods cultural-evolution hypothesis). Not analogy-only, and not settled by the retracted Letter.
- **Mechanism or published result:** Beheim et al. 2021 showed that Whitehouse et al. 2019's "complexity first" result is an artefact of recoding "Unknown" as "absent" (61%, n = 490, in the accepted MS). On extant data or standard imputation, the accepted MS says the timing reverses. That is a critique, not a locked test.
- **Label:** CONTESTED; the 2019 Letter is RETRACTED.
- **What would break it (kill line):** On a named dataset (revised Seshat or a declared successor), after (a) treating moralizing-gods missingness as missing, not as absence, (b) locking the complexity threshold, the god variable, and the inclusion rule before any dates are compared, and (c) restricting to polities with both dates observed: let p be the share of those polities in which the first recorded moralizing-god date precedes the date of crossing the locked complexity threshold. Compare p to a pre-specified null that preserves each series' own bunching (a circular shift of one series relative to the other, run at least 10,000 times). **KILLED** if p is not greater than the null at a pre-registered 95% interval (complexity-first remains as common as, or more common than, gods-first once missingness is not recoded as absence). **SURVIVED** if p exceeds that null. **NOT-TESTABLE-YET** if fewer than a locked floor of polities (lock the floor in advance; a suggested floor is 20) have both dates observed, or if a pre-specified sensitivity (for example an alternative locked threshold) would flip the verdict. A later preprint by the original authors, unless it is this lock, does not score the test.
- **Data/sources needed:** a public coding table with polity, year (or century) of first moralizing-god evidence, year of crossing the locked complexity threshold, and a missingness flag that is not silently recoded. Beheim et al. 2021 and the retraction note are the background, not the run.

## R7 — pointer to inbox item 5 (not a live link)

**Draft id:** `l.religion.sacred-text-error-correction`. **Not filed** as a live crosslink. The rate contrast is **NOT-TESTABLE-YET**.

The claim, as drafted: built-in error-correcting copy practices (Vedic multi-order recitation, Masoretic letter-word-verse counts, and careful Qur'anic oral-plus-rasm transmission) should show a lower accidental per-copy error rate than plainly copied comparison corpora. Official readings (qira'at, ketiv/qere, Vedic sakhas) are not scored as errors. Practices themselves are treated as established in the item-5 lock; the rate contrast has not been scored. After a real screen, no qualifying Group E DIRECT rows (Vedic, Masoretic, Qur'anic parent-child or Royse-style singulars with a word count) were filled. Closest miss (Fedeli 2015) is not G = 1. Track S / Track A Group P (Greek NT) is filled and is the comparison side only. A same-mechanism link to Eigen 1971 / PRR D3, if drawn now, would be conjecture / analogy or same-mathematics until rates exist on both sides (rung 0). The item-5 lock is a prediction; it has not been confirmed, so this is not rung 3.

**Pointer:** inbox item 5, already recorded in `docs/missing-experiments.md` (section "Item 5 — sacred-text transmission (error-corrected vs plain copy rates)"), with lock v1 `468f12f` and Amendments 1-3 through `ff8b344`. That entry is not duplicated or edited in this PR, so this patch does not collide with open PR #24. Eigen 1971 (doi:10.1007/BF00623322) is already in `sources/` as `eigen1971`.

## Citation check (independent of the draft log)

Every DOI named in the draft was resolved again on api.crossref.org on 2026-11-19 (America/Regina). doi.org was also queried; some publisher pages returned 403 or, for Eigen 1971, 500, but Crossref metadata was enough to confirm those records. `verified: true` on new `sources/` rows means the bibliographic record was confirmed, not that every number was re-read from typeset pages.

**DOI corrections, confirmed:**

- Sosis and Bressler 2003 is registered as 10.1177/1069397103037002003. The DOI printed on the PDF, 10.1177/1069397103251426, returns 404 on Crossref and on doi.org, and is not used.
- Zahavi 1975 is 10.1016/0022-5193(75)90111-3. The common typo 10.1016/0022-5193(75)90011-3 returns 404 on Crossref and on doi.org, and is not used.

**Sources added to `sources/sources.json`** (all Crossref-OK): `sibley-bulbulia2012`, `bentzen2019`, `sosis-bressler2003`, `sosis2000`, `iannaccone1994`, `zahavi1975`, `grafen1990`, `becker-woessmann2009`, `xygalatas2013`, `purzycki2016`, `campante-yanagizawa-drott2015`.

**Cited in this note only, not added as live-link sources:** Whitehouse et al. 2019 (doi:10.1038/s41586-019-1043-4, Crossref title begins "RETRACTED ARTICLE", updated by the retraction note); Retraction Note (doi:10.1038/s41586-021-03656-3); Beheim et al. 2021 (doi:10.1038/s41586-021-03655-4). All three resolve on Crossref.

**Looked up and left unused, as in the draft** (DOIs verified, full texts not used as rows): Clingingsmith, Khwaja and Kremer 2009, Hajj lottery, doi:10.1162/qjec.2009.124.3.1133; Chen 2010, distress and Islamic intensity, doi:10.1086/652462; Watts et al. 2016, ritual human sacrifice, doi:10.1038/nature17159.

**How far each used source was opened in the draft, carried forward here:** Sibley and Bulbulia 2012, Sosis and Bressler 2003, Sosis 2000, Xygalatas et al. 2013, and Purzycki et al. 2016: full text. Bentzen 2019: author PDF / working paper and published abstract, not typeset EJ pages. Becker and Woessmann 2009: IZA DP 2886 and published abstract, not typeset QJE pages. Campante and Yanagizawa-Drott 2015: published abstract and identification design; CID WP opened only as a completeness check, no numbers taken from it. Iannaccone 1994: abstract only. Zahavi 1975, Grafen 1990, and Eigen 1971: Crossref metadata only (Eigen already in the repo).

No used citation failed Crossref. No source was invented.
