# tests/e2e/test_edit_mode_hides_complete.py
# TODO §8.4 — creating a planning-mode programme, end to end: client directory → client detail →
# "Plan Client Program" → the workout-setup form → the clipboard it opens. Four views and a real
# form submission, which is why this one stays here.
#
# The RULE it ends on — that a planning programme never offers "Complete Workout Session", in or out
# of edit mode — moved to tests/medium/test_clipboard_complete_action.py, along with the live and
# edit-mode cases that used to sit here. Those are pure render facts about one component
# (`canStartSession && started`), and a regression in them should not have to be discovered at the
# end of a four-view journey. What this test still proves is the part the medium tier cannot: that
# the creation flow actually ARRIVES at a planning-mode session rather than a live one.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

FOOTER = "#active-session-overlay .session-actions-footer"


def test_planning_programme_created_from_a_client_is_not_completable(
    page, local_server
):
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

    # Arriving in planning mode is the claim: the footer is hidden because currentPlanMode() reads
    # the sourceSession this flow built, not because of anything the clipboard was told directly.
    assert page.locator(FOOTER).is_visible() is False, (
        "the workout-setup flow must create a PLANNING session, not a completable live one"
    )
