#!/usr/bin/env python3
"""Redact Nile-flood vocabulary from al-Maqrīzī's Sulūk, 648-844 AH.

Locked by the Mamluk eruption-Nile-unrest test, Amendments 1, 4 and 5.
Deletes every sentence that contains a locked keyword (Nile-flood vocabulary,
Coptic month names, and the Amendment 5 patterns). Writes one file per Hijri year and a manifest.
Does not code unrest. Does not print passage text.

Usage:
    python3 redact_suluk.py \\
        --source /path/to/0845Maqrizi.Suluk.Shamela0006667-ara1.mARkdown \\
        --outdir /workspace/historian/mamluk-coding/redacted
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import statistics
import sys
import unicodedata
from collections import Counter
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

AH_FIRST = 648
AH_LAST = 844
MISSING_HEADINGS = (784, 789)  # 841 and 843 hand-fixed; see Amendments 4 and 5
HANDFIX_841_LINE_HINT = "إحدى وأربع وثمانمائة"
HANDFIX_843_LINE_HINT = "ثلاثين وأربعين وثمانمائة"

# Locked keywords from the base lock and Amendment 4(c).
# Variants are usual spellings of the same words, not new terms.
NILE_KEYWORDS = [
    "النيل",
    "نيل",
    "وفاء",
    "الوفاء",
    "وفا",
    "الوفا",
    "القاع",
    "قاع",
    "ذراع",
    "أذرع",
    "اذرع",
    "إصبع",
    "اصبع",
    "أصبع",
    "أصابع",
    "اصابع",
    "المقياس",
    "مقياس",
]
# Phrase: the canal-cutting ceremony.
PHRASE_KEYWORDS = [
    r"كسر\s+ال?خليج",
]
COPTIC_MONTHS = [
    "توت",
    "بابه",
    "بابا",
    "بابة",
    "هاتور",
    "هتور",
    "كيهك",
    "كياك",
    "كهك",
    "طوبه",
    "طوبة",
    "طوبا",
    "أمشير",
    "امشير",
    "برمهات",
    "برمودة",
    "برموده",
    "برمودي",
    "برمودى",
    "بشنس",
    "بؤونة",
    "بئونة",
    "باونة",
    "بؤونه",
    "أبيب",
    "ابيب",
    "مسرى",
    "مسري",
    "مصرى",
    "النسيء",
    "نسيء",
    "النسىء",
    "نسىء",
    "النسيئ",
    "نسيئ",
]

# Flood-related stems not in the locked list; checked after redaction
# as leftover concerns only (counts, no passages).
LEFTOVER_STEMS = [
    "نيل",
    "فيض",
    "فيضان",
    "وفاء",
    "وفا",
    "قاع",
    "ذراع",
    "أذرع",
    "إصبع",
    "اصبع",
    "أصابع",
    "مقياس",
    "خليج",
    "زيادة",
    "زياده",
    "تحاريق",
    "التحاريق",
    "بلاغ",
    "مستحرث",
    "غرقا",
    "غرق",
    "غريق",
    "كسر",
    "ماء",
    "بحر",
] + COPTIC_MONTHS

TASHKEEL_RE = re.compile(r"[\u064B-\u065F\u0670\u06D6-\u06ED]")
PREFIX_RE = r"(?:و|ف|ب|ك|ل|ال|وال|فال|بال|كال|لل)?"

# Amendment 5: mechanical prefix/ending and stem lists (locked).
# Prefixes and endings are matched longest first; at most one of each.
A5_PREFIXES = ("وال", "فال", "بال", "كال", "لل", "ال", "و", "ف", "ب", "ك", "ل")
A5_ENDINGS = (
    "كما", "هم", "هن", "كم", "كن", "ها", "نا", "ني",
    "ات", "ان", "ين", "ون", "وا", "ية", "ة", "ا", "ه", "ك", "ي", "ى",
)
FAYADAN_STEMS = ("فيضان",)
KHALIJ_STEMS = ("خليج",)
GHARAQ_STEMS = (
    "غرق", "غريق", "غرقى", "أغرق", "اغرق", "إغراق", "اغراق",
    "يغرق", "تغرق", "نغرق", "مغرق",
)
WATER_SHIP_STEMS = (
    "ماء", "مياه", "نهر", "أنهار", "انهار", "انهر",
    "بحر", "بحار", "سفينة", "سفينه", "سفن", "مركب", "مراكب",
)
ZIYADA_STEMS = ("زيادة", "زياده")
ZIYADA_COWORDS = ("ماء", "بحر", "أصابع", "اصابع", "أذرع", "اذرع")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def strip_tashkeel(s: str) -> str:
    s = TASHKEEL_RE.sub("", s)
    return "".join(ch for ch in s if unicodedata.category(ch) != "Mn")


def strip_waw(t: str) -> str:
    return t[1:] if t.startswith("و") and t[1:] else t


UNITS = {
    "احدى": 1, "إحدى": 1, "احد": 1, "أحد": 1, "واحدة": 1, "واحد": 1,
    "اثنتين": 2, "اثنين": 2, "اثنتي": 2, "اثنتى": 2, "اثنان": 2,
    "اثنتان": 2, "اثنتن": 2,
    "ثلاث": 3, "ثلاثة": 3, "ثالث": 3,
    "اربع": 4, "أربع": 4, "اربعة": 4, "أربعة": 4,
    "خمس": 5, "خمسة": 5,
    "ست": 6, "ستة": 6,
    "سبع": 7, "سبعة": 7,
    "ثمان": 8, "ثماني": 8, "ثمانية": 8, "ثمانى": 8,
    "تسع": 9, "تسعة": 9,
}
TENS = {
    "عشر": 10, "عشرة": 10, "عشرين": 20,
    "ثلاثين": 30, "ثلاثون": 30,
    "اربعين": 40, "أربعين": 40,
    "خمسين": 50, "ستين": 60, "سبعين": 70, "ثمانين": 80, "تسعين": 90,
}
HUNDREDS = {
    "مائة": 100, "مائه": 100, "مئة": 100,
    "مائتين": 200, "مائتان": 200,
    "ثلثمائة": 300, "ثلاثمائة": 300,
    "اربعمائة": 400, "أربعمائة": 400,
    "خمسمائة": 500, "خمسمائه": 500, "خسمائة": 500,
    "ستمائة": 600, "ستمائه": 600,
    "سبعمائة": 700, "سبعمائه": 700,
    "ثمانمائة": 800, "ثمانمائه": 800, "ثمانيمائة": 800,
    "تسعمائة": 900, "تسعمائه": 900,
}


def parse_year_heading(s: str):
    """Return (value_or_None, rest_after_sanah) from a ### | سنة line."""
    m = re.search(r"سنة\s+(.*)$", s)
    if not m:
        return None, ""
    rest = re.sub(r"\s*ms\d+\s*$", "", m.group(1))
    raw = [strip_waw(t) for t in re.findall(r"\d+|[\u0621-\u064a]+", rest)]
    norm = []
    for w in raw:
        if w in ("خسمين", "خصمين"):
            w = "خمسين"
        norm.append(w)
    words = []
    i = 0
    while i < len(norm):
        if (
            norm[i] in ("ثماني", "ثمانى", "ثمان")
            and i + 1 < len(norm)
            and norm[i + 1] in ("مائة", "مائه", "مئة")
        ):
            words.append("ثمانمائة")
            i += 2
        else:
            words.append(norm[i])
            i += 1
    if "في" in words:
        fi = words.index("في")
        if fi + 1 < len(words) and words[fi + 1] in ("أربعين", "اربعين"):
            unit = next((UNITS[w] for w in words[:fi] if w in UNITS), 0)
            hun = next((HUNDREDS[w] for w in words[fi + 2 :] if w in HUNDREDS), 0)
            if unit and hun:
                return hun + 40 + unit, rest
    val = 0
    used = [False] * len(words)
    for i, w in enumerate(words):
        if w in HUNDREDS:
            val += HUNDREDS[w]
            used[i] = True
    for i, w in enumerate(words):
        if used[i]:
            continue
        if w in TENS:
            val += TENS[w]
            used[i] = True
    for i, w in enumerate(words):
        if used[i]:
            continue
        if w in UNITS:
            val += UNITS[w]
            used[i] = True
    return (val or None), rest


