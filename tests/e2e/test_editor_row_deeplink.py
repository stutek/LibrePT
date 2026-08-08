# tests/e2e/test_editor_row_deeplink.py
# Inserting a plan item from the live deck flips into the editor with that row called out — but the
# call-out lived only in memory, so a reload landed the trainer back in an undifferentiated plan with
# nothing saying which row they were in the middle of. The row id is now in the URL
# (`/session/{id}/client/{cid}/edit/exercise/{slotId}`), which is what makes it survive.
#
# What a restore is NOT: it is not the moment the row appeared. It keeps the highlight and the scroll
# so the trainer finds their place, but takes no caret (a reload must not pop the phone keyboard) and
# carries no "New" badge (nothing just happened to it).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


import pytest


# Opt this module's tests onto the pooled, storage-reset page (tests/conftest.py's `deeplink_page`)
# instead of a fresh browser context each. Overriding `page` MODULE-LOCALLY keeps every test
# signature and every autouse fixture exactly as they were, and leaves the rest of the suite on the
# default fresh-context path. These tests qualify because each starts by navigating to a URL cold
# and asserts on what the router does with it — none depends on state left by the one before.
@pytest.fixture
def page(deeplink_page):
    return deeplink_page


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


def _insert_exercise_from_the_deck(page):
    # The deck starts fully collapsed on open (deckAllCollapsed) — the fast-adjust bar only renders
    # under the in-focus card, so bring one into focus first (not a past-session reference card,
    # whose own tap toggles a review panel instead of the shared focus index).
    # force=True: collapsed cards use margin-bottom:-24px overlap so the first non-past card may
    # sit behind a stacked card that physically intercepts the pointer — the card is the correct
    # target and IS visible; force bypasses the pointer-events interceptor check.
    page.locator(".exercise-deck-card:not(.past-session)").first.click(force=True)
    page.wait_for_selector(".fast-adjust-bar", timeout=5000)
    page.locator(".fast-adjust-bar .fast-adj-ex").first.click()
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(300)


def test_inserting_a_row_puts_its_id_in_the_url(page, local_server):
    _open_live_session(page, local_server)
    _insert_exercise_from_the_deck(page)

    path = page.evaluate("() => location.pathname")
    assert "/edit/exercise/" in path, f"the inserted row is not addressable: {path}"
    assert path.rsplit("/", 1)[-1], "the row segment is empty"
    # Exactly one row is called out, and it is the one the URL restores (see the reload test).
    assert page.locator(".editor-row-added").count() == 1


def test_the_called_out_row_survives_a_reload(page, local_server):
    _open_live_session(page, local_server)
    _insert_exercise_from_the_deck(page)
    path_before = page.evaluate("() => location.pathname")

    _keep_cached_session_fresh(page)
    page.reload()
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(500)

    assert page.evaluate("() => location.pathname") == path_before
    assert page.locator(".editor-row-added").count() == 1, (
        "the reload landed in the editor but lost the row the trainer was on"
    )


def test_a_restored_row_takes_no_caret_and_carries_no_badge(page, local_server):
    _open_live_session(page, local_server)
    _insert_exercise_from_the_deck(page)

    _keep_cached_session_fresh(page)
    page.reload()
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(500)

    assert page.locator(".editor-row-added .editor-added-badge").count() == 0, (
        "a restored row is not new — the badge would be a lie"
    )
    focused_in_row = page.evaluate(
        "() => !!document.activeElement?.closest?.('.editor-row-added')"
    )
    assert not focused_in_row, (
        "a reload must not steal the caret and pop the phone keyboard"
    )


def test_leaving_edit_mode_drops_the_row_from_the_url(page, local_server):
    _open_live_session(page, local_server)
    _insert_exercise_from_the_deck(page)
    assert "/edit/exercise/" in page.evaluate("() => location.pathname")

    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    path = page.evaluate("() => location.pathname")
    assert "/edit" not in path, f"edit mode exited but its URL stayed: {path}"


def test_a_deleted_row_id_falls_back_instead_of_erroring(page, local_server):
    """A URL can name a row that has since been deleted — like a stale focus card, it is ignored."""
    _open_live_session(page, local_server)
    _insert_exercise_from_the_deck(page)
    base = page.evaluate("() => location.pathname").rsplit("/edit/", 1)[0]

    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        f"{base}/edit/exercise/no-such-slot",
    )
    page.wait_for_timeout(400)

    page.wait_for_selector(".clipboard-editor")
    assert page.locator(".editor-row-added").count() == 0
    assert "no-such-slot" not in page.evaluate("() => location.pathname")
