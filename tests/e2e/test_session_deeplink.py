# tests/e2e/test_session_deeplink.py
# The active-session view is deep-linkable down to the in-focus card:
#   {base}/session/{sessionId}/client/{clientId}/superset/{circuitId}
#   {base}/session/{sessionId}/client/{clientId}/exercise/{exerciseId}
# where {base} is the app's sub-path (/LibrePT). Opening the session upgrades the URL to the
# focused card; tapping a card or navigating to such a URL moves focus; a stale/unknown card id
# is ignored (URL falls back to the real focus).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re


def _base(page):
    """The app's base path (e.g. '/LibrePT'), read from <base>."""
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _focus_re(base):
    return re.compile("^" + re.escape(base) + r"/session/([^/]+)/client/([^/]+)/(exercise|superset)/([^/]+)$")


def _nav(page, path):
    """Drive the client-side router to `path` the way an opened/typed deep link would."""
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(300)


def _open_session(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(700)  # let the seeded active session recover
    page.eval_on_selector("#active-session-bar", "el => el.click()")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def test_session_view_deep_links_to_focused_card(page, local_server):
    _open_session(page, local_server)
    base = _base(page)
    focus_re = _focus_re(base)

    # Opening the session upgrades the bare URL to the in-focus card (a seeded superset).
    url_open = page.evaluate("() => location.pathname")
    m = focus_re.match(url_open)
    assert m, f"session URL did not carry a focused card: {url_open}"
    session_id, client_id, _, _ = m.groups()

    # A seeded superset circuit id (different from whatever is focused now) resolves on navigation:
    # the app keeps the URL on that card (it would rewrite it away if the id didn't resolve).
    cache = page.evaluate("() => JSON.parse(localStorage.getItem('librept_active_session'))")
    circuits = []
    for ex in cache["clientRoutines"][client_id]["exercises"]:
        if ex.get("circuitId") and ex["circuitId"] not in circuits:
            circuits.append(ex["circuitId"])
    assert len(circuits) >= 2, "expected the seeded routine to have multiple supersets"
    target_superset = f"{base}/session/{session_id}/client/{client_id}/superset/{circuits[-1]}"
    _nav(page, target_superset)
    assert page.evaluate("() => location.pathname") == target_superset

    # Inject a standalone (non-superset) exercise: it auto-focuses, so the URL becomes an
    # /exercise/{id} deep link — covering the standalone-card route end to end.
    page.eval_on_selector("#btn-add-exercise-to-session", "el => el.click()")
    page.wait_for_selector("#dialog-add-session-exercise[open]")
    page.fill("#session-add-select-ex", "Deep Link Test Move")
    page.locator("#form-add-session-exercise button[type='submit']").click()
    page.wait_for_selector("#dialog-add-session-exercise", state="hidden")
    page.wait_for_timeout(300)

    url_injected = page.evaluate("() => location.pathname")
    m2 = focus_re.match(url_injected)
    assert m2 and m2.group(3) == "exercise", f"inject did not focus an exercise route: {url_injected}"

    # Navigate away to the superset, then back to the injected exercise deep link: both resolve.
    _nav(page, target_superset)
    assert page.evaluate("() => location.pathname") == target_superset
    _nav(page, url_injected)
    assert page.evaluate("() => location.pathname") == url_injected

    # A stale/unknown card id is ignored: the URL falls back to a real focused-card path
    # rather than sticking on the bogus one.
    bogus = f"{base}/session/{session_id}/client/{client_id}/exercise/nonexistent-id"
    _nav(page, bogus)
    after = page.evaluate("() => location.pathname")
    assert after != bogus and focus_re.match(after), f"stale id was not ignored: {after}"


def test_tapping_a_card_updates_the_deep_link(page, local_server):
    _open_session(page, local_server)
    focus_re = _focus_re(_base(page))

    before = page.evaluate("() => location.pathname")
    # Tap a non-focused, non-past card in the deck; focus (and the URL) must move to it.
    tapped = page.evaluate(
        """() => {
          const cards = [...document.querySelectorAll('#active-exercise-scroll-deck .exercise-deck-card')];
          const t = cards.find(c => !c.classList.contains('in-focus') && !c.querySelector('.deck-card-status-past'));
          if (!t) return false;
          t.click();
          return true;
        }"""
    )
    assert tapped, "no tappable upcoming card found in the deck"
    page.wait_for_timeout(300)
    after = page.evaluate("() => location.pathname")
    assert after != before and focus_re.match(after), f"tap did not update the deep link: {after}"
