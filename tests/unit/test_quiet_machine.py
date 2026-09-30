# tests/unit/test_quiet_machine.py — the gate shares the machine, up to half of it.
#
# Pure decisions plus an injected clock, so the waiting is tested without a busy machine and without
# waiting. What it protects: five gate runs on one tree in an hour, each red on a different test,
# every one of which passed alone — eight browser workers had met load they did not cause. Ruled
# 2026-09-30: an exploring browser and the gate run at once, so the gate takes the free cores rather
# than waiting for all of them.

import build
from build.quiet_machine import (
    foreign_cores,
    machine_has_room,
    machine_is_quiet,
    quiet_threshold,
    room_threshold,
    wait_for_room,
)


def test_a_quiet_box_and_a_busy_one_are_told_apart():
    # The measurements this threshold came from: greens at ~1, reds at 3 and above, on 16 cores.
    assert machine_is_quiet(1.0, 16) is True
    assert machine_is_quiet(1.45, 16) is True
    assert machine_is_quiet(3.0, 16) is False
    assert quiet_threshold(16) == 2.0


def test_a_small_machine_still_gets_a_whole_core():
    """A two-core runner would otherwise be called busy at a load of 0.25, which is idle."""
    assert quiet_threshold(2) == 1.0
    assert machine_is_quiet(0.9, 2) is True


def test_a_platform_without_a_load_average_is_not_grounded():
    """Windows has none. Refusing to run for a number that cannot be read would stop the gate for
    everyone on that platform, which is worse than the flakiness this guards against."""
    assert machine_is_quiet(None, 16) is True
    assert machine_has_room(None, 16) is True
    assert foreign_cores(None, 16) == 0


def test_an_exploring_browser_leaves_the_gate_room():
    """The load that stopped every gate on 2026-09-30: one exploring browser and one forgotten one,
    2.24 on sixteen cores. It is room to run on fewer cores, not a reason to wait."""
    assert machine_has_room(2.24, 16) is True
    assert room_threshold(16) == 8.0
    assert machine_has_room(8.5, 16) is False, "half the machine taken is still a wait"


def test_the_gate_gives_up_the_cores_other_work_is_using():
    assert foreign_cores(1.2, 16) == 0, "a quiet machine's noise costs the gate nothing"
    assert foreign_cores(2.24, 16) == 2
    assert foreign_cores(5.6, 16) == 6
    assert foreign_cores(40.0, 16) == 15, "never the whole machine"


def test_the_browser_budget_is_half_the_free_cores(monkeypatch):
    """One Chromium per two cores, counted on the cores the other work leaves. Unset — every CI job,
    every task run on its own — the budget is what it always was."""
    monkeypatch.setattr(build.os, "cpu_count", lambda: 16)
    monkeypatch.setattr(build, "_FOREIGN_CORES", 0)
    assert build._playwright_worker_count() == 8

    build.share_the_machine(2)
    assert build._playwright_worker_count() == 7
    build.share_the_machine(6)
    assert build._playwright_worker_count() == 5
    build.share_the_machine(0)
    assert build._playwright_worker_count() == 8


def test_it_waits_for_a_busy_machine_and_starts_when_it_settles():
    loads = [12.0, 9.0, 2.5]
    slept = []
    said = []

    started, load = wait_for_room(
        read_load=lambda: loads.pop(0),
        cores=16,
        sleep=slept.append,
        announce=said.append,
        list_busiest=lambda: ["1584218 95.5 02:49:35 chrome --type=gpu-process"],
        budget_seconds=600,
        poll_seconds=30,
    )

    assert (started, load) == (True, 2.5), (
        "it starts, and reports the load it started beside"
    )
    assert slept == [30, 30], "it waited twice, once per busy reading"
    assert any("Waiting for room" in line for line in said)
    assert any("1584218" in line for line in said), "it names who is using the machine"
    assert any("room again" in line for line in said)


def test_it_refuses_when_the_machine_never_settles():
    said = []

    started, _load = wait_for_room(
        read_load=lambda: 12.0,
        cores=16,
        sleep=lambda _seconds: None,
        announce=said.append,
        list_busiest=lambda: ["4242 380.0 00:12:00 some-game"],
        budget_seconds=60,
        poll_seconds=30,
    )

    assert started is False
    # The message has to name the cause and what to do about it, or it reads as the gate breaking.
    assert any("The machine is busy" in line for line in said)
    assert any("4242" in line for line in said)
    assert any("another agent" in line for line in said)


def test_the_run_header_never_calls_a_load_quiet_that_the_gate_refuses():
    """On 2026-09-19 the first two lines of a run disagreed about the same reading: the header said
    `2.52 ... (0.16/core, quiet)` and the line under it said the machine was too busy to start. One
    threshold decides, and the header reads it."""
    from build import _load_verdict

    refused = room_threshold(16) + 0.5
    assert "quiet" not in _load_verdict([refused, 0, 0], 16)
    assert "the gate will wait" in _load_verdict([refused, 0, 0], 16)

    shared = quiet_threshold(16) + 0.5
    assert "shared" in _load_verdict([shared, 0, 0], 16)

    allowed = quiet_threshold(16) - 0.5
    assert _load_verdict([allowed, 0, 0], 16).endswith("quiet")
