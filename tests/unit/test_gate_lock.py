# tests/unit/test_gate_lock.py
# One gate at a time (build/gate_lock.py), and a lock that can say who holds it.
#
# This exists because the rule it replaces was enforced by a command that lies. Three sessions
# checked for a running gate with `pgrep -f "python -m build"`, which matches any command line
# CONTAINING that string — including the watcher looking for it. On 2026-09-12 it reported a run in
# flight for twenty minutes while none existed, and three sessions coordinated around a process that
# was the watcher's own reflection.
#
# What is pinned here is the part that cannot be checked by looking at a running system: that a
# ZOMBIE is not alive, that a recycled pid is not the holder, and that the create is the atomic one.
# Pure logic with injected process state — no subprocesses, no sleeping, Stage 1.

import json
import os

from build import gate_lock


def _fake_proc(state, start_ticks):
    """Stands in for /proc: the state letter and when the process began."""
    return lambda pid: (state, start_ticks)


def test_a_zombie_is_not_a_running_gate():
    # os.kill(pid, 0) SUCCEEDS for a zombie — a process that has exited and whose parent has not
    # reaped it — so liveness cannot be asked that way. This is the case Simon named directly.
    assert gate_lock.holder_state(123, 4242, _fake_proc("Z", 4242)) == "zombie"


def test_a_recycled_pid_is_not_the_holder():
    # The kernel reuses pids. A lock left behind by a crashed run names a number that may by then
    # belong to somebody's editor, and breaking the gate for it would be right — refusing to run
    # because of it would not. Caught by the START TIME, not by reading the command line: the first
    # draft did the latter and this test is what showed it breaks a live gate started via a wrapper.
    assert gate_lock.holder_state(123, 4242, _fake_proc("S", 9999)) == "recycled"


def test_a_live_gate_is_alive():
    assert gate_lock.holder_state(123, 4242, _fake_proc("S", 4242)) == "alive"


def test_a_pid_with_no_process_is_gone():
    assert gate_lock.holder_state(123, 4242, lambda pid: (None, None)) == "gone"
    # Nonsense in the lock file is not evidence of a running gate.
    assert gate_lock.holder_state(None) == "gone"
    assert gate_lock.holder_state(-1) == "gone"


def test_the_second_run_is_refused_and_told_who_holds_it(tmp_path):
    """The whole point: a second gate does not start, and the person reads a pid and a time rather
    than a bare "already running"."""
    path = tmp_path / "gate.lock"
    holding, refusal = gate_lock.acquire(path=str(path))
    assert holding and refusal is None

    # A second attempt from THIS process sees its own live lock — the same path a second session
    # takes, without needing to spawn one.
    holding, refusal = gate_lock.acquire(path=str(path))
    assert not holding
    assert str(os.getpid()) in refusal
    assert "already running" in refusal


def test_a_dead_holder_does_not_block_the_gate_forever(tmp_path):
    """A crashed run must not leave the gate locked until somebody deletes a file by hand — that is
    how a lock stops being trusted and starts being removed reflexively."""
    path = tmp_path / "gate.lock"
    path.write_text(json.dumps({"pid": 999999, "started": "2026-09-12T05:00:00"}))

    holding, refusal = gate_lock.acquire(path=str(path))

    assert holding and refusal is None
    assert json.loads(path.read_text())["pid"] == os.getpid()


def test_a_lock_nobody_can_read_is_not_a_running_gate(tmp_path):
    """A corrupt file is not evidence of a run. Treating it as one would block the gate with no way
    to tell why."""
    path = tmp_path / "gate.lock"
    path.write_text("{not json at all")

    holding, _ = gate_lock.acquire(path=str(path))

    assert holding


def test_release_never_takes_someone_elses_lock(tmp_path):
    """Cleanup runs on every exit, including the exit of a run that was REFUSED. Removing the lock
    on the way out would then hand the gate to whoever asked next, while the real run continues."""
    path = tmp_path / "gate.lock"
    path.write_text(
        json.dumps({"pid": os.getpid() + 1, "started": "2026-09-12T05:00:00"})
    )

    gate_lock.release(path=str(path))

    assert path.exists(), "released a lock held by another process"


def test_a_still_tree_reports_nothing():
    """The common case has to be silent, or the report becomes noise nobody reads."""
    before = {"src/a.js": 1, "src/b.js": 2}
    assert gate_lock.movement_report(before, dict(before)) is None


def test_every_kind_of_movement_is_named():
    """Not "the tree moved" — WHICH paths, because the first question anyone asks is whether it was
    their own edit or the gate's formatter."""
    before = {"src/a.js": 1, "src/gone.js": 5}
    after = {"src/a.js": 9, "src/new.js": 3}

    added, removed, rewritten = gate_lock.moved_paths(before, after)
    assert (added, removed, rewritten) == (
        ["src/new.js"],
        ["src/gone.js"],
        ["src/a.js"],
    )

    report = gate_lock.movement_report(before, after)
    for path in ("src/new.js", "src/gone.js", "src/a.js"):
        assert path in report
    assert "does not count" in report


def test_the_fingerprint_sees_a_file_appear_and_change(tmp_path):
    """Paths AND mtimes: a run that only compared the file list would miss the case that actually
    matters most — an existing module rewritten under a test that already imported it."""
    root = tmp_path / "src"
    root.mkdir()
    (root / "a.js").write_text("one")

    before = gate_lock.tree_fingerprint(roots=(str(root),))
    (root / "b.js").write_text("two")
    os.utime(root / "a.js", ns=(1, 1))
    after = gate_lock.tree_fingerprint(roots=(str(root),))

    added, _removed, rewritten = gate_lock.moved_paths(before, after)
    assert [os.path.basename(p) for p in added] == ["b.js"]
    assert [os.path.basename(p) for p in rewritten] == ["a.js"]