def is_year_heading(line: str) -> bool:
    s = line.lstrip()
    return s.startswith("### | سنة") or s.startswith("### |سنة")


def apply_handfix(val, rest, prev):
    """Apply locked order-based heading fixes for 841 and 843."""
    if (
        "إحدى" in rest
        and re.search(r"وأربع(?!ين)", rest)
        and "ثمانمائة" in rest
        and prev == 840
    ):
        return 841, "handfix-841-from-805"
    if (
        "ثلاثين" in rest
        and "أربعين" in rest
        and "ثمانمائة" in rest
        and prev == 842
    ):
        return 843, "handfix-843-from-870"
    return val, "ok" if val else "unparsed"


def word_pattern(keyword: str) -> str:
    return rf"(?<![\u0621-\u064a]){PREFIX_RE}{re.escape(keyword)}(?![\u0621-\u064a])"


def arabic_tokens(text: str) -> list[str]:
    return re.findall(r"[\u0621-\u064a]+", text)


def strip_a5_prefix(token: str) -> str:
    for pref in A5_PREFIXES:
        if token.startswith(pref) and len(token) > len(pref):
            return token[len(pref):]
    return token


def token_matches_stem(token: str, stems: tuple[str, ...]) -> bool:
    core = strip_a5_prefix(token)
    for stem in stems:
        if core == stem:
            return True
        for ending in A5_ENDINGS:
            if core == stem + ending:
                return True
    return False


