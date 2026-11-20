#!/usr/bin/env python3
"""Map Hijri years 648-844 AH to the Julian-calendar CE year containing each midpoint.

This is the mapping script locked by Amendment 4 of the Mamluk eruption-Nile-unrest
test. It does not read any chronicle, Nilometer or eruption data.

Calendar and library (locked)
-----------------------------
Tabular (arithmetic) Islamic calendar, via convertdate 2.5.1:

    convertdate.islamic.to_jd(year, month, day)
    convertdate.julian.from_jd(jd)

Epoch: 1 Muharram 1 AH = JD 1948439.5 = 16 July 622 CE in the Julian calendar
(the civil tabular epoch used by this library). Leap years follow the Type II
30-year cycle: ((year * 11) + 14) % 30 < 11.

CE years are Julian-calendar years, not proleptic Gregorian. The scored window
falls before the 1582 Gregorian reform, and the Nilometer / eruption series are
historical CE years.

Rule
----
The midpoint of AH year Y is halfway between 1 Muharram Y and 1 Muharram Y+1.
The CE year is the Julian-calendar year of the civil date that contains that
instant. convertdate.julian.from_jd assigns a midnight Julian Day (*.5) to the
civil date then beginning.

Usage
-----
    pip install convertdate==2.5.1
    python3 hijri_midpoint_ce.py

Writes hijri_midpoint_ce_map.csv next to this script and prints the summary
(first year, last year, N, collision years, missing years). The library version
is checked and the process exits if it is not 2.5.1.
"""

from __future__ import annotations

import csv
import sys
from collections import defaultdict
from pathlib import Path

REQUIRED_VERSION = "2.5.1"
AH_FIRST = 648
AH_LAST = 844
HEADLESS_AH = (784, 789, 843)  # 841 removed: see Amendment 4 correction note


def _load_convertdate():
    try:
        import convertdate
        from convertdate import islamic, julian
    except ImportError as exc:
        sys.exit(
            "convertdate is required. Install the locked version with:\n"
            "  pip install convertdate==2.5.1\n"
            f"({exc})"
        )
    version = getattr(convertdate, "__version__", "unknown")
    if version != REQUIRED_VERSION:
        sys.exit(
            f"convertdate {REQUIRED_VERSION} is required; found {version}.\n"
            "  pip install convertdate==2.5.1"
        )
    return islamic, julian


def midpoint_julian_date(islamic, julian, ah_year: int):
    start_jd = islamic.to_jd(ah_year, 1, 1)
    end_jd = islamic.to_jd(ah_year + 1, 1, 1)
    mid_jd = start_jd + (end_jd - start_jd) / 2.0
    year, month, day = julian.from_jd(mid_jd)
    year, month = int(year), int(month)
    day_float = float(day)
    if abs(day_float - round(day_float)) > 1e-9:
        sys.exit(f"non-integer Julian day for AH {ah_year}: {year}-{month}-{day}")
    return mid_jd, year, month, int(round(day_float))


def build_rows(islamic, julian):
    rows = []
    by_ce = defaultdict(list)
    for ah in range(AH_FIRST, AH_LAST + 1):
        mid_jd, year, month, day = midpoint_julian_date(islamic, julian, ah)
        rows.append(
            {
                "ah_year": ah,
                "midpoint_jd": mid_jd,
                "julian_year": year,
                "julian_month": month,
                "julian_day": day,
                "ce_year": year,
                "heading_less": ah in HEADLESS_AH,
            }
        )
        by_ce[year].append(ah)
    collision_years = sorted(ce for ce, ahs in by_ce.items() if len(ahs) > 1)
    missing_years = sorted(
        ce for ce, ahs in by_ce.items() if any(ah in HEADLESS_AH for ah in ahs)
    )
    for row in rows:
        row["collision"] = row["ce_year"] in set(collision_years)
    first_ce = rows[0]["ce_year"]
    last_ce = rows[-1]["ce_year"]
    span = list(range(first_ce, last_ce + 1))
    unmapped = [ce for ce in span if ce not in by_ce]
    if unmapped:
        sys.exit(f"CE years in the span with no mapped AH year: {unmapped}")
    summary = {
        "first_ce": first_ce,
        "last_ce": last_ce,
        "N": last_ce - first_ce + 1,
        "collision_years": collision_years,
        "collision_members": {ce: by_ce[ce] for ce in collision_years},
        "missing_years": missing_years,
        "missing_members": {ce: by_ce[ce] for ce in missing_years},
        "offset_lo": 3,
        "offset_hi": (last_ce - first_ce + 1) - 3,
    }
    summary["offset_count"] = summary["offset_hi"] - summary["offset_lo"] + 1
    return rows, summary


def write_csv(path: Path, rows):
    fields = [
        "ah_year",
        "midpoint_jd",
        "julian_year",
        "julian_month",
        "julian_day",
        "ce_year",
        "heading_less",
        "collision",
    ]
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            out = dict(row)
            out["heading_less"] = "1" if row["heading_less"] else "0"
            out["collision"] = "1" if row["collision"] else "0"
            out["midpoint_jd"] = f"{row['midpoint_jd']:.1f}"
            writer.writerow(out)


def format_summary(summary) -> str:
    collision_bits = [
        f"{ce} ({', '.join(str(ah) for ah in ahs)} AH)"
        for ce, ahs in summary["collision_members"].items()
    ]
    missing_bits = [
        f"{ce} ({', '.join(str(ah) for ah in ahs)} AH)"
        for ce, ahs in summary["missing_members"].items()
    ]
    return "\n".join(
        [
            f"library: convertdate {REQUIRED_VERSION}",
            "functions: convertdate.islamic.to_jd, convertdate.julian.from_jd",
            f"AH range: {AH_FIRST}-{AH_LAST}",
            f"first CE year: {summary['first_ce']}",
            f"last CE year: {summary['last_ce']}",
            f"N: {summary['N']}",
            f"collision CE years: {', '.join(collision_bits)}",
            f"missing CE years: {', '.join(missing_bits)}",
            (
                f"circular-shift offsets: {summary['offset_lo']} to "
                f"{summary['offset_hi']} ({summary['offset_count']} offsets)"
            ),
        ]
    )


def main():
    islamic, julian = _load_convertdate()
    rows, summary = build_rows(islamic, julian)
    out_path = Path(__file__).resolve().parent / "hijri_midpoint_ce_map.csv"
    write_csv(out_path, rows)
    print(format_summary(summary))
    print(f"wrote {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
