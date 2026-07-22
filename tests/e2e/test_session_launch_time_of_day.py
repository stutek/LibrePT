# tests/e2e/test_session_launch_time_of_day.py
# Regression guard for a time-of-day-dependent launch bug: the demo generates session times
# relative to "now", so late in the evening a live session's range crossed midnight
# (e.g. "22:00 - 00:00"). parseTimeRange then read it as inverted (end < start), isTimeOverlapping
# failed even against itself, getOverlappingBookings returned [], and clicking the card silently
# did nothing (launchClipboardDirectly bailed at clientRoutines.length === 0). The wall clock is
# mocked here so the check is deterministic regardless of when the suite runs.

import pytest


@pytest.mark.parametrize("hour", [10, 23])
def test_live_session_card_launches_regardless_of_hour(page, local_server, hour):
    # Install the synthetic clock before navigating so the demo seed generates its relative
    # session times against this hour (23:xx makes a live session's range cross midnight).
    page.clock.install(time=f"2026-07-23T{hour:02d}:10:00")
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator(
        ".booking-card", has_text="Group Strength & Conditioning"
    ).first.click()

    # The clipboard overlay must open. Before the parseTimeRange midnight-crossing fix this
    # timed out at hour 23 because the card's click launched nothing.
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
