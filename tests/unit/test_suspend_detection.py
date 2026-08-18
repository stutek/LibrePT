# tests/unit/test_suspend_detection.py
# Telling "the machine slept" apart from "the change is slow" (build/__init__.py).
#
# AGENT_RULES §2.A.3 already says a detected time jump means assume interruption rather than a
# regression — but it relied on the agent NOTICING, which is exactly what a rule cannot enforce. A
# suspend/resume drops sockets and stalls timers, producing failed fetches and timing-budget overruns on
# a change that could not plausibly cause them; labelling the run is the difference between chasing a
# ghost and re-running it.
#
# The signal is that a monotonic clock does not advance across a suspend while the wall clock does.

from build import suspend_suspected


def test_a_normal_run_is_not_a_suspend():
    # The two clocks agree to within scheduling noise, which is the ordinary case for every task.
    assert suspend_suspected(monotonic_elapsed=12.0, wall_elapsed=12.4) is False


def test_a_wall_clock_that_ran_far_ahead_is_a_suspend():
    # 15 seconds of work, seven hours of wall time: the machine slept in the middle of it, which is
    # exactly what happened twice on 2026-08-17.
    assert suspend_suspected(monotonic_elapsed=15.0, wall_elapsed=25_215.0) is True


def test_a_slow_task_on_a_loaded_machine_is_not_reported_as_a_suspend():
    """The failure mode to avoid: crying suspend on a gate that was merely starved. A game at 141% CPU
    stretched stages to twice their budget on 2026-08-17 and both clocks advanced together."""
    assert suspend_suspected(monotonic_elapsed=140.0, wall_elapsed=141.0) is False


def test_a_clock_correction_does_not_trip_it_either():
    """NTP nudges the wall clock by fractions of a second, and a laptop rejoining a network can jump it
    by a few. The threshold is well above both, because a false suspend teaches people to ignore it."""
    assert suspend_suspected(monotonic_elapsed=30.0, wall_elapsed=33.0) is False


def test_a_wall_clock_that_went_backwards_is_not_a_suspend():
    # A backwards correction is a different problem and not one this is claiming to detect.
    assert suspend_suspected(monotonic_elapsed=30.0, wall_elapsed=10.0) is False
