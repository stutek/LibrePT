# tests/e2e/test_edit_mode_titlebar.py
# Edit mode's chrome lives on the session title bar, not in a header inside the editor body: the ✎
# mode icon rides on the "Editing · <client>" title, the Done button sits in the title actions, and
# the editor body carries no redundant "Edit plan" header. Done exits back to the live deck.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_session(page, local_server):
    page.goto(local_server)
    card_sel = ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def test_edit_chrome_is_on_the_title_bar(page, local_server):
    _open_session(page, local_server)

    # Live deck: Done hidden, ✎ trigger visible, no editor header anywhere.
    assert page.locator("#btn-done-edit").is_visible() is False
    assert page.locator("#btn-edit-plan").is_visible() is True

    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)

    state = page.evaluate(
        """() => ({
            doneVisible: !document.getElementById('btn-done-edit').classList.contains('hidden'),
            titleHasPen: !!document.querySelector('#session-title-text i.fa-pen-to-square'),
            editorHeaders: document.querySelectorAll('.clipboard-editor-head, .clipboard-editor-title').length,
            editTriggerHidden: document.getElementById('btn-edit-plan').classList.contains('hidden'),
        })"""
    )
    # ✎ icon + Done moved up to the title line; the "Edit plan" header/label is gone.
    assert state["doneVisible"] is True
    assert state["titleHasPen"] is True
    assert state["editorHeaders"] == 0
    assert state["editTriggerHidden"] is True


def test_titlebar_done_exits_to_live_deck(page, local_server):
    _open_session(page, local_server)
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)

    page.click("#btn-done-edit")
    page.wait_for_timeout(300)

    assert page.locator(".clipboard-editor").count() == 0, "Done should exit the editor"
    assert page.locator("#btn-done-edit").is_visible() is False
    assert page.locator("#btn-edit-plan").is_visible() is True
