# tests/e2e/test_edit_mode_client_focus.py
# When editing the plan, the live-session chrome (active-member tabs + running timer) is hidden and
# the client's goals + notes are surfaced in a focus panel. Exiting edit mode restores the chrome.


def _open_session(page, local_server):
    page.goto(local_server)
    card_sel = ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def _visible(page, selector):
    return page.evaluate(
        """(sel) => {
            const el = document.querySelector(sel);
            if (!el) return false;
            const s = getComputedStyle(el);
            return s.display !== 'none' && s.visibility !== 'hidden';
        }""",
        selector,
    )


def test_edit_mode_hides_chrome_and_shows_client_focus(page, local_server):
    _open_session(page, local_server)

    # Live logging mode: tabs + timer visible, focus panel hidden.
    assert _visible(page, "#active-session-client-tabs")
    assert _visible(page, ".session-timer-block")
    assert not _visible(page, "#clipboard-client-focus")

    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)

    # Edit mode: tabs + timer hidden, focus panel visible with goals + notes populated.
    assert not _visible(page, "#active-session-client-tabs")
    assert not _visible(page, ".session-timer-block")
    assert _visible(page, "#clipboard-client-focus")
    goals = page.text_content("#client-focus-goals").strip()
    notes = page.text_content("#client-focus-notes").strip()
    assert goals, "goals text should be populated"
    assert notes, "notes text should be populated"

    # Exit edit mode -> chrome restored, focus panel hidden again.
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    assert _visible(page, "#active-session-client-tabs")
    assert _visible(page, ".session-timer-block")
    assert not _visible(page, "#clipboard-client-focus")
