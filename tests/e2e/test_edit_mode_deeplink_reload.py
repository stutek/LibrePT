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
    card_sel = ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def test_edit_mode_deeplinks_and_survives_reload(page, local_server):
    _open_session(page, local_server)
    base = _base(page)

    # Enter edit mode; the URL upgrades to the /edit deep link.
    page.click("#btn-edit-plan")
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

    # Push the cached session's booking.endDate safely into the future before reloading:
    # recoverActiveSession() discards (and freshly relaunches from the routine template, losing
    # any in-memory edit) any cached session more than 2h past its scheduled end, and this seed
    # booking's end time is clamped to at most 18:00 (src/data/sessions.js) -- without this, the
    # test starts failing every evening once real wall-clock time passes ~20:00, regardless of
    # whether edit-mode reload-persistence itself works.
    page.evaluate(
        """() => {
            const cached = JSON.parse(localStorage.getItem('librept_active_session'));
            if (cached?.booking) {
                cached.booking.endDate = new Date(Date.now() + 3600000).toISOString();
                localStorage.setItem('librept_active_session', JSON.stringify(cached));
            }
        }"""
    )

    # Reload as a cold boot: no in-memory session, only the persisted cache + the /edit URL.
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
    page.click("#btn-edit-plan")
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
