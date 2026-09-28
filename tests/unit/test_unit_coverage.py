"""Unit tests for agent_tools/unit_coverage.py — the floor under pure logic's unit tests.

The measurement is Node's; what this tool decides is which modules a floor applies to and which
way a held number may move. Those decisions are tested here on made-up numbers, so no test needs
the unit suite to run.
"""

from agent_tools import unit_coverage

FLOOR = unit_coverage.FLOOR


def _breaches(coverage, held=None, browser=None, modules=None, exists=True):
    return unit_coverage.breaches(
        modules if modules is not None else sorted(set(coverage) | set(held or {})),
        coverage,
        held=held or {},
        browser=browser or {},
        test_exists=lambda _rel: exists,
    )


def test_a_module_at_the_floor_passes():
    assert _breaches({"src/domain/a.js": FLOOR}) == []


def test_a_module_below_the_floor_is_named_with_its_number():
    found = _breaches({"src/domain/a.js": FLOOR - 0.5})
    assert len(found) == 1
    assert "src/domain/a.js" in found[0]
    assert f"{FLOOR - 0.5:.1f}%" in found[0]


def test_a_module_no_unit_test_loads_is_named_as_such():
    found = _breaches({}, modules=["src/domain/new.js"])
    assert found == [
        f"src/domain/new.js is run by no unit test, below its floor of {FLOOR}%"
    ]


def test_a_held_module_may_sit_below_the_floor_but_not_below_its_hold():
    held = {"src/data/a.js": 60}
    assert _breaches({"src/data/a.js": 61}, held=held) == []
    assert len(_breaches({"src/data/a.js": 59}, held=held)) == 1


def test_a_held_module_that_rose_must_take_its_hold_with_it():
    """Otherwise a module could fall back to the old number with nothing failing."""
    held = {"src/data/a.js": 60}
    found = _breaches({"src/data/a.js": 60 + unit_coverage.RAISE_BY}, held=held)
    assert found == [
        f"src/data/a.js rose to {60 + unit_coverage.RAISE_BY:.1f}% — set HELD to 65"
    ]
    found = _breaches({"src/data/a.js": FLOOR}, held=held)
    assert found == [f"src/data/a.js reached {FLOOR:.1f}% — remove it from HELD"]


def test_a_browser_module_is_not_measured_but_its_test_must_exist():
    browser = {"src/data/db.js": "tests/e2e/test_db.py"}
    assert _breaches({"src/data/db.js": 10}, browser=browser) == []
    found = _breaches({"src/data/db.js": 10}, browser=browser, exists=False)
    assert found == ["src/data/db.js names tests/e2e/test_db.py, which does not exist"]


def test_an_entry_for_a_module_that_is_gone_is_named():
    found = _breaches({}, held={"src/data/gone.js": 50}, modules=[])
    assert found == [
        "src/data/gone.js is listed here and no longer exists — remove its entry"
    ]


def test_lcov_is_read_as_a_share_of_lines_per_module():
    text = "SF:src/domain/a.js\nLF:40\nLH:30\nend_of_record\nSF:src/domain/b.js\nLF:0\nLH:0\nend_of_record\n"
    assert unit_coverage.parse_lcov(text) == {
        "src/domain/a.js": 75.0,
        "src/domain/b.js": 100.0,
    }
