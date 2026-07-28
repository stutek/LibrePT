# tests/e2e/test_edit_mode_hides_complete.py
# TODO §8.4 — "Complete Workout Session" is a LIVE-session action: it logs the session to history.
# It must therefore disappear while the plan is being edited (Done exits edit mode instead) and stay
# gone for a planning-mode programme that was never run at all. The whole footer hides, so the
# clipboard is not left with an empty action bar.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

FOOTER = "#active-session-overlay .session-actions-footer"


def _open_live_session(page, local_server):
    page.goto(local_server)
    card = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card)
    page.locator(card).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)
    # Opening the clipboard only stages the session — the trainer must explicitly start it before
    # any live-session-only affordance (like Complete) is offered.
    page.click("#btn-start-session")
    page.wait_for_timeout(200)


def test_live_session_offers_complete(page, local_server):
    _open_live_session(page, local_server)
    assert page.locator(FOOTER).is_visible() is True
    assert page.locator("#btn-finish-session").is_visible() is True


def test_complete_hides_in_edit_mode_and_returns_on_done(page, local_server):
    _open_live_session(page, local_server)

    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)

    assert page.locator(FOOTER).is_visible() is False, (
        "editing a plan must not offer finish-and-log-history"
    )
    assert page.locator("#btn-finish-session").is_visible() is False
    # Done is the only exit offered while editing.
    assert page.locator("#btn-done-edit").is_visible() is True

    page.click("#btn-done-edit")
    page.wait_for_timeout(300)

    assert page.locator(FOOTER).is_visible() is True, (
        "exiting edit mode restores the footer"
    )
    assert page.locator("#btn-finish-session").is_visible() is True


def test_planning_session_never_offers_complete(page, local_server):
    """A planning-mode programme has no execution to complete — not even after leaving edit mode."""
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.locator("#clients-list .client-card").first.click()
    page.wait_for_selector("#view-client-detail.active")

    page.click("#btn-plan-client-program")
    page.wait_for_selector("#view-workout-setup.active")

    # The client arrives preselected; assign any routine so the programme can be created.
    row = page.locator(
        "#setup-participants-assignment-list .participant-setup-row"
    ).first
    row.locator('input[type="checkbox"]').check()
    row.locator("select").select_option(index=1)
    # The schedule fields are required by the form even for a date-less programme.
    page.fill("#setup-session-date", "2026-08-01")
    page.fill("#setup-start-time", "09:00")
    page.fill("#setup-end-time", "10:00")
    page.click("#form-workout-setup button[type='submit']")

    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)

    assert page.locator(FOOTER).is_visible() is False, (
        "a planning programme must not be completable"
    )

    # Leaving edit mode does not turn it into a live session either.
    page.click("#btn-done-edit")
    page.wait_for_timeout(300)
    assert page.locator(FOOTER).is_visible() is False
