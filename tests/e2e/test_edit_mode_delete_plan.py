# tests/e2e/test_edit_mode_delete_plan.py
# The ⋯ session menu's destructive action is context-aware: on the live deck it reads "Delete
# Session" (cancels the whole session); in the inline plan editor it reads "Delete Plan" and clears
# just the plan's exercises, keeping the session open and still in edit mode.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_session(page, local_server):
    page.goto(local_server)
    card_sel = ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def _delete_btn_text(page):
    return page.text_content("#btn-delete-session").strip()


def test_menu_label_swaps_between_session_and_plan(page, local_server):
    _open_session(page, local_server)

    # Live deck: the destructive item deletes the whole session.
    assert "Session" in _delete_btn_text(page), _delete_btn_text(page)

    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)

    # Edit mode: it now targets the plan.
    assert "Plan" in _delete_btn_text(page), _delete_btn_text(page)


def test_delete_plan_clears_exercises_but_keeps_session(page, local_server):
    _open_session(page, local_server)
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)
    assert page.locator(".editor-row").count() > 0, "editor should start with exercises"

    page.on("dialog", lambda d: d.accept())
    page.click("#btn-session-menu")
    page.wait_for_timeout(100)
    page.click("#btn-delete-session")
    page.wait_for_timeout(300)

    # The plan is emptied but we're still in the session, still in edit mode.
    assert page.locator("#active-session-overlay").is_visible()
    assert page.locator(".clipboard-editor").is_visible(), "should stay in the editor"
    assert page.locator(".editor-row").count() == 0, "all exercise rows should be gone"
