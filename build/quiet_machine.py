"""build/quiet_machine.py — the gate shares the machine with what else is running, up to a point.

Measured 2026-09-18, five runs of one tree: every red run started at a 1-minute load average of 3 or
more, and the two green ones started at about 1. Each failure was a different test — a container that
stopped after eleven seconds, two boot waits timing out at 20s, a layout read taken before the guide
had settled — and every one of them passed alone and in its whole stage. Part of the load was a
second agent session running its own browser suites in the same tree. The gate then ran eight browser
workers, one per two cores, on a machine that was no longer free: the load it met was ON TOP of a
budget that already used the whole box.

**Ruled 2026-09-30 (Simon): the machine must run an exploring browser and the pipeline at the same
time.** So the gate no longer waits for a quiet machine. It measures the load it did not cause, once,
before the first stage, and gives its browser suites only the cores that load leaves free
(`foreign_cores`, read by `_playwright_worker_count`): the same one Chromium per two cores, counted on
the free cores rather than on all of them. It still waits, and after a while refuses, when the load
it did not cause takes more than half the machine — a second session's whole suite, a game — because
then even a reduced run would share every core with it.

**This moves the refusal from a load of 2 to 8 on sixteen cores, and the cure is not yet measured.**
The reds of 2026-09-18 started at 3 or more with eight workers; running fewer workers beside that
load is expected to hold, not known to. First measurement, 2026-09-30 12:13: foreign load 2.92, six
workers, all five stages green in 8m48s. Re-check condition: every gate run that starts shared says
so on its `⇄ Sharing the machine` line. If a shared run goes red and the same tree is green started
quiet, the cure does not hold at that load — lower SHARED_LOAD_PER_CORE to just below it. If ten
shared runs up to a load of 6 are green, the rule stands.

Measured once, before the first stage, and nowhere later: scaling the worker counts by load between
stages was tried on 2026-08-04 and reverted the same day (see `_playwright_worker_count`), because
there the load average is the pipeline's OWN exhaust. Before the first stage there is no exhaust to
misread, which is why this is the one place the reading means what it says.

Injected dependencies: `read_load`, `sleep`, `announce` and `list_busiest`, so the waiting is testable
without a busy machine and without waiting.
"""

# Per core, on the 1-minute average. The greens of 2026-09-18 sat at 0.06-0.09 per core on 16 cores;
# the reds at 0.19 and above. An eighth of the cores is comfortably between them, and above a dev
# box's own idle noise (a browser and an editor).
QUIET_LOAD_PER_CORE = 0.125

# How long to wait for the machine before refusing. Long enough for another suite to finish, short
# enough that nobody sits watching it: the browser stages themselves take about five minutes.
DEFAULT_WAIT_SECONDS = 600
POLL_SECONDS = 30


# The share of the cores the gate lets others use before it waits instead of starting. Half: the
# gate's own budget is one browser per two FREE cores, so above half there would be fewer than a
# quarter of the machine left for its own browsers and every core shared with somebody else's work.
SHARED_LOAD_PER_CORE = 0.5


def quiet_threshold(cores):
    """The 1-minute load a machine of this size may carry and still be called quiet."""
    return max(1.0, (cores or 1) * QUIET_LOAD_PER_CORE)


def room_threshold(cores):
    """The 1-minute load the gate starts beside, taking fewer cores for itself."""
    return max(quiet_threshold(cores), (cores or 1) * SHARED_LOAD_PER_CORE)


def machine_has_room(load_one_minute, cores):
    """True when the load the gate did not cause leaves it room to run. Unknown counts as room."""
    if load_one_minute is None:
        return True
    return load_one_minute <= room_threshold(cores)


def foreign_cores(load_one_minute, cores):
    """How many cores the load measured before the first stage takes from the gate's budget.

    None on a quiet machine: an editor, a desktop and a dev server are the noise every measured green
    run had, and taking a core off the budget for them would slow every run for nothing. Above quiet,
    the whole load counts, rounded — an exploring browser at one core costs the gate one core."""
    if load_one_minute is None or load_one_minute <= quiet_threshold(cores):
        return 0
    return min(int(round(load_one_minute)), (cores or 1) - 1)


def busiest_processes(limit=3):
    """The processes using the most CPU right now, as `pid, %cpu, running for, command` lines, so a
    gate that waits says WHO it is waiting for instead of leaving the next session to find out.
    Linux `ps`; empty where it is missing."""
    import subprocess

    try:
        out = subprocess.run(
            ["ps", "-eo", "pid,pcpu,etime,args", "--sort=-pcpu"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        ).stdout
    except (OSError, subprocess.TimeoutExpired):
        return []
    lines = [line.strip() for line in out.splitlines()[1:] if line.strip()]
    return [line[:110] for line in lines[:limit]]


def machine_is_quiet(load_one_minute, cores):
    """True when the box carries only the noise every measured green run had. An unknown load counts
    as quiet: refusing to run on a platform that has no load average (Windows) would ground the gate
    for a number it cannot read."""
    if load_one_minute is None:
        return True
    return load_one_minute <= quiet_threshold(cores)


def wait_for_room(
    read_load,
    cores,
    sleep,
    announce,
    list_busiest=busiest_processes,
    budget_seconds=DEFAULT_WAIT_SECONDS,
    poll_seconds=POLL_SECONDS,
):
    """Wait until the load the gate did not cause leaves it room. Returns `(started, load)`: whether
    to run, and the load read when it did, which `foreign_cores` turns into the cores it gives up.

    Says what it is waiting for, and who is using the machine, the first time it waits and when it
    gives up, because a gate that appears to hang is worse than one that refuses.
    """
    waited = 0
    while True:
        load = read_load()
        if machine_has_room(load, cores):
            if waited:
                announce(f"  ✓ The machine has room again (load {load:.2f}). Starting.")
            return True, load
        if waited >= budget_seconds:
            announce(
                f"  ✗ The machine is busy: load {load:.2f} on {cores} cores, more than the "
                f"{room_threshold(cores):.2f} the gate runs beside, for {budget_seconds // 60} minutes."
            )
            _name_the_busiest(announce, list_busiest)
            announce(
                "    The gate is not run here: sharing every core with that work would make a red run "
                "say nothing about the tree. Stop what is using the machine — another agent "
                "session running tests, a build, a game — and run it again."
            )
            return False, load
        if waited == 0:
            announce(
                f"  ⏳ Waiting for room: load {load:.2f} on {cores} cores; the gate runs beside "
                f"{room_threshold(cores):.2f} or less."
            )
            _name_the_busiest(announce, list_busiest)
        else:
            announce(f"    still busy after {waited // 60}m — load {load:.2f}")
        sleep(poll_seconds)
        waited += poll_seconds


def _name_the_busiest(announce, list_busiest):
    busiest = list_busiest()
    if busiest:
        announce("    Using the most CPU now (pid, %cpu, running for, command):")
        for line in busiest:
            announce(f"      {line}")
