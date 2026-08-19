# tests/unit/test_build_header.py
# The two lines every pipeline entry point prints BEFORE it starts working (build/__init__.py's
# format_run_header / print_run_header).
#
# Wanted 2026-08-19: "can the pipeline (including build check) first print status line including
# label and current time + CPU load + free memory + cores available?", then "expand the label to be
# human readable similar to 'Running $0'" with the host state on a second line.
#
# The reason it earns two lines is AGENT_RULES §2.A.3: a gate run is minutes of dead air, and the two
# questions asked of it afterwards are "when will this be done?" and "was the box busy?" — a run well
# outside its budget is usually the environment rather than the change. Both answers have to be
# captured at the START, because by the time the run is slow the load average has moved.
#
# These pin what the lines must SAY, not how they are spaced: what is running in words a reader does
# not have to decode, when it should land, and the host it is competing with — plus that a platform
# which will not answer one of those degrades to a readable "n/a" instead of taking the gate down.

import pathlib
from datetime import datetime

from build import (
    HostSnapshot,
    format_run_header,
    host_snapshot,
    read_last_run_seconds,
    record_run_seconds,
)


FULL = HostSnapshot(
    cores=16, workers=8, load=(0.42, 0.55, 0.61), available_gb=21.4, total_gb=31.1
)
AT = datetime(2026, 8, 19, 9, 5, 12)


def test_the_first_line_says_what_is_running_in_words():
    line = format_run_header("build check", AT, FULL).splitlines()[0]

    # The command is what someone re-types; the phrase is what tells a reader who has not memorised
    # the four sub-commands which one of them is now holding their terminal.
    assert "full pipeline gate" in line
    assert "build check" in line


def test_the_first_line_promises_a_finish_TIME_when_there_is_evidence_for_one():
    line = format_run_header(
        "build check", AT, FULL, previous_seconds=165.0
    ).splitlines()[0]

    # §2.A.3 wants a wall clock, not a duration: "~3 minutes" makes the reader do arithmetic and
    # then remember when they started reading. Both are given, and the clock is the point.
    assert "2m45s" in line
    assert "09:07" in line


def test_no_previous_run_promises_nothing():
    line = format_run_header("build check", AT, FULL).splitlines()[0]

    # An estimate with nothing behind it is worse than none: the first run on a new machine is
    # exactly when a made-up number would be furthest out.
    assert "expect" not in line
    assert "first run" in line


def test_the_second_line_reports_the_host_the_run_competes_with():
    line = format_run_header("build check", AT, FULL).splitlines()[1]

    assert "09:05:12" in line
    assert "16 cores" in line
    # The browser suites take half the cores (build._playwright_worker_count), which is the number
    # that explains a slow Stage 2 or 3 — the core count alone does not.
    assert "8 browser workers" in line
    assert "21.4" in line and "31.1" in line
    assert "0.42" in line and "0.55" in line and "0.61" in line


def test_a_busy_box_says_so_rather_than_leaving_the_reader_to_divide():
    quiet = format_run_header("build check", AT, FULL).splitlines()[1]
    loaded = format_run_header(
        "build check", AT, FULL._replace(load=(19.4, 18.2, 15.0))
    ).splitlines()[1]

    # Load only means something against the core count, and reading it is the first diagnostic
    # §2.A.3 asks for when a stage overruns. The header does that division so the reader does not
    # have to know this box has 16 cores.
    assert "quiet" in quiet
    assert "oversubscribed" in loaded.lower()


def test_a_platform_that_will_not_answer_degrades_to_a_readable_line():
    silent = HostSnapshot(
        cores=4, workers=2, load=None, available_gb=None, total_gb=None
    )

    lines = format_run_header("build", silent and AT, silent).splitlines()

    assert "4 cores" in lines[1]
    assert "n/a" in lines[1]


def test_the_snapshot_is_taken_from_the_real_host_without_raising():
    # Read on every entry point on every platform CI runs, so the one thing it must never do is
    # throw: getloadavg is absent on Windows and /proc/meminfo on macOS.
    snapshot = host_snapshot()

    assert snapshot.cores >= 1
    assert 1 <= snapshot.workers <= snapshot.cores


def test_a_runs_duration_is_remembered_per_command(tmp_path, monkeypatch):
    """The estimate is the LAST run on THIS machine rather than a constant in the source: a budget
    written down in code is right on the day it is written, and drifts silently after (the same
    failure agent_tools/constant_copies.py exists for). A measurement cannot drift.

    Per command, because `build lint` and `build check` are two orders of magnitude apart."""
    monkeypatch.setattr("build.RUN_HISTORY_PATH", str(tmp_path / "last-run.json"))

    assert read_last_run_seconds("build check") is None
    record_run_seconds("build check", 165.0)
    record_run_seconds("build lint", 3.2)

    assert read_last_run_seconds("build check") == 165.0
    assert read_last_run_seconds("build lint") == 3.2


def test_an_unwritable_history_is_not_a_failed_build(tmp_path, monkeypatch):
    # A read-only checkout, a CI runner with no writable workspace: the estimate is a courtesy and
    # must never be the reason a gate reports red.
    monkeypatch.setattr(
        "build.RUN_HISTORY_PATH", str(tmp_path / "nope" / "x" / "last-run.json")
    )
    monkeypatch.setattr(
        "os.makedirs", lambda *args, **kwargs: (_ for _ in ()).throw(OSError())
    )

    record_run_seconds("build check", 165.0)
    assert read_last_run_seconds("build check") is None


def test_every_entry_point_prints_the_header_before_it_works():
    """ "the pipeline (including build check)" — so `build`, `build check`, `build lint` and
    `build test` all print it, and all print it before the environment check, which can itself spend
    a minute installing requirements with nothing on screen to say a run has begun."""
    main = pathlib.Path("build/__main__.py").read_text(encoding="utf-8")

    body = main.split('if __name__ == "__main__":')[1]
    assert body.index("print_run_header(") < body.index("check_environment()")
    # One call, on the shared path above the argument branch — a per-branch copy is how one of them
    # ends up without a header.
    assert body.count("print_run_header(") == 1
