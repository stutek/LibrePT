# tests/unit/test_quiet_machine.py — the gate refuses to start on a busy machine (TODO §64).
#
# Pure decision plus an injected clock, so the waiting is tested without a busy machine and without
# waiting. What it protects: five gate runs on one tree in an hour, each red on a different test,
# every one of which passed alone — the box was saturated, not the tree broken.

from build.quiet_machine import (
    machine_is_quiet,
    quiet_threshold,
    wait_for_quiet_machine,
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


def test_it_waits_for_a_busy_machine_and_starts_when_it_settles():
    loads = [4.0, 3.0, 0.5]
    slept = []
    said = []

    started = wait_for_quiet_machine(
        read_load=lambda: loads.pop(0),
        cores=16,
        sleep=slept.append,
        announce=said.append,
        budget_seconds=600,
        poll_seconds=30,
    )

    assert started is True
    assert slept == [30, 30], "it waited twice, once per busy reading"
    assert any("Waiting for the machine" in line for line in said)
    assert any("quiet again" in line for line in said)


def test_it_refuses_when_the_machine_never_settles():
    said = []

    started = wait_for_quiet_machine(
        read_load=lambda: 6.0,
        cores=16,
        sleep=lambda _seconds: None,
        announce=said.append,
        budget_seconds=60,
        poll_seconds=30,
    )

    assert started is False
    # The message has to name the cause and what to do about it, or it reads as the gate breaking.
    assert any("The machine is busy" in line for line in said)
    assert any("another agent" in line for line in said)


def test_the_run_header_never_calls_a_load_quiet_that_the_gate_refuses():
    """On 2026-09-19 the first two lines of a run disagreed about the same reading: the header said
    `2.52 ... (0.16/core, quiet)` and the line under it said the machine was too busy to start. One
    threshold decides, and the header reads it."""
    from build import _load_verdict

    refused = quiet_threshold(16) + 0.5
    assert "quiet" not in _load_verdict([refused, 0, 0], 16)
    assert "the gate will wait" in _load_verdict([refused, 0, 0], 16)

    allowed = quiet_threshold(16) - 0.5
    assert _load_verdict([allowed, 0, 0], 16).endswith("quiet")
