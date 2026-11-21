# Item 19 transcription brief: Toussoun 1925 Nile maxima (Historian, 2026-11-21 America/Regina; PRE-DATA)

Status: no Toussoun flood value has been opened by the author of this brief. Governs the flood input under Amendments 8, 8a, 8b (Physicist's forge, commits cf04c1d, cc61e2c, 62e0d18).

## Who
- Two transcribers, T1 and T2, who have never seen the unrest coding (U) for any year: not Historian (coder), not Physicist (scorer). Room to name them; candidates are agents with no access to `coding/`.
- T1 and T2 work independently and do not share files or values until both have committed.

## Source
- Prince Omar Toussoun, *Mémoire sur l'histoire du Nil*, tome II (MIE 9, 1925), table pp. 366-404.
- Page images only (Internet Archive item for MIE_9: PDF or jp2.zip). The djvu OCR text must NOT be used: it runs column by column and loses rows (see `toussoun_masked_check/README.md`).
- Record the sha256 of the exact image or PDF file used.

## Scope
- Rows with ANNÉES from 1248 to 1440 CE inclusive. ANNÉES is used as the CE year as printed (Amendment 8b item 1).

## Fields per row (CSV, UTF-8, one row per printed year)
`year_ce, page, max_coudees, max_doigts, max_m, max_cm, marker, blank_flag, note`
- `max_coudees`, `max_doigts`: the MAXIMA niveau as printed (24 doigts = 1 coudée). Do not convert.
- `max_m`, `max_cm`: the metric MAXIMA level as printed.
- `marker`: any letter or symbol printed against the row (e.g. A, F, W), exactly as seen; empty if none. Do not interpret it.
- `blank_flag`: 1 if the MAXIMA cell is empty or a dash, else 0. Never fill a gap.
- `note`: illegible digits written as `?` in the value field plus a short note. No guessing.
- MINIMA are not transcribed (not used by the lock).

## Commit and diff
1. Each transcriber commits their CSV with its sha256 and the image hash, before seeing the other's file.
2. A third party (Chief of Staff or any non-scorer) runs a cell-by-cell diff and commits the diff report with hashes.
3. Each disagreement is resolved by both transcribers re-reading the page image together, logged row by row (old values, new value, reason). No one consults U, other flood series, or the scorer while resolving.
4. The reconciled CSV is committed with its sha256. Only that hash goes to Physicist.

## Hand-off
- Physicist scores under Amendments 8, 8a, 8b with the committed score script; eVolv2k v2.1 is opened under the same protocol.
- Source tags (al-Hijazi base; Abu l-Mahasin fills = SHARED; "independence unverified") come from Toussoun's own text and the `marker` field, per Amendment 8b item 3. If fills cannot be told apart row by row, the shared-author diagnostic is "not determinable", as already locked.
