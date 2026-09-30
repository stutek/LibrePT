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
    extra context on a two-core box is not the burst this guards against.

    Checked across BUDGETS, not only this machine's. The split was a hardcoded 3 until 2026-09-10,
    which was right on the sixteen-core machine it was measured on and broke CI, whose four cores
    make a budget of two: three demo workers plus one for the rest is four contexts out of two. The
    rule has to hold wherever the gate runs, so the test asks it wherever the gate runs."""
    for budget in (1, 2, 3, 4, 8, 16, 32):
        demo, e2e = _split_at(budget)

        assert demo >= 1 and e2e >= 1, (budget, demo, e2e)
        assert demo + e2e <= max(2, budget), (
            f"at a budget of {budget} the two tasks take {demo} + {e2e} browser contexts"
        )
        assert e2e == max(1, budget - demo)


def _split_at(budget):
    """The split this machine would choose if its budget were `budget`."""
    original = build._playwright_worker_count
    build._playwright_worker_count = lambda: budget
    try:
        return build.demo_worker_count(), build.e2e_worker_count()
    finally:
        build._playwright_worker_count = original


def test_the_demo_share_holds_where_it_was_measured():
    """The ratio is the decision; the number follows the machine. Pinned at the budget it was derived
    on (2026-09-01: three of eight landed the two tasks within 20s of each other) so a change to the
    formula that quietly moves the measured split has to say so here."""
    assert _split_at(8) == (3, 5)


def _workers_each_task_asks_for(monkeypatch, budget, call):
    """{log name: the `-n` each pytest run was given}, for `call` run at `budget`, with no browser
    started: `run_logged` records the command instead of running it."""
    asked = {}

    def record(cmd, log_name, *args, **kwargs):
        asked[log_name] = cmd[cmd.index("-n") + 1]
        return build.testreport.RunResult(0, "", log_name)

    monkeypatch.setattr(build, "_playwright_worker_count", lambda: budget)
    monkeypatch.setattr(build, "run_logged", record)
    monkeypatch.setattr(build, "_read_schema_flags", lambda: [])
    monkeypatch.setattr(build, "released_schema", lambda: 4)
    call()
    return asked


def test_a_ci_job_running_one_task_takes_the_whole_budget(monkeypatch):
    """deploy.yml runs e2e, demo and regression each on a runner of its own, calling the task with no
    argument. Given the split share there, each four-core runner ran one browser where it had room
    for two: e2e took 675s and demo 472s."""

    def every_task_alone():
        build.run_e2e_tests()
        build.run_demo_tests()
        build.run_regression_tests()

    asked = _workers_each_task_asks_for(monkeypatch, 2, every_task_alone)

    assert asked == {"e2e-parallel": "2", "demo-tests": "2", "regression": "2"}


def test_stage_3_splits_the_budget_between_its_two_tasks(monkeypatch):
    """Locally the two tasks run at once against one dev server, so there they share one budget."""
    asked = _workers_each_task_asks_for(monkeypatch, 8, build.run_stage_3_e2e)

    assert asked == {
        "e2e-parallel": str(build.e2e_worker_count()),
        "demo-tests": str(build.demo_worker_count()),
    }
    assert int(asked["e2e-parallel"]) + int(asked["demo-tests"]) == 8
