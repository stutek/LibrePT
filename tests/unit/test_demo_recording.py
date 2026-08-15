"""Unit tests for agent_tools/demo_recording.py — the demo-tour video recorder.

The tool needs a browser and a dev server, so what is testable here is the decision it hinges on:
whether to save the file at all. That decision is the whole reason the tool is safe to have — a
recorder that writes a video regardless of the tour's outcome would reintroduce exactly the stale,
confident-looking asset TODO §23.5 rejected, only now it would be showing a *broken* app.
"""

import pytest

from agent_tools import demo_recording


def test_a_fully_passing_tour_has_nothing_to_report():
    results = [{"id": "open-session", "ok": True}, {"id": "signal", "ok": True}]
    assert demo_recording.failed_steps(results) == []


def test_a_failing_step_is_reported_so_the_video_is_refused():
    results = [
        {"id": "open-session", "ok": True},
        {"id": "signal", "ok": False, "reason": "gone"},
    ]
    problems = demo_recording.failed_steps(results)
    assert [step["id"] for step in problems] == ["signal"]


def test_a_tour_that_produced_no_results_counts_as_failed():
    """The silent case, and the dangerous one: if the tour never ran, `window.__demoTourResults` is
    absent and an emptiness check that read it as "no failures" would film a static screen."""
    for nothing in (None, [], "not-a-list"):
        assert demo_recording.failed_steps(nothing), (
            f"{nothing!r} must not count as success"
        )


def test_the_viewport_default_is_a_phone():
    # The app is used on a gym floor, one-handed. Footage framed as a desktop window would be
    # showing a product nobody has.
    viewport = demo_recording.parse_viewport(demo_recording.DEFAULT_VIEWPORT)
    assert viewport["height"] > viewport["width"]


def test_a_malformed_viewport_is_rejected_rather_than_guessed():
    with pytest.raises(ValueError):
        demo_recording.parse_viewport("wide")