def any_stem(tokens: list[str], stems: tuple[str, ...]) -> bool:
    return any(token_matches_stem(tok, stems) for tok in tokens)


def compile_keyword_res():
    parts = [word_pattern(k) for k in NILE_KEYWORDS + COPTIC_MONTHS]
    parts.extend(PHRASE_KEYWORDS)
    # intercalary month as a two-word phrase too
    parts.append(r"شهر\s+ال?نسي[ءئى]")
    return re.compile("|".join(parts))


KEYWORD_RE = compile_keyword_res()
SENTENCE_SPLIT_RE = re.compile(r"(?<=[.؟!!?])\s+")
CE_DATE_RE = re.compile(
    r"\b(?:(?:CE|AD|C\.E\.|A\.D\.)\s*)?(1[0-9]{3}|20[0-9]{2})(?:\s*(?:CE|AD|C\.E\.|A\.D\.|م))?\b",
    re.IGNORECASE,
)
MS_RE = re.compile(r"\s*ms\d+\s*")
BLANK_TOKEN = "⟦REDACTED⟧"


def clean_line(line: str) -> str:
    s = line
    if s.startswith("~~"):
        s = s[2:]
    s = MS_RE.sub(" ", s)
    s = s.replace("~", " ")
    s = re.sub(r"[ \t]+", " ", s).strip()
    return s


def is_page_line(line: str) -> bool:
    return line.startswith("Page") or line.startswith("pagebreak")


def is_structural_line(line: str) -> bool:
    if line.startswith("###"):
        return True
    if line.startswith("#") and not line.startswith("~~"):
        return True
    return False


def split_sentences(text: str) -> list[str]:
    text = text.strip()
    if not text:
        return []
    parts = SENTENCE_SPLIT_RE.split(text)
    return [p.strip() for p in parts if p.strip()]


def redact_sentence(sent: str) -> tuple[str, bool]:
    # Match on tashkeel-stripped text; return original or blank.
    probe = strip_tashkeel(sent)
    if KEYWORD_RE.search(probe):
        return BLANK_TOKEN, True
    tokens = arabic_tokens(probe)
    if any_stem(tokens, FAYADAN_STEMS) or any_stem(tokens, KHALIJ_STEMS):
        return BLANK_TOKEN, True
    if any_stem(tokens, GHARAQ_STEMS) and any_stem(tokens, WATER_SHIP_STEMS):
        return BLANK_TOKEN, True
    if any_stem(tokens, ZIYADA_STEMS) and any_stem(tokens, ZIYADA_COWORDS):
        return BLANK_TOKEN, True
    return sent, False


