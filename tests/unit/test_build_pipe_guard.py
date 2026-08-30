"""The gate's refusal to run with a filter reading its output (build/__main__.py).

Asked for 2026-08-29: "can we somehow prevent build checks to be run piped? to exit if pipe is
detected?" — after `| tail` had quietly turned four green runs into four green SUMMARIES, with every
stage line above them thrown away.

What is pinned here is the distinction the guard rests on, because getting it wrong makes the gate
either useless or unrunnable: a TTY test cannot tell an agent's captured-but-honest run from a piped
one (neither has a terminal), so the guard looks for the specific thing that is wrong — a truncating
filter reading this process's output — and refuses nothing else.
"""

import pytest

from build.__main__ import OUTPUT_FILTERS, output_filter_reading_us, refuse_a_pipe


def siblings(*names):
    """Stands in for the /proc walk: the commands running beside us under the same shell."""
    return lambda parent_pid: list(names)


def test_a_truncating_filter_is_seen():
    # No environment involved: this half only looks at who is reading the output.
    assert output_filter_reading_us(siblings("bash", "tail")) == "tail"
    assert output_filter_reading_us(siblings("head")) == "head"


def test_an_ordinary_run_is_not_a_pipe():
    # The agent's own shell, with nothing filtering: this is the case a TTY check would refuse, and
    # refusing it would mean the gate could never be run from a tool at all.
    assert output_filter_reading_us(siblings("bash", "python3", "node")) is None


def test_something_that_keeps_every_line_is_not_refused():
    """`| cat`, a pager, a redirect to a file — none of them lose anything, so none of them are this
    function's business. Refusing them would teach the reflex of reaching for a flag."""
    assert output_filter_reading_us(siblings("cat")) is None
    assert output_filter_reading_us(siblings("tee")) is None
    assert "cat" not in OUTPUT_FILTERS


def test_the_run_stops_rather_than_printing_a_summary_nobody_will_read(capsys):
    # `CI` is cleared for every test by conftest's `one_environment_everywhere` — a fixture that
    # exists because THIS test passed on a laptop and failed on the runner: the guard steps aside
    # when CI is set, and GitHub Actions sets it for every step.

    with pytest.raises(SystemExit) as stopped:
        refuse_a_pipe(siblings("tail"))

    assert stopped.value.code == 2
    said = capsys.readouterr().err
    assert "tail" in said, "the refusal names what it saw, or it reads as a mystery"
    assert "build check" in said, "…and says what to run instead"


def test_ci_is_allowed_through(monkeypatch):
    """A workflow may legitimately pipe, and the runner sets CI. An escape hatch for a machine, not a
    flag a person reaches for in a hurry."""
    monkeypatch.setenv("CI", "true")

    refuse_a_pipe(siblings("tail"))  # no SystemExit


def test_a_machine_that_cannot_look_does_not_refuse(monkeypatch):
    """The /proc walk is Linux-only. Somewhere without it, the guard sees nothing and lets the run
    through: a guard that cannot see is not entitled to refuse."""
    monkeypatch.delenv("CI", raising=False)

    def blind(_parent_pid):
        raise OSError("no /proc here")

    assert output_filter_reading_us(blind) is None
    refuse_a_pipe(blind)  # no SystemExit
