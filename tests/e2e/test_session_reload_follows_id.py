# tests/e2e/test_session_reload_follows_id.py
# A deep link must follow the session id in the URL. When the in-memory session is gone (a reload)
# and its persisted cache has expired, the router resolves the URL's {sessionId} against known
# bookings and re-launches that session — instead of opening a blank "Workout Session Setup" modal.
# An id that names nothing lands on the not-found view rather than the setup modal.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re


def _base(page):
    """The app's base path (e.g. '/LibrePT'), read from <base>."""
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _nav(page, path):
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(300)


def _open_session(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(700)
    page.locator(
        ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    ).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def test_reload_with_expired_cache_relaunches_from_the_url_session_id(page, local_server):
    _open_session(page, local_server)
    base = _base(page)

    # The session's id in the URL is the booking id it was launched from.
    url = page.evaluate("() => location.pathname")
    m = re.match(re.escape(base) + r"/session/([^/]+)", url)
    assert m, f"expected a /session/ URL, got {url}"

    # Simulate the cache expiring (recoverActiveSession also purges sessions >2h past their end):
    # drop the persisted session but keep the deep-link URL, then reload as a cold boot.
    page.evaluate("() => localStorage.removeItem('librept_active_session')")
    page.reload()
    page.wait_for_timeout(800)

    # The deep link followed the id: the session was re-launched from its booking, so the clipboard
    # overlay is showing — NOT the blank workout-setup modal the old fallback opened.
    assert page.locator("#active-session-overlay").is_visible()
    assert page.evaluate(
        "() => document.getElementById('dialog-workout-setup')?.open === true"
    ) is False, "an expired session URL wrongly opened the Workout Session Setup modal"
    # The URL still names the session it was asked for.
    assert page.evaluate("() => location.pathname").startswith(m.group(0))


def test_unknown_session_id_shows_not_found_not_setup_modal(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    base = _base(page)

    _nav(page, f"{base}/session/no-such-session-id-xyz")

    # An id that resolves to nothing lands on the not-found view, and never the setup modal.
    assert page.locator("#view-error").is_visible()
    assert page.evaluate(
        "() => document.getElementById('dialog-workout-setup')?.open === true"
    ) is False, "an unknown session URL wrongly opened the Workout Session Setup modal"