def redact_year_lines(lines: list[str]) -> tuple[str, int, int]:
    """Return redacted text, sentence count, blank count."""
    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        if is_page_line(line):
            continue
        if is_structural_line(line):
            if current:
                blocks.append(current)
            current = [clean_line(line)]
        else:
            current.append(clean_line(line))
    if current:
        blocks.append(current)

    out_chunks = []
    n_sent = 0
    n_blank = 0
    for block in blocks:
        text = " ".join(p for p in block if p)
        # strip obvious CE date labels; do not invent replacements
        text = CE_DATE_RE.sub("⟦CE_DATE⟧", text)
        sentences = split_sentences(text)
        if not sentences and text:
            sentences = [text]
        redacted = []
        for sent in sentences:
            new, was_blank = redact_sentence(sent)
            n_sent += 1
            if was_blank:
                n_blank += 1
            redacted.append(new)
        if redacted:
            out_chunks.append(" ".join(redacted))
    body = "\n".join(out_chunks).strip() + ("\n" if out_chunks else "")
    return body, n_sent, n_blank


def leftover_counts(text: str) -> dict[str, int]:
    probe = strip_tashkeel(text)
    counts = {}
    for stem in LEFTOVER_STEMS:
        pat = re.compile(word_pattern(stem))
        n = len(pat.findall(probe))
        if n:
            counts[stem] = n
    n = len(re.findall(r"كسر\s+ال?خليج", probe))
    if n:
        counts["كسر الخليج"] = n
    # Amendment 5: all-forms and conditional leftovers (counts only).
    tokens = arabic_tokens(probe)
    n = sum(1 for tok in tokens if token_matches_stem(tok, FAYADAN_STEMS))
    if n:
        counts["فيضان_all_forms"] = n
    n = sum(1 for tok in tokens if token_matches_stem(tok, KHALIJ_STEMS))
    if n:
        counts["خليج_all_forms"] = n
    n = sum(1 for tok in tokens if token_matches_stem(tok, GHARAQ_STEMS))
    if n:
        counts["غرق_غريق_all_forms"] = n
    n = sum(1 for tok in tokens if token_matches_stem(tok, ZIYADA_STEMS))
    if n:
        counts["زيادة_all_forms"] = n
    # Conditional leftovers should be zero if the new rules fired.
    sentences = split_sentences(probe) or ([probe] if probe else [])
    cond_g = cond_z = 0
    for sent in sentences:
        if sent == BLANK_TOKEN or "⟦REDACTED⟧" in sent:
            continue
        stoks = arabic_tokens(sent)
        if any_stem(stoks, GHARAQ_STEMS) and any_stem(stoks, WATER_SHIP_STEMS):
            cond_g += 1
        if any_stem(stoks, ZIYADA_STEMS) and any_stem(stoks, ZIYADA_COWORDS):
            cond_z += 1
    if cond_g:
        counts["غرق_with_water_ship_unblanked"] = cond_g
    if cond_z:
        counts["زيادة_with_water_measure_unblanked"] = cond_z
    return counts


