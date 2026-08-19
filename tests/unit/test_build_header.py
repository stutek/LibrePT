# tests/unit/test_build_header.py
# The line every pipeline entry point prints BEFORE it starts working (build/__init__.py's
# format_run_header / print_run_header).
#
# Wanted 2026-08-19: "can the pipeline (including build check) first print status line including
# label and current time + CPU load + free memory + cores available?". The reason it earns a line is
# AGENT_RULES §2.A.3: a gate run is minutes of dead air, and the two questions asked of it afterwards
# are "when did this start?" and "was the box busy?" — a run well outside its budget is usually the
# environment rather than the change. Both answers have to be captured at the START, because by the
# time the run is slow the load average has moved.
#
# These pin what the line must SAY, not how it is spaced: which command is running, the wall-clock
# time it started, the cores and browser workers it will use, the load, and the free memory — plus
# that a platform which will not answer one of those degrades to a readable "n/a" instead of taking
# the gate down with it.

import pathlib

from build import HostSnapshot, format_run_header, host_snapshot


FULL = HostSnapshot(cores=16, workers=8, load=(0.42, 0.55, 0.61), available_gb=21.4)


def test_the_line_names_the_command_and_when_it_started():
    line = format_run_header("build check", "2026-08-19 09:12:33", FULL)

    assert "build check" in line
    # The clock reading, not an elapsed time: §2.A.3 asks for the wall-clock a run should land by,
    # which nobody can compute from a duration alone.
    assert "2026-08-19 09:12:33" in line


def test_the_line_reports_the_host_the_run_will_compete_with():
    line = format_run_header("build check", "2026-08-19 09:12:33", FULL)

    assert "16 cores" in line
    # The browser suites take half the cores (build._playwright_worker_count), which is the number
    # that explains a slow Stage 2/3 — the core count alone does not.
    assert "8 browser workers" in line
    assert "0.42" in line and "0.55" in line and "0.61" in line
    assert "21.4" in line


def test_a_platform_that_will_not_answer_degrades_to_a_readable_line():
    silent = HostSnapshot(cores=4, workers=2, load=None, available_gb=None)

    line = format_run_header("build", "2026-08-19 09:12:33", silent)

    assert "4 cores" in line
    assert "n/a" in line


def test_the_snapshot_is_taken_from_the_real_host_without_raising():
    # Read on every entry point on every platform CI runs, so the one thing it must never do is
    # throw: getloadavg is absent on Windows and /proc/meminfo on macOS.
    snapshot = host_snapshot()

    assert snapshot.cores >= 1
    assert 1 <= snapshot.workers <= snapshot.cores


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
