# tests/e2e/test_session_status_line.py
# Every session card on the dashboard carries a status line (components/sessionCard.js): live
# (existing), a countdown to the scheduled start for not-yet-started sessions, and an editable
# elapsed-time readout for finished ones. The live/starts-in countdowns render "01h 32m"
# (formatDurationHourMin); the editable elapsed-time field stays "HH:MM" (formatDurationHM,
# parseDurationHM's inverse — it's a value the trainer types back in, not just a countdown display).
# Closes the loop for TODO 2.3. Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

HHMM = re.compile(r"^-?\d{2}:\d\d$")
HOUR_MIN = re.compile(r"^-?\d{2}h \d{2}m$")


def test_upcoming_card_shows_a_starts_in_countdown(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # "Morning Conditioning" is in the "tomorrow" bucket (src/data/sessions.js) — always in the
    # future regardless of wall-clock time of day, unlike a same-day currentHour-relative slot
    # (currentHour is clamped to at most 18, so a +3/+4 offset can itself have already started
    # once real time passes ~21:00).
    card = page.locator(".session-card", has_text="Morning Conditioning").first
    bar = card.locator(".session-live-bar.upcoming")
    assert bar.count() == 1
    assert "fa-forward-fast" in bar.locator("i").first.get_attribute("class")

    countdown = bar.locator(".session-live-timer").inner_text().strip()
    assert HOUR_MIN.match(countdown), f"expected '01h 32m' countdown, got {countdown!r}"


def test_past_card_shows_editable_elapsed_time(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # "Early Bird Strength" is seeded currentHour-3..-2 with completed: true — always in the past.
    card = page.locator(".session-card", has_text="Early Bird Strength").first
    bar = card.locator(".session-live-bar.past")
    assert bar.count() == 1
    assert "fa-clock-rotate-left" in bar.locator("i").first.get_attribute("class")

    value = bar.locator(".session-status-value")
    elapsed = value.inner_text().strip()
    assert HHMM.match(elapsed), f"expected H:MM elapsed time, got {elapsed!r}"

    # Click to edit, type a new value, commit with Enter.
    value.click()
    edit_input = card.locator(".session-status-edit-input")
    assert edit_input.count() == 1
    edit_input.fill("02:15")
    edit_input.press("Enter")
    page.wait_for_timeout(300)  # rerenderSessions() re-renders the whole list

    card = page.locator(".session-card", has_text="Early Bird Strength").first
    new_value = (
        card.locator(".session-live-bar.past .session-status-value")
        .inner_text()
        .strip()
    )
    assert new_value == "02:15"

    # Survives a reload (persisted onto the session via saveToLocalStorage).
    page.reload()
    page.wait_for_selector("#view-clients.active")
    card = page.locator(".session-card", has_text="Early Bird Strength").first
    assert (
        card.locator(".session-live-bar.past .session-status-value")
        .inner_text()
        .strip()
        == "02:15"
    )


def test_finishing_a_session_stamps_completed_and_duration_on_the_session(
    page, local_server
):
    page.on("dialog", lambda d: d.accept())

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(
        ".session-card", has_text="Group Strength & Conditioning"
    ).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)

    # Opening the clipboard only stages the session — it must be explicitly started before it can
    # be completed.
    page.click("#btn-start-session")
    page.wait_for_timeout(200)

    # finishWorkoutSession() should never have touched state.sessions before this feature — confirm
    # it now stamps completed + duration so the dashboard's past status line has something to show.
    page.locator("#btn-finish-session").click()
    page.wait_for_timeout(300)

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    card = page.locator(".session-card", has_text="Group Strength & Conditioning").first
    assert "session-completed" in (card.get_attribute("class") or "")
    bar = card.locator(".session-live-bar.past")
    assert bar.count() == 1
    assert HHMM.match(bar.locator(".session-status-value").inner_text().strip())
