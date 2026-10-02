# tests/e2e/test_edit_mode_deeplink_reload.py
# Inline plan edit mode is a first-class, deep-linkable state: entering it upgrades the URL to
# /session/{id}/client/{clientId}/edit, and a page reload lands back IN the editor with every plan
# edit intact — including a value still being typed (persisted per keystroke, not just on blur).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re


def _base(page):
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _open_session(page, local_server):
    page.goto(local_server)
    card_sel = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def _open_plan_editor(page):
    """Edit moved into the ⋯ session menu on 2026-08-18, to give the clipboard title its space back."""
    page.click("#btn-session-menu")
    page.wait_for_selector("#session-menu:not(.hidden)")
    page.click("#btn-edit-plan")


def test_edit_mode_deeplinks_and_survives_reload(page, local_server):
    _open_session(page, local_server)
    base = _base(page)

    # Enter edit mode; the URL upgrades to the /edit deep link.
    _open_plan_editor(page)
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)
    url = page.evaluate("() => location.pathname")
    m = re.match(re.escape(base) + r"/session/([^/]+)/client/([^/]+)/edit$", url)
    assert m, f"edit mode should deep-link to /client/.../edit, got {url}"

    # Type a distinctive name into the first exercise row. fill() fires an input event, so the value
    # is persisted per keystroke — no blur/commit needed.
    name = "Reload Proof Movement"
    first_name = page.locator(".editor-row-name").first
    first_name.fill(name)
    page.wait_for_timeout(150)

    # The reload reads the session from its programs in the database, so every write lands first.
    page.evaluate(
        """async () => {
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await queue.flushWrites();
        }"""
    )

    # Reload as a cold boot: no in-memory session, only the stored programs + the /edit URL.
    page.reload()
    page.wait_for_timeout(900)

    # We land back in the editor (not the live logging deck)...
    assert page.locator(".clipboard-editor").is_visible(), (
        "reload should restore the inline editor"
    )
    assert page.evaluate(
        "() => document.getElementById('active-session-overlay').classList.contains('editing-plan')"
    ), "overlay should still be in editing-plan mode after reload"
    # ...the URL is still the edit deep link...
    assert page.evaluate("() => location.pathname").endswith("/edit"), (
        "URL should still end with /edit after reload"
    )
    # ...and the value typed before the reload is intact.
    values = page.eval_on_selector_all(
        ".editor-row-name", "els => els.map(e => e.value)"
    )
    assert name in values, f"typed exercise name lost on reload; rows = {values}"


def test_edit_deeplink_typed_directly_restores_editor(page, local_server):
    # Open + enter edit so a real session exists and is cached, capture its edit URL, leave to the
    # live deck, then navigate straight to the edit URL: it must reopen the editor.
    _open_session(page, local_server)
    _open_plan_editor(page)
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)
    edit_url = page.evaluate("() => location.pathname")

    # Exit edit mode (Esc) — back on the live deck, URL drops /edit.
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    assert not page.evaluate("() => location.pathname").endswith("/edit")

    # Navigate to the edit deep link directly.
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        edit_url,
    )
    page.wait_for_timeout(400)
    assert page.locator(".clipboard-editor").is_visible(), (
        "edit deep link should reopen the editor"
    )


def test_a_plan_written_up_after_its_slot_survives_reload(page, local_server):
    """The morning session recorded in the afternoon. Its slot ended three hours ago, but the
    trainer is editing its plan now, so a reload must not throw the plan away as forgotten."""
    _open_session(page, local_server)
    page.evaluate(
        """async () => {
            const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
            const session = ctrl.getActiveSession();
            session.started = false;
            session.startTime = null;
            session.sourceSession.startDate = new Date(Date.now() - 4 * 3600000);
            session.sourceSession.endDate = new Date(Date.now() - 3 * 3600000);
        }"""
    )
    _open_plan_editor(page)
    page.wait_for_selector(".clipboard-editor")
    name = "Written Up Later"
    page.locator(".editor-row-name").first.fill(name)
    page.wait_for_timeout(150)

    page.reload()
    page.wait_for_timeout(900)

    values = page.eval_on_selector_all(
        ".editor-row-name", "els => els.map(e => e.value)"
    )
    assert name in values, (
        f"the plan written up after its slot was lost on reload; rows = {values}"
    )
