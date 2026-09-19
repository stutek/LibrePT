# tests/regression/test_frozen_schema.py — which released schema this suite was written against.
#
# Ruled 2026-09-19 (Simon): the regression suite lives in its own directory, because when behaviour
# changes the schema and the tests change together. He named the cost in the same breath — keeping
# two suites in step when a new build lands — so this is what makes that cost impossible to pay by
# accident: the number below is the released schema this suite froze, and the moment the app's
# released schema moves past it, this test fails and says what to do.
#
# Updating it is a deliberate act, done WITH the release: read every test in this directory against
# the new released behaviour, change what genuinely changed, then raise the number.

import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src"

# The released schema these tests describe. Raise it only after re-reading the suite (see above).
FROZEN_SCHEMA = 4


def released_schema():
    """`STABLE_SCHEMA` out of src/data/recordSchemas.js — the shape the released version reads.

    Read as text rather than imported: this is a Python suite and the declaration is JavaScript, and
    the gate's own `released_schema()` reads it the same way.
    """
    source = (SRC / "data" / "recordSchemas.js").read_text(encoding="utf-8")
    match = re.search(r"export const STABLE_SCHEMA = (\d+);", source)
    assert match, "STABLE_SCHEMA is not declared in recordSchemas.js"
    return int(match.group(1))


def test_the_regression_suite_still_describes_the_released_schema():
    assert released_schema() == FROZEN_SCHEMA, (
        f"the released schema is now {released_schema()}, but this suite was written against "
        f"{FROZEN_SCHEMA}. Read every test in tests/regression/ against what the new release "
        "promises, change what genuinely changed, then raise FROZEN_SCHEMA — the two move together."
    )
