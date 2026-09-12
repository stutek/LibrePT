"""One gate at a time, and a lock that can say WHO holds it.

Why this exists, and it is not hypothetical. Three sessions share this tree, and the rule was that
each checks whether a `build check` is already running before starting one. They checked with
`pgrep -f "python -m build"` — which matches any command line CONTAINING that string, including the
watcher looking for it and the shell wrapping the `pgrep` itself. On 2026-09-12 it reported a run in
flight for twenty minutes while none existed: one session held back, edited on the false positive,
apologised to a second for spoiling a run, and accused a third of owning it. A rule three sessions
must remember, enforced by a command that lies, is worse than a lock nobody has to think about.

**The create is atomic, because a file lock is otherwise a race.** `O_CREAT | O_EXCL` is one
indivisible act in the kernel: if the file exists the call fails, and there is no instant between
looking and writing for a second run to slip into. Read-then-write would be exactly the TOCTOU hole
this is meant to close. (Not atomic over some old NFS servers — irrelevant here: one machine, one
working tree.)

**A pid alone proves nothing, so the lock carries its own evidence.** `os.kill(pid, 0)` succeeds for
a ZOMBIE — a process that has exited and whose parent has not reaped it — and the kernel reuses pids,
so a stale lock's number may by then belong to somebody's editor. The lock therefore records the
holder's pid AND its start time from /proc, and the holder is believed only when the process exists,
is not in state `Z`, and began at the moment the lock says. A pid plus a start time is exact: the
kernel cannot hand that pair to two processes. Anything else is a dead lock, said out loud and
cleared.

The first draft matched the string "build" in the holder's command line instead, and this file's own
test caught it — a gate started through a wrapper would have been judged recycled and had its live
lock broken. That is the pgrep mistake again, one size smaller.

**Exactly one retry after clearing a dead lock, never a loop.** Two runs may both find the same
corpse and both remove it; the re-create still goes through `O_EXCL`, so one wins and the other then
re-reads and finds a LIVE holder and stands down honestly. A loop would let two runs take turns
deleting each other's lock forever.

Linux by construction (it reads /proc), which is what this gate runs on. Elsewhere the liveness check
degrades to "the process exists", which is weaker but never wrong in the dangerous direction: it can
refuse to break a lock it cannot judge, not break one it should have kept.
"""

import json
import os
import time
from datetime import datetime

LOCK_PATH = os.path.join(".build-reports", "gate.lock")


def _proc_state(pid):
    """(state_letter, start_ticks) for a live pid, or (None, None). Never raises.

    `start_ticks` is field 22 of /proc/<pid>/stat — when the process began, counted from boot. It is
    read rather than the command line because a pid plus a start time is EXACT: the kernel cannot
    hand the same pair to two processes, so a recycled pid is caught by arithmetic instead of by
    guessing what a command line should look like.

    The first version of this file matched the string "build" in the cmdline, and its own test caught
    why that is the pgrep mistake in a smaller costume: a holder invoked through a wrapper, or under
    a different name, would be judged recycled and have its live lock broken.
    """
    try:
        with open(f"/proc/{pid}/stat", "rb") as handle:
            raw = handle.read().decode("utf-8", "replace")
        # The comm field is parenthesised and may itself contain spaces and brackets, so fields are
        # counted from after the LAST ')' — the standard way to parse this file.
        fields = raw[raw.rindex(")") + 2 :].split()
        return fields[0], int(fields[19])
    except (
        FileNotFoundError,
        ProcessLookupError,
        PermissionError,
        OSError,
        ValueError,
        IndexError,
    ):
        return None, None


def own_start_ticks():
    """This process's own start time, to be written into the lock as its proof of identity."""
    return _proc_state(os.getpid())[1]


def holder_state(pid, expected_start=None, proc_state=_proc_state):
    """Is the pid in a lock a gate that is really running?

    Returns one of "alive", "gone", "zombie", "recycled" — a WORD rather than a boolean, because the
    refusal message has to say which, and "the lock is stale" without a reason is how a lock gets
    broken by somebody guessing.
    """
    if not isinstance(pid, int) or pid <= 0:
        return "gone"
    state, start = proc_state(pid)
    if state is None:
        # No /proc entry, or no /proc at all. On a system without it, fall back to the weak check
        # rather than declaring every lock dead — a guard that cannot see may not break a lock.
        if not os.path.isdir("/proc"):
            try:
                os.kill(pid, 0)
                return "alive"
            except OSError:
                return "gone"
        return "gone"
    if state == "Z":
        return "zombie"
    # Only when the lock recorded one: a lock written before this field existed is judged on state
    # alone rather than declared stale, which would break a live gate on an upgrade.
    if expected_start is not None and start != expected_start:
        return "recycled"
    return "alive"


def read_lock(path=LOCK_PATH):
    """The lock as written, or None. A lock we cannot parse is treated as absent: a corrupt file is
    not evidence that a run is in progress, and leaving one would block the gate forever."""
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else None
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None


def _write_lock(path, pid, started):
    """Atomically. Returns True if this process now holds the lock."""
    payload = json.dumps(
        {"pid": pid, "started": started, "start_ticks": own_start_ticks()},
        indent=2,
    )
    try:
        fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o644)
    except FileExistsError:
        return False
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        handle.write(payload + "\n")
    return True


