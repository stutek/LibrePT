# tests/e2e/test_session_dialog_routes.py
# The taxonomy picker hanging off a live session (add, and swap-this-row) is a route, so a reload
# reopens it over the restored session instead of dropping the trainer back on the deck mid-browse.
#
# `#dialog-add-session-exercise` is not covered here because it is unreachable UI: its only button
# sits in a `display: none !important` container and the editor never calls its opener (TODO §19).
#
# These add no new class of exposure: the client id is already in the parent session URL.
#
# The interaction that makes this delicate: the session rewrites its own URL to whatever card is in
# focus on every render. That sync must stand down while a dialog names the address bar, or the next
# render erases the dialog's URL and Back reopens it.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _path(page):
    return page.evaluate("() => location.pathname")


def _open_live_session(page, local_server):
    page.goto(local_server)
    card_sel = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def _keep_cached_session_fresh(page):
    """recoverActiveSession discards a cache more than 2h past its scheduled end."""
    page.evaluate(
        """() => {
             const raw = localStorage.getItem('librept_active_session');
             if (!raw) return;
             const cached = JSON.parse(raw);
             if (cached.sourceSession) {
               cached.sourceSession.endDate = new Date(Date.now() + 3600000).toISOString();
             }
             localStorage.setItem('librept_active_session', JSON.stringify(cached));
           }"""
    )


def _enter_edit_mode(page):
    page.locator("#btn-edit-plan").click()
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(300)


def test_add_from_catalog_is_addressable(page, local_server):
    _open_live_session(page, local_server)
    _enter_edit_mode(page)
    page.locator(".editor-catalog-btn").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]")

    assert _path(page).endswith("/catalog"), (
        f"the picker is not addressable: {_path(page)}"
    )


def test_a_render_behind_the_picker_does_not_erase_its_url(page, local_server):
    """The session's focus sync must stand down while a dialog names the address bar."""
    _open_live_session(page, local_server)
    _enter_edit_mode(page)
    page.locator(".editor-catalog-btn").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]")

    # Typing in the picker re-renders; the URL must still be the picker's.
    page.locator(
        "#dialog-catalog-picker input[type='search'], #catalog-picker-mount input"
    ).first.fill("row")
    page.wait_for_timeout(400)
    assert _path(page).endswith("/catalog")


def test_back_closes_the_picker_and_returns_to_the_editor(page, local_server):
    _open_live_session(page, local_server)
    _enter_edit_mode(page)
    page.locator(".editor-catalog-btn").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]")

    page.go_back()
    page.wait_for_selector("#dialog-catalog-picker", state="hidden")
    page.wait_for_selector(".clipboard-editor")
    assert "/edit" in _path(page)


def test_row_swap_picker_names_the_row_and_survives_a_reload(page, local_server):
    _open_live_session(page, local_server)
    _enter_edit_mode(page)
    page.locator(".editor-row .editor-row-catalog").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]")

    path = _path(page)
    assert "/catalog/slot/" in path, f"the swap picker does not name its row: {path}"

    _keep_cached_session_fresh(page)
    page.reload()
    page.wait_for_selector("#dialog-catalog-picker[open]")
    assert _path(page) == path
    # The editor is restored underneath — a dialog is never the whole screen.
    page.wait_for_selector(".clipboard-editor")
