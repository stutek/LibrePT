# tests/unit/test_testreport.py
# The build gate's failure digest (build/testreport.py). Its whole purpose is that a red build
# explains itself on screen: WHICH tests failed and WHY, without opening a log. These pin the three
# extractions that carry that — the failing node ids (printed by name so nothing needs a log to
# name what broke), the raised exceptions (never truncated: they are the WHY, and under --tb=long
# they sit at the end of a block far longer than any digest can print), and the compact traceback
# (the call chain around them, which is the part that used to cost a grep round trip).

from build.testreport import (
    SUMMARY_MARKER,
    failed_test_ids,
    failure_exceptions,
    failure_traceback,
)

PYTEST_OUTPUT = """\
=================================== FAILURES ===================================
______________________ test_deliberate_failure[chromium] _______________________
tests/e2e/test_demo.py:4: in test_deliberate_failure
    assert page.locator("#app-version").inner_text() == "NOPE"
E   AssertionError: assert 'dev' == 'NOPE'
=========================== short test summary info ============================
FAILED tests/e2e/test_demo.py::test_deliberate_failure[chromium] - AssertionError
ERROR tests/e2e/test_other.py::test_broken
1 failed, 141 passed in 103.84s (0:01:43)
"""


def test_failing_node_ids_are_extracted_in_order():
    assert failed_test_ids(PYTEST_OUTPUT) == [
        "tests/e2e/test_demo.py::test_deliberate_failure[chromium]",
        "tests/e2e/test_other.py::test_broken",
    ]


def test_node_ids_are_deduplicated():
    doubled = PYTEST_OUTPUT + PYTEST_OUTPUT
    assert len(failed_test_ids(doubled)) == 2, (
        "re-running must not re-list the same test"
    )


def test_traceback_carries_the_reason_not_just_the_name():
    lines, trimmed = failure_traceback(PYTEST_OUTPUT)
    body = "\n".join(lines)

    # The exception, its message, and the line that raised it — the three facts that used to
    # require opening the log.
    assert "AssertionError: assert 'dev' == 'NOPE'" in body
    assert "tests/e2e/test_demo.py:4" in body
    assert trimmed == 0
    # The traceback stops where the summary begins; the two halves are printed separately.
    assert SUMMARY_MARKER not in body


def test_long_tracebacks_are_capped_and_the_remainder_reported():
    noisy = PYTEST_OUTPUT.replace(
        "E   AssertionError: assert 'dev' == 'NOPE'",
        "\n".join(f"E   frame {i}" for i in range(40)),
    )
    lines, trimmed = failure_traceback(noisy, limit=10)

    assert len(lines) == 10
    assert trimmed > 0, "a truncated traceback must say how much was left in the log"


def test_output_without_a_failures_section_yields_nothing():
    """A crashed worker or collection error produces no FAILURES block — the digest then falls back
    to the tail rather than inventing a traceback."""
    assert failure_traceback("collection error, no failures block") == ([], 0)


def test_the_exception_survives_a_traceback_too_long_to_print():
    """The regression this exists for (2026-08-04): under --tb=long the browser suites emit ~150
    lines of source listing per failure and the exception is the LAST line, so a head-capped
    traceback printed call-site boilerplate and dropped the only line that said what broke — the
    digest read '… 143 more traceback line(s)' where a `TimeoutError` should have been. Exceptions
    are therefore extracted separately and are never subject to that cap."""
    buried = PYTEST_OUTPUT.replace(
        "E   AssertionError: assert 'dev' == 'NOPE'",
        "\n".join(f"    boilerplate line {i}" for i in range(150))
        + "\nE   TimeoutError: Page.goto: Timeout 30000ms exceeded.",
    )

    capped, trimmed = failure_traceback(buried, limit=10)
    assert trimmed > 0, (
        "precondition: this traceback must be long enough to be truncated"
    )
    assert "TimeoutError" not in "\n".join(capped), (
        "precondition: the capped traceback is exactly where the exception used to get lost"
    )

    exceptions, _ = failure_exceptions(buried)
    assert "E   TimeoutError: Page.goto: Timeout 30000ms exceeded." in exceptions


def test_one_shared_reason_across_parallel_workers_is_reported_once():
    """A contended run fails many tests for a single cause; repeating that line once per worker
    would push everything else out of the digest."""
    repeated = PYTEST_OUTPUT + PYTEST_OUTPUT + PYTEST_OUTPUT
    exceptions, more = failure_exceptions(repeated)

    assert exceptions == ["E   AssertionError: assert 'dev' == 'NOPE'"]
    assert more == 0


def test_distinct_exceptions_are_capped_with_the_remainder_reported():
    many = "\n".join(f"E   ValueError: distinct problem {i}" for i in range(20))
    exceptions, more = failure_exceptions(many, limit=5)

    assert len(exceptions) == 5
    assert more == 15


def test_output_with_no_exception_lines_yields_nothing():
    assert failure_exceptions("everything passed") == ([], 0)
