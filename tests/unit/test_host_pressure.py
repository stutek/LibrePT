# tests/unit/test_host_pressure.py
# Whether the machine was STALLED during a run (build/__init__.py's pressure readings).
#
# Wanted 2026-08-19: "I was thinking of IO wait times that throttle CPU... free vs total used memory
# would be swapping indicator".
#
# Peak memory said little: a task that touches 300MB is not in trouble, and one that swaps is, at any
# size. The kernel already answers both questions directly. /proc/pressure/{io,memory} counts
# microseconds during which work was STALLED waiting for the resource — that is the IO wait that
# throttles CPU, in the only unit that matters (time lost) — and /proc/vmstat's pswpin/pswpout say
# whether pages actually moved to or from disk, which is swapping happening rather than swapping
# being possible.
#
# Read once at the start of a run and once at the end: the deltas belong to the run. Per-task
# attribution would need a cgroup per task, which is a different scale of machinery for a number the
# whole run answers.

import build


IO_PRESSURE = """some avg10=0.00 avg60=0.00 avg300=0.09 total=466946177
full avg10=0.00 avg60=0.12 avg300=0.09 total=418610303
"""
VMSTAT = "nr_free_pages 1234\npswpin 682084\npswpout 1985699\nnr_dirty 7\n"


def test_stall_totals_are_read_in_seconds(tmp_path):
    path = tmp_path / "io"
    path.write_text(IO_PRESSURE)

    stalled = build.read_stall_seconds(str(path))

    # `full` is the honest one for a build: it counts time when NOTHING could run for want of the
    # resource, where `some` also counts a single blocked thread while others worked.
    assert round(stalled["full"], 1) == 418.6
    assert round(stalled["some"], 1) == 466.9


def test_a_kernel_without_pressure_accounting_reports_nothing_rather_than_zero(
    tmp_path,
):
    """Zero would claim the machine was never stalled. Absent says nobody measured — the difference
    matters when the number is being read as evidence."""
    assert build.read_stall_seconds(str(tmp_path / "missing")) is None


def test_swap_activity_is_pages_moved_not_space_configured(tmp_path):
    """SwapTotal/SwapFree describe what is POSSIBLE; pswpin/pswpout describe what happened. A machine
    with 50GB of swap and no traffic is healthy, and one with 2GB and constant traffic is not."""
    path = tmp_path / "vmstat"
    path.write_text(VMSTAT)

    activity = build.read_swap_pages(str(path))

    assert activity == {"in": 682084, "out": 1985699}


def test_the_run_summary_reports_the_deltas_it_measured(capsys):
    before = {
        "io": {"full": 100.0},
        "memory": {"full": 10.0},
        "swap": {"in": 5, "out": 7},
    }
    after = {
        "io": {"full": 103.5},
        "memory": {"full": 10.0},
        "swap": {"in": 5, "out": 1031},
    }

    build.print_pressure_delta(before, after)
    out = capsys.readouterr().out

    assert "3.5s" in out, "io stall over the run"
    assert "swap" in out.lower()


def test_a_quiet_machine_says_so_in_one_line(capsys):
    quiet = {
        "io": {"full": 100.0},
        "memory": {"full": 10.0},
        "swap": {"in": 5, "out": 7},
    }

    build.print_pressure_delta(quiet, quiet)
    out = capsys.readouterr().out

    # Still printed, because "the machine was not the problem" is the useful half of the answer on
    # the run where a stage looks slow.
    assert "no" in out.lower()
