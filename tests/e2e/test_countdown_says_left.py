# tests/e2e/test_countdown_says_left.py
# The number beside a running session says what it counts. A trainer who started two
# minutes ago read "00h 58m" next to "Active session" as the time the session had run.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

SESSION_A = (
    "Group Strength & Conditioning"  # seeded from an hour ago to an hour from now
)


def test_a_session_counting_down_to_its_end_says_left(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(".session-card", has_text=SESSION_A).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-start-session")
    page.click("#dialog-session-start-time[open] .modal-close-btn")
    page.wait_for_selector("#dialog-session-start-time[open]", state="detached")

    caption = page.locator("#overlay-session-timer .session-timer-caption")
    assert caption.is_visible(), "the clipboard's countdown has no word beside it"
    assert caption.inner_text().strip() == "left"

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    card = page.locator(".session-card", has_text=SESSION_A).first
    assert "left" in card.locator(".session-live-bar").inner_text()
