# tests/e2e/test_moved_session_keeps_plan.py
# A session moved to another hour keeps the plan the trainer built for it in the notebook. The form
# offered such a client no routine, and Save rebuilt their plan from that empty choice: the card then
# said "No program set" and the clipboard "No exercises inserted", with no warning. Two trainer weeks
# found it independently on 2026-10-10, each after moving a session they had planned.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from datetime import timedelta

from playwright.sync_api import expect

from tests.conftest import answer_app_questions, frozen_today

EVA = "c1a9f0e2"
DECK_CARDS = "#active-exercise-scroll-deck .exercise-deck-card"


def _close_invites(page):
    invite = page.locator("#dialog-session-invite[open]")
    if invite.count():
        invite.locator(".modal-cancel").click()


def _flush(page):
    page.evaluate(
        "async () => (await import(new URL('data/writeQueue.js', document.baseURI).href)).flushWrites()"
    )


def _session_with_a_plan_from_the_notebook(page, local_server):
    """A session for tomorrow with Eva on an empty plan, opened in the notebook, where one exercise
    is added from the catalog: the plan has no routine behind it."""
    tomorrow = (frozen_today() + timedelta(days=1)).isoformat()
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#form-workout-setup")
    page.fill("#setup-session-name", "Planned in the notebook")
    page.fill("#setup-session-date", tomorrow)
    page.fill("#setup-start-time", "08:00")
    page.fill("#setup-end-time", "09:00")
    page.fill("#setup-participant-search", "Eva")
    page.click(
        f"#setup-participant-matches .participant-match[data-client-id='{EVA}']"
    )
    page.click("#btn-setup-open")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    _close_invites(page)
    session_id = page.evaluate("() => location.pathname.match(/session\\/([^/]+)/)[1]")

    page.click("#btn-session-menu")
    page.wait_for_selector("#session-menu:not(.hidden)")
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.click(".editor-catalog-btn")
    page.locator(".picker-item").first.click()
    page.wait_for_selector(".clipboard-editor")
    _flush(page)
    return session_id


def test_moving_a_session_keeps_the_plan_built_in_the_notebook(page, local_server):
    answer_app_questions(page)
    session_id = _session_with_a_plan_from_the_notebook(page, local_server)
    page.goto(f"{local_server}session/{session_id}")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    expect(page.locator(DECK_CARDS), "the plan was not built").not_to_have_count(0)

    page.goto(f"{local_server}session/setup/{session_id}")
    page.wait_for_selector("#form-workout-setup")
    page.fill("#setup-start-time", "10:00")
    page.fill("#setup-end-time", "11:00")
    page.click("#btn-setup-save")
    page.wait_for_selector("#view-clients.active")
    _close_invites(page)
    _flush(page)

    card = page.locator(f".session-card[data-session-id='{session_id}']")
    expect(card).to_contain_text("10:00")
    page.goto(f"{local_server}session/{session_id}")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    expect(
        page.locator(DECK_CARDS), "the moved session lost its plan"
    ).not_to_have_count(0)
