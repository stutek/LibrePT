"""Unit tests for agent_tools/use_case_tests.py — every use case points each promise at a test.

Four use cases had no traceability table, and they were the ones furthest from the app. What the
check has to get right: which rows count as answered, and that a row may say honestly that there is
no test, as long as it says why.
"""

from agent_tools import use_case_tests

TABLE = """# UC0

## Spec ↔ test traceability

| Promise | Where it is held |
| :--- | :--- |
{rows}

## Related
"""


def _problems(*rows):
    return use_case_tests.problems_in(TABLE.format(rows="\n".join(rows)))


def test_a_row_linking_a_test_is_answered():
    assert _problems("| A signal becomes a card | [x.py](../tests/e2e/x.py) |") == []


def test_a_row_may_say_there_is_no_test_and_why():
    assert _problems("| Booking page | **Outside the app** — Google hosts it. |") == []
    assert _problems("| Plan pivot | **Not built** — see TODO.md. |") == []


def test_a_row_pointing_only_at_code_is_not_answered():
    """Code shows where a promise is kept, not that anything checks it is kept."""
    found = _problems("| Picker | [picker.js](../src/modules/picker.js) |")
    assert len(found) == 1
    assert "Picker" in found[0]


def test_a_use_case_with_no_table_is_named():
    assert use_case_tests.problems_in("# UC0\n\n## Details\n") == [
        "has no traceability heading"
    ]


def test_an_empty_table_is_not_an_answer():
    assert use_case_tests.problems_in(TABLE.format(rows="")) != []
