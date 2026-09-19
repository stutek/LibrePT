"""build/quiet_machine.py — the gate starts only on a machine that is not already busy (TODO §64).

Measured 2026-09-18, five runs of one tree: every red run started at a 1-minute load average of 3 or
more, and the two green ones started at about 1. Each failure was a different test — a container that
stopped after eleven seconds, two boot waits timing out at 20s, a layout read taken before the guide
had settled — and every one of them passed alone and in its whole stage. Part of the load was a
second agent session running its own browser suites in the same tree.

So the gate does not throttle itself; it waits. Scaling the worker counts by load was tried on
2026-08-04 and reverted the same day (see `_playwright_worker_count`): between stages the load
average is the pipeline's OWN exhaust, so the throttle read the work it had just finished and cost
three minutes without fixing anything. Before the first stage there is no exhaust to misread, which
is why this is the one place the reading means what it says.

A refusal, not a slow run: a gate that goes red because the box was saturated says nothing true about
the tree, and costs five minutes to learn that. Told to wait and then told to come back is a sentence
somebody can act on.

Injected dependencies: `read_load`, `sleep` and `announce`, so the waiting is testable without a busy
machine and without waiting.
"""

# Per core, on the 1-minute average. The greens of 2026-09-18 sat at 0.06-0.09 per core on 16 cores;
# the reds at 0.19 and above. An eighth of the cores is comfortably between them, and above a dev
# box's own idle noise (a browser and an editor).
QUIET_LOAD_PER_CORE = 0.125

# How long to wait for the machine before refusing. Long enough for another suite to finish, short
# enough that nobody sits watching it: the browser stages themselves take about five minutes.
DEFAULT_WAIT_SECONDS = 600
POLL_SECONDS = 30


def quiet_threshold(cores):
    """The 1-minute load a machine of this size may carry and still be called quiet."""
    return max(1.0, (cores or 1) * QUIET_LOAD_PER_CORE)


def machine_is_quiet(load_one_minute, cores):
    """True when the box has room for a gate run. An unknown load counts as quiet: refusing to run on
    a platform that has no load average (Windows) would ground the gate for a number it cannot read."""
    if load_one_minute is None:
        return True
    return load_one_minute <= quiet_threshold(cores)


def wait_for_quiet_machine(
    read_load,
    cores,
    sleep,
    announce,
    budget_seconds=DEFAULT_WAIT_SECONDS,
    poll_seconds=POLL_SECONDS,
):
    """Wait until the machine is quiet. Returns True when it is, False when the budget ran out.

    Says what it is waiting for the first time it waits at all, and again on every poll, because a
    gate that appears to hang is worse than one that refuses.
    """
    waited = 0
    while True:
        load = read_load()
        if machine_is_quiet(load, cores):
            if waited:
                announce(f"  ✓ The machine is quiet again (load {load:.2f}). Starting.")
            return True
        if waited >= budget_seconds:
            announce(
                f"  ✗ The machine is busy: load {load:.2f} on {cores} cores, and it stayed that way "
                f"for {budget_seconds // 60} minutes."
            )
            announce(
                "    The gate is not run here: a suite that fails because the box was saturated says "
                "nothing about the tree (TODO §64). Stop what is using the machine — another agent "
                "session running tests, a build, a game — and run it again."
            )
            return False
        if waited == 0:
            announce(
                f"  ⏳ Waiting for the machine: load {load:.2f} on {cores} cores, quiet is "
                f"{quiet_threshold(cores):.2f} or less."
            )
        else:
            announce(f"    still busy after {waited // 60}m — load {load:.2f}")
        sleep(poll_seconds)
        waited += poll_seconds
