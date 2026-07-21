# tests/e2e/test_session_status_line.py
# Every session card on the dashboard carries a status line (components/sessionCard.js): live
# (existing), a countdown to the scheduled start for not-yet-started sessions, and an editable
# elapsed-time readout for finished ones. All three render H:MM only, no seconds. Closes the loop
# for TODO 2.3. Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

HHMM = re.compile(r"^-?\d{2}:\d\d$")


def test_upcoming_card_shows_a_starts_in_countdown(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # "Morning Conditioning" is in the "tomorrow" bucket (src/data/sessions.js) — always in the
    # future regardless of wall-clock time of day, unlike a same-day currentHour-relative slot
    # (currentHour is clamped to at most 18, so a +3/+4 offset can itself have already started
    # once real time passes ~21:00).
    card = page.locator(".booking-card", has_text="Morning Conditioning").first
    bar = card.locator(".booking-live-bar.upcoming")
    assert bar.count() == 1
    assert "fa-forward-fast" in bar.locator("i").first.get_attribute("class")

    countdown = bar.locator(".booking-live-timer").inner_text().strip()
    assert HHMM.match(countdown), f"expected H:MM countdown, got {countdown!r}"


def test_past_card_shows_editable_elapsed_time(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # "Early Bird Strength" is seeded currentHour-3..-2 with completed: true — always in the past.
    card = page.locator(".booking-card", has_text="Early Bird Strength").first
    bar = card.locator(".booking-live-bar.past")
    assert bar.count() == 1
    assert "fa-clock-rotate-left" in bar.locator("i").first.get_attribute("class")

    value = bar.locator(".booking-status-value")
    elapsed = value.inner_text().strip()
    assert HHMM.match(elapsed), f"expected H:MM elapsed time, got {elapsed!r}"

    # Click to edit, type a new value, commit with Enter.
    value.click()
    edit_input = card.locator(".booking-status-edit-input")
    assert edit_input.count() == 1
    edit_input.fill("02:15")
    edit_input.press("Enter")
    page.wait_for_timeout(300)  # rerenderSessions() re-renders the whole list

    card = page.locator(".booking-card", has_text="Early Bird Strength").first
    new_value = (
        card.locator(".booking-live-bar.past .booking-status-value")
        .inner_text()
        .strip()
    )
    assert new_value == "02:15"

    # Survives a reload (persisted onto the booking via saveToLocalStorage).
    page.reload()
    page.wait_for_selector("#view-clients.active")
    card = page.locator(".booking-card", has_text="Early Bird Strength").first
    assert (
        card.locator(".booking-live-bar.past .booking-status-value")
        .inner_text()
        .strip()
        == "02:15"
    )


def test_finishing_a_session_stamps_completed_and_duration_on_the_booking(
    page, local_server
):
    page.on("dialog", lambda d: d.accept())

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(
        ".booking-card", has_text="Group Strength & Conditioning"
    ).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)

    # finishWorkoutSession() should never have touched state.bookings before this feature — confirm
    # it now stamps completed + duration so the dashboard's past status line has something to show.
    page.locator("#btn-finish-session").click()
    page.wait_for_timeout(300)

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    card = page.locator(".booking-card", has_text="Group Strength & Conditioning").first
    assert "booking-completed" in (card.get_attribute("class") or "")
    bar = card.locator(".booking-live-bar.past")
    assert bar.count() == 1
    assert HHMM.match(bar.locator(".booking-status-value").inner_text().strip())
