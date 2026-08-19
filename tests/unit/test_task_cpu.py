# tests/unit/test_task_cpu.py
# Per-task CPU accounting (build/testreport.py's run_logged, build/__init__.py's _timed_task).
#
# Wanted 2026-08-19: "can the whole pipeline also measure CPU and wall time (per task)? that might be
# useful information for trend monitoring".
#
# Wall time alone cannot separate the two things that make a stage slower: more work, or less machine.
# A suite whose CPU time is flat while its wall time grows is being starved — by another task, by the
# host, by a worker count that no longer fits. One that grows in both is doing more.
#
# Attribution is the whole difficulty: the gate runs its tasks concurrently, so a process-wide CPU
# reading would charge every task for its neighbours. `os.wait4` reaps ONE child and returns that
# child's own rusage — including the workers it spawned — which is exactly the boundary a task has.

import os
import sys

import pytest

from build import testreport


pytestmark = pytest.mark.skipif(
    not hasattr(os, "wait4"), reason="per-child rusage needs os.wait4 (POSIX)"
)

BURN = "x = 0\nfor i in range(4_000_000):\n    x += i\nprint(x)\n"
SLEEP = "import time\ntime.sleep(0.4)\n"


def test_a_busy_child_reports_the_cpu_it_burned(tmp_path, monkeypatch):
    monkeypatch.setattr(testreport, "REPORT_DIR", str(tmp_path))

    result = testreport.run_logged([sys.executable, "-c", BURN], "busy")

    assert result.returncode == 0
    assert result.cpu_seconds > 0.05, "a compute loop must show up as CPU"


def test_a_sleeping_child_costs_wall_time_and_almost_no_cpu(tmp_path, monkeypatch):
    """The distinction that makes the number worth recording: the demo suite used to sleep 158s
    without computing anything, which wall time alone could not tell from real work."""
    monkeypatch.setattr(testreport, "REPORT_DIR", str(tmp_path))

    result = testreport.run_logged([sys.executable, "-c", SLEEP], "idle")

    assert result.cpu_seconds < 0.2


def test_the_result_names_its_fields(tmp_path, monkeypatch):
    """Read by name rather than unpacked: a positional tuple that grows a field breaks every caller
    silently, and this one grew."""
    monkeypatch.setattr(testreport, "REPORT_DIR", str(tmp_path))

    run = testreport.run_logged([sys.executable, "-c", "print('ok')"], "plain")

    assert run.returncode == 0
    assert "ok" in run.output
    assert run.path.endswith("plain.log")
    assert run.cpu_seconds >= 0
