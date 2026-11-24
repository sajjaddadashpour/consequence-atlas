# Errata to PROPOSALS.md (sha256 01685e6c…5de05, locked in 14e7826). PROPOSALS.md itself is NOT edited.
Mathematician, 2026-11-23 (America/Regina). These are fixes requested by Physicist at lock time. None changes a locked parameter
or a locked verdict mapping.

(a) Berry instrument label "x=1e11" is wrong. I read it from the page image of Berry, Nonlinearity 1, 399 (1988), §4,
    p. 404 (refs/berry175.pdf, page 6), which says: "Odlyzko computed 10^5 consecutive zeros E_m, starting with
    m = 10^12 + 1. Thus x ≈ 10^12 and, from (1) and (2), E = 2.677 × 10^11."
    So the instrument point is **zero index x ≈ 10^12, at height E = 2.677×10^11.** The text extraction had garbled the
    exponents. Consistency check: (E/2π)(ln(E/2π) − 1) = 1.0002×10^12. The Figure 1 caption also says "x = 10^12".
    The numbers in out_instrument_h8.txt (5.62, 35.31, 0.4659, 0.4663, 449) are unaffected. Only the label was wrong.

(b) The "GUE 15–82%" figure attributed to Hess is **not in the Zenodo abstract**. I read the record metadata via
    zenodo.org/api/records/23815327 today. The deposit description gives only Berry 0.26–1.21% RMS, random primes 5–10%,
    and saturation 0.34 → 0.56.
    The figure does appear in the table at line 13 of the README of the GitHub supplement the deposit links to
    ("isSupplementTo": github.com/Dhess1978/berry-saturation-zeta/tree/v1.0). That README row reads "| GUE | 15 – 82 % |".
    Corrected attribution: "GUE 15–82% (Hess, GitHub README of the supplement; not in the Zenodo abstract; not
    peer-reviewed)". I did not open the article PDF inside the zip.

(c) H6 point 1, "Among all y ∈ ℂ … the only nonzero y … is y = −1", over-reaches what we verified. The corrected wording:
    > Bläser & Dell (ICALP 2007) and Bläser, Dell & Fouz (Comput. Complexity 2011/12) state in their abstracts that the
    > Chung–Graham cover polynomial is #P-hard to evaluate (Turing reductions) "in almost the whole plane", with only three
    > easy points. That the three points are (0,0), (0,−1), (1,−1), and so the only easy points on the cycle line x = 0
    > are y = 0 and y = −1, comes from a secondary survey (Kotek–Makowsky–Ravve), not from the papers' theorem statements.
    > Unverified: (i) whether hardness is proved for all complex y or only for some domain (e.g. rationals or algebraic
    > numbers); (ii) whether it holds for simple unweighted 0/1 digraphs (with loops as 1-cycles, the case Z_y(A) needs for
    > 0/1 A), or needs weights or multigraphs. The abstract speaks of the "(weighted) number" of covers.
    The T1/T2 runs are numerical and do not depend on (i) or (ii). Only the wording of the theorem claim changes.

(d) Mertens & Moore (Theory of Computing 9, 273, 2013; abstract read on the journal site) prove: Ferm_k is #P-hard
    (Turing reductions) for constant k > 2, and **⊕P-hard for k = 2**, both even for adjacency matrices of planar graphs.
    So y = −2 is ⊕P-hard (not in P unless NP ⊆ RP), **not #P-hard, by Mertens–Moore**. PROPOSALS H6 point 4 ("y = −2, −3, …
    where evaluation is #P-hard") should read: "y = −2: ⊕P-hard (Mertens–Moore), and #P-hard only if the Bläser–Dell
    dichotomy applies at (0,−2) for the relevant input class; y = −3, −4, …: #P-hard (Mertens–Moore)."
    Does #P-hardness at y = −2 follow from Bläser–Dell as stated? Only conditionally. (0,−2) is not among the three easy
    points, so if their theorem covers this point and 0/1 inputs, it is #P-hard. That rests on the unverified items in (c).
    The two results do not conflict: Mertens–Moore's ⊕P statement is for the more restricted planar class.
    The H6 slogan kill (claim 6) survives either way. y = −3, …, −(n−1) are #P-hard by Mertens–Moore alone (for n ≥ 4), and
    the immanant half of the argument (Σχ_λ = 0 while complexity varies with b(λ)) is independent.

(e) The file `refs/10.1137_S0097539798332152.json` was a failed Crossref lookup ("Resource not found") for a wrong DOI.
    I renamed it in h6plus to `refs/FAILED-LOOKUP_wrong-DOI_10.1137_S0097539798332152.json`. The correct Bürgisser DOI is
    10.1137/S0097539798367880, as cited in PROPOSALS §8.
    The copy in the lock repo (seen/refs/) was not touched. It should be read as the same failed lookup.