def split_source(lines: list[str]):
    """Yield (ah_or_bucket, start_line, end_line, body_lines, heading, note)."""
    # Skip metadata through #META#Header#End#
    start = 0
    for i, line in enumerate(lines):
        if line.startswith("#META#Header#End#"):
            start = i + 1
            break

    current_ah = None
    bucket_lines: list[str] = []
    bucket_start = start + 1  # 1-based
    heading = None
    note = "preamble"
    prev_ah_in_book = None

    def flush(end_line):
        nonlocal bucket_lines, bucket_start, heading, note, current_ah
        if current_ah is None and not bucket_lines:
            return
        yield current_ah, bucket_start, end_line, bucket_lines, heading, note
        bucket_lines = []
        heading = None
        note = "ok"
        current_ah = None

    i = start
    while i < len(lines):
        line = lines[i]
        lineno = i + 1
        if is_year_heading(line):
            val, rest = parse_year_heading(line)
            val, why = apply_handfix(val, rest, prev_ah_in_book)
            yield from flush(lineno - 1)
            current_ah = val
            bucket_start = lineno
            bucket_lines = [line]
            heading = line
            note = why
            if val:
                prev_ah_in_book = val
            i += 1
            continue
        bucket_lines.append(line)
        i += 1
    yield from flush(len(lines))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source", required=True, type=Path)
    ap.add_argument("--outdir", required=True, type=Path)
    ap.add_argument("--script-commit", default="", help="git sha of this script")
    args = ap.parse_args()
    source = args.source.resolve()
    outdir = args.outdir.resolve()
    if not source.is_file():
        sys.exit(f"source not found: {source}")

    raw = source.read_text(encoding="utf-8")
    lines = raw.splitlines()
    source_sha = sha256_file(source)
    script_path = Path(__file__).resolve()
    script_sha = sha256_file(script_path)

    outdir.mkdir(parents=True, exist_ok=True)
    # clean previous year files only
    for old in outdir.glob("ah_*.txt"):
        old.unlink()
    anomaly_path = outdir / "anomaly_after_0842.txt"
    if anomaly_path.exists():
        anomaly_path.unlink()

    buckets = list(split_source(lines))
    by_ah = {}
    anomalies = []
    skipped = []
    for ah, start, end, body, heading, note in buckets:
        if ah == "anomaly_after_0842":
            anomalies.append((start, end, body, heading, note))
            continue
        if ah is None:
            skipped.append({"start": start, "end": end, "n_lines": len(body), "note": note})
            continue
        if AH_FIRST <= ah <= AH_LAST:
            if ah in by_ah:
                sys.exit(f"duplicate year bucket for {ah} at lines {start}-{end}")
            by_ah[ah] = (start, end, body, heading, note)
        else:
            skipped.append(
                {
                    "ah": ah,
                    "start": start,
                    "end": end,
                    "n_lines": len(body),
                    "note": "outside-648-844",
                }
            )

    records = []
    leftover_total = Counter()
    leftover_years = Counter()
    blank_counts = {}

    for ah in range(AH_FIRST, AH_LAST + 1):
        path = outdir / f"ah_{ah:04d}.txt"
        if ah in MISSING_HEADINGS:
            header = (
                f"# AH {ah}\n"
                f"# MISSING_HEADING\n"
                f"# No year heading in the Sulūk; this year is never scored.\n"
            )
            # If any stray text were assigned here, it would be a bug.
            if ah in by_ah:
                sys.exit(f"missing-heading year {ah} unexpectedly has a bucket")
            text = header
            start = end = None
            n_sent = n_blank = 0
            heading = None
            note = "missing-heading"
        elif ah in by_ah:
            start, end, body, heading, note = by_ah[ah]
            redacted, n_sent, n_blank = redact_year_lines(body)
            header = f"# AH {ah}\n"
            text = header + redacted
        else:
            sys.exit(f"year {ah} has no bucket and is not in the missing-heading list")

        data = text.encode("utf-8")
        path.write_bytes(data)
        file_sha = sha256_bytes(data)
        blanks = text.count(BLANK_TOKEN)
        blank_counts[ah] = blanks
        leftovers = leftover_counts(text)
        # ignore leftovers in the header year numeral line only: none expected
        if leftovers:
            leftover_years[ah] += sum(leftovers.values())
            leftover_total.update(leftovers)
        records.append(
            {
                "ah": ah,
                "path": path.name,
                "sha256": file_sha,
                "bytes": len(data),
                "heading_present": ah not in MISSING_HEADINGS,
                "heading_line": start,
                "end_line": end,
                "heading_note": note,
                "n_sentences": n_sent,
                "n_blanks": n_blank,
                "leftover_stems": leftovers,
            }
        )

    anomaly_records = []
    for start, end, body, heading, note in anomalies:
        redacted, n_sent, n_blank = redact_year_lines(body)
        header = (
            "# ANOMALY after 842 AH\n"
            "# Heading raw-parses as 870 (ثلاثين وأربعين وثمانمائة).\n"
            "# Stands between 842 and 844. Not hand-fixed in Amendment 4.\n"
            "# 843 AH remains missing and never scored. Text held out of year files.\n"
        )
        text = header + redacted
        data = text.encode("utf-8")
        anomaly_path.write_bytes(data)
        anomaly_records.append(
            {
                "path": anomaly_path.name,
                "sha256": sha256_bytes(data),
                "bytes": len(data),
                "start_line": start,
                "end_line": end,
                "n_sentences": n_sent,
                "n_blanks": n_blank,
                "note": note,
                "leftover_stems": leftover_counts(text),
            }
        )

    usable = [blank_counts[ah] for ah in range(AH_FIRST, AH_LAST + 1) if ah not in MISSING_HEADINGS]
    zero_blank = [ah for ah, n in blank_counts.items() if ah not in MISSING_HEADINGS and n == 0]
    # unusually many: >= 95th percentile among headed years, or mean+2sd
    ordered = sorted(usable)
    p95 = ordered[int(0.95 * (len(ordered) - 1))]
    mean = statistics.mean(usable)
    sd = statistics.pstdev(usable)
    high_cut = max(p95, mean + 2 * sd)
    high = [ah for ah, n in blank_counts.items() if ah not in MISSING_HEADINGS and n >= high_cut]

    now = datetime.now(ZoneInfo("America/Regina")).strftime(
        "%Y-%m-%d %H:%M America/Regina"
    )
    manifest = {
        "generated": now,
        "source": str(source),
        "source_sha256": source_sha,
        "script": str(script_path),
        "script_sha256": script_sha,
        "script_commit": args.script_commit or None,
        "ah_first": AH_FIRST,
        "ah_last": AH_LAST,
        "year_file_count": AH_LAST - AH_FIRST + 1,
        "headed_years": AH_LAST - AH_FIRST + 1 - len(MISSING_HEADINGS),
        "missing_headings": list(MISSING_HEADINGS),
        "nile_keywords": NILE_KEYWORDS,
        "phrase_keywords": ["كسر الخليج"],
        "coptic_months_and_variants": COPTIC_MONTHS,
        "blank_token": BLANK_TOKEN,
        "blank_stats_headed_years": {
            "min": min(usable),
            "max": max(usable),
            "mean": round(mean, 3),
            "median": statistics.median(usable),
            "pstdev": round(sd, 3),
            "total_blanks": sum(usable),
            "zero_blank_years": zero_blank,
            "high_blank_threshold": high_cut,
            "high_blank_years": [{"ah": ah, "n_blanks": blank_counts[ah]} for ah in high],
        },
        "leftover_stem_totals": dict(leftover_total),
        "leftover_years_with_hits": dict(leftover_years),
        "anomaly": anomaly_records,
        "skipped_outside_window_or_preamble": skipped,
        "years": records,
    }
    man_path = outdir / "MANIFEST.json"
    man_bytes = json.dumps(manifest, ensure_ascii=False, indent=2).encode("utf-8")
    man_path.write_bytes(man_bytes)
    man_sha = sha256_bytes(man_bytes)
    # sidecar with the manifest hash only
    (outdir / "MANIFEST.sha256").write_text(man_sha + "  MANIFEST.json\n", encoding="utf-8")

    # Summary to stdout: numbers only, no passages.
    print(f"source_sha256 {source_sha}")
    print(f"script_sha256 {script_sha}")
    print(f"script_commit {args.script_commit or '(none)'}")
    print(f"year_file_count {AH_LAST - AH_FIRST + 1}")
    print(f"headed_years {AH_LAST - AH_FIRST + 1 - len(MISSING_HEADINGS)}")
    print(f"missing_headings {list(MISSING_HEADINGS)}")
    print(
        "blank_stats "
        f"min={min(usable)} max={max(usable)} mean={mean:.2f} "
        f"median={statistics.median(usable)} pstdev={sd:.2f} total={sum(usable)}"
    )
    print(f"zero_blank_years {zero_blank}")
    print(f"high_blank_threshold {high_cut:.2f}")
    print(f"high_blank_years {[{'ah': ah, 'n': blank_counts[ah]} for ah in high]}")
    print(f"leftover_stem_totals {dict(leftover_total)}")
    print(f"leftover_year_count {len(leftover_years)}")
    print(f"anomaly_files {len(anomaly_records)}")
    print(f"manifest {man_path}")
    print(f"manifest_sha256 {man_sha}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
