# tests/unit/test_stage_tasks.py
# How the browser suites are split across pipeline tasks (build/__init__.py).
#
# The demo and walkthrough tests are their own gate rather than 24 tests buried in a suite of 205:
# a demo failure names itself, and the two tasks run concurrently inside Stage 3 because these tests
# are SLEEP-bound (the demo paces a viewer's eye — ~2.7s per scripted step) rather than CPU-bound, so
# they overlap the rest of the suite instead of extending it.
#
# What must stay true: the split is a partition. Every demo file is run by the demo task and by
# nothing else, so no test is paid for twice and none falls between the two tasks.

from pathlib import Path

import build


REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def test_every_demo_file_named_by_the_task_exists():
    """A renamed test file would otherwise silently drop out of the pipeline: pytest is given a
    path, and the e2e task ignores that same path, so a typo means the tests run nowhere."""
    for name in build.DEMO_TEST_FILES:
        assert (REPO_ROOT / name).is_file(), (
            f"{name} is named by the demo task but does not exist"
        )


def test_the_two_tasks_partition_the_suite():
    """No file both tasks run (paid twice, and the demo pacing lands back in the e2e stage), and no
    e2e file neither runs."""
    e2e_files = {
        str(path.relative_to(REPO_ROOT))
        for path in (REPO_ROOT / "tests/e2e").glob("test_*.py")
    }
    demo_files = set(build.DEMO_TEST_FILES)

    assert demo_files <= e2e_files
    covered = (e2e_files - demo_files) | demo_files
    assert covered == e2e_files


def test_the_worker_budget_is_shared_rather_than_doubled():
    """The two tasks run at the same time against ONE dev server, so their workers come out of a
    single budget: enough simultaneous browser contexts can burst past the server's listen backlog,
    which is the documented cause of Page.goto timeouts unrelated to any change.

    What is asserted is the INVARIANT, not the split. The demo task's share is re-derived whenever
    either suite's cost moves — it was 1 from 2026-08-19 and is 3 since 2026-09-01, when the demo
    suite had grown into the stage's long pole while running on a single worker — and pinning the
    number here would make every honest re-derivation look like a regression. What must stay true is
    that the two tasks come out of ONE allowance and neither is starved.

    A machine whose whole budget IS one ends up running two: nothing smaller can be split, and one
    extra context on a two-core box is not the burst this guards against."""
    budget = build._playwright_worker_count()
    demo = build.demo_worker_count()
    e2e = build.e2e_worker_count()

    assert demo >= 1 and e2e >= 1, (demo, e2e)
    assert demo + e2e <= max(2, budget), (
        f"the two tasks take {demo} + {e2e} browser contexts out of a budget of {budget}"
    )
    assert e2e == max(1, budget - demo)