def _age(started):
    try:
        return time.time() - datetime.fromisoformat(started).timestamp()
    except (TypeError, ValueError):
        return None


def refusal_message(lock, state):
    """What a person reads when their run will not start. It names the pid, when that run began and
    how long ago — the three facts somebody needs to decide whether to wait or to go and look."""
    pid = lock.get("pid")
    started = lock.get("started", "an unknown time")
    age = _age(started)
    since = (
        f"{int(age // 60)}m{int(age % 60):02d}s ago" if age is not None else "unknown"
    )
    return (
        f"  ✗ build check is already running — pid {pid}, started {started} ({since}).\n\n"
        "    One gate at a time: two runs share one dev server and one integrity catalog, and\n"
        "    the second one measures a tree the first is still reading. Wait for it, or ask the\n"
        f"    session that owns pid {pid}.\n\n"
        f"    If that process is gone, this lock clears itself — it was judged {state}.\n"
    )


def acquire(path=LOCK_PATH, now=None):
    """Take the gate lock, or return the refusal text explaining who holds it.

    Returns (True, None) when the lock is ours, or (False, message). The caller prints and exits.
    """
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    started = (now or datetime.now()).isoformat(timespec="seconds")
    if _write_lock(path, os.getpid(), started):
        return True, None

    lock = read_lock(path)
    if lock is None:
        # Unreadable: treat as absent, but only once — if the re-create also fails, somebody real is
        # holding it and the refusal below is the honest answer.
        try:
            os.unlink(path)
        except OSError:
            pass
        if _write_lock(path, os.getpid(), started):
            return True, None
        lock = read_lock(path) or {}

    state = holder_state(lock.get("pid"), lock.get("start_ticks"))
    if state == "alive":
        return False, refusal_message(lock, state)

    # A dead holder. Clear it and try ONCE more; if another run beat us to the same corpse, we now
    # find their live lock and stand down rather than fighting over the file.
    print(f"  ⓘ Clearing a {state} gate lock (pid {lock.get('pid')}).")
    try:
        os.unlink(path)
    except OSError:
        pass
    if _write_lock(path, os.getpid(), started):
        return True, None
    return False, refusal_message(read_lock(path) or {}, "alive")


def release(path=LOCK_PATH):
    """Drop the lock, but only if it is still ours — never remove a lock another run has taken."""
    lock = read_lock(path)
    if lock and lock.get("pid") == os.getpid():
        try:
            os.unlink(path)
        except OSError:
            pass


# ---------------------------------------------------------------------------------------------
# The other half: a run's verdict is about a TREE, not about the run.
#
# The lock stops a second gate. It cannot stop a hand editing `src/` while the first one is still
# measuring — which happened four times on 2026-09-12, in all three directions, between sessions
# that were all being careful. One of those runs went green on all four stages and the tree it
# described no longer existed by the time it finished; the catalog check failed against what was
# actually on disk. Green obtained before the tree moved is not a verdict on the tree after.
#
# Taken AFTER stage 1, deliberately. The gate's own formatter rewrites files during that stage and
# says so, and a snapshot taken before it would report those rewrites as movement every single run —
# noise that teaches whoever reads it to wave the next real difference through. Stage 1 is seconds
# long and its own checks catch a tree that moved under it (an uncatalogued module, a file missing
# from the precache list), so the window this guards is stages 2 to 4, which is where the minutes are.
#
# `tests/` counts as the tree: deleting a test file mid-run changes what stages 2 and 3 collect.


def tree_fingerprint(roots=("src", "tests")):
    """Every file under `roots` and when it was last written. Paths and mtimes, not contents: this
    has to run in well under a second beside a five-minute gate, and a byte that changes without the
    mtime moving is not a thing this filesystem does."""
    seen = {}
    for root in roots:
        for base, _dirs, names in os.walk(root):
            if "__pycache__" in base:
                continue
            for name in names:
                path = os.path.join(base, name)
                try:
                    seen[path] = os.stat(path).st_mtime_ns
                except OSError:
                    seen[path] = None
    return seen


def moved_paths(before, after):
    """What changed between two fingerprints, as (added, removed, rewritten) sorted lists."""
    added = sorted(set(after) - set(before))
    removed = sorted(set(before) - set(after))
    rewritten = sorted(p for p in set(before) & set(after) if before[p] != after[p])
    return added, removed, rewritten


def movement_report(before, after):
    """None when the tree held still, otherwise the text explaining why the verdict does not count.

    It names the paths. "The tree moved" without them is unactionable, and the first thing anyone
    asks is whether it was their own edit or the gate's."""
    added, removed, rewritten = moved_paths(before, after)
    if not (added or removed or rewritten):
        return None
    lines = [
        "  ✗ The tree moved while this run was measuring it — the result does not count.\n"
    ]
    for label, paths in (
        ("added", added),
        ("removed", removed),
        ("rewritten", rewritten),
    ):
        for path in paths:
            lines.append(f"      {label:9s} {path}")
    lines.append(
        "\n    A green obtained before the tree moved is not a verdict on the tree after: on\n"
        "    2026-09-12 one such run passed all four stages while the tree on disk had already\n"
        "    stopped passing stage 1. Settle the tree and run again.\n"
    )
    return "\n".join(lines)
