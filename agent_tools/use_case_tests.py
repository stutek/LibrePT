"""`python -m agent_tools.use_case_tests` — every use case says which test holds each promise.

A use case in `use_cases/` is the specification a trainer's workflow is built against. Five of the
nine had a *Spec ↔ test traceability* table; four did not, and those four were the ones where the
specification had drifted furthest from the app: UC1 described a plan-pivot button and a Next
Exercise button that do not exist, and UC4 had the app reading Google Calendar guest lists that its
own permission scope cannot read. A promise nobody has to point at a test for is a promise nobody
checks against the app.

**What it requires.** Each `use_cases/uc*.md` has a heading containing "traceability", followed by a
table. Every row of that table ends in a cell that either links into `tests/`, or opens with one of
the `NO_TEST` marks and says why — so a promise with no test is still written down as one.
Whether the links resolve is doclinks' job, not this one's.

Exit code is 1 on any use case that breaks the rule, so it can gate a commit.
"""

import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
USE_CASES = REPO_ROOT / "use_cases"

# A row may end in one of these instead of a test link. Each is a statement about the app, so it
# is written in bold where a reader of the table sees it.
NO_TEST = ("**Outside the app**", "**Not built**")

HEADING = re.compile(r"^#{2,6} .*traceability", re.IGNORECASE)
TEST_LINK = re.compile(r"\]\((?:\.\./)?tests/")


def _table_after_heading(lines):
    """The rows of the first table after the traceability heading, header and divider dropped;
    None when there is no such heading."""
    start = next((i for i, line in enumerate(lines) if HEADING.match(line)), None)
    if start is None:
        return None
    rows = []
    for line in lines[start + 1 :]:
        if line.startswith("|"):
            rows.append(line)
        elif rows:
            break
    return rows[2:]


def _last_cell(row):
    cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
    return cells[-1] if cells else ""


def problems_in(text):
    """What is wrong with one use case's traceability, as sentences; empty when nothing is."""
    rows = _table_after_heading(text.splitlines())
    if rows is None:
        return ["has no traceability heading"]
    if not rows:
        return ["has a traceability heading and no table rows under it"]
    found = []
    for row in rows:
        cell = _last_cell(row)
        if TEST_LINK.search(cell) or cell.startswith(NO_TEST):
            continue
        found.append(f"row names no test and no reason: {row.strip()[:100]}")
    return found


def main():
    failures = 0
    for path in sorted(USE_CASES.glob("uc*.md")):
        for problem in problems_in(path.read_text(encoding="utf-8")):
            failures += 1
            print(f"  ✗ {path.relative_to(REPO_ROOT)}: {problem}")
    if failures:
        print(
            "\n  Each use case ends in a traceability table: every row links the test that holds the"
            f"\n  promise, or opens with one of {', '.join(NO_TEST)} and says why."
        )
        return 1
    print("  ✓ Every use case points each promise at a test or says why there is none.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
