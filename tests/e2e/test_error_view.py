# tests/e2e/test_error_view.py
# End-to-end coverage of the not-found (404) view for invalid deep-link URLs: an unknown
# route and a deep link to a non-existent client both land on #view-error, the omnipresent
# header stays in place, and "Back to dashboard" returns to the sessions view.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _base(page):
    """The app's base path (e.g. '/LibrePT'), read from <base> — the server serves under it."""
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _navigate_client_side(page, path):
    """Drive the client-side router to `path` the way a typed/opened deep link would.

    The dev server serves the app shell for unknown routes (SPA fallback), but pushing the path
    and firing popstate runs the app's own router (handlePathChange) against it directly, which
    is what a same-tab navigation to a bad link does.
    """
    page.evaluate(
        """(p) => { window.history.pushState(null, '', p);
                    window.dispatchEvent(new PopStateEvent('popstate')); }""",
        path,
    )
    page.wait_for_timeout(300)


def test_unknown_route_shows_error_view_with_header(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    bad = _base(page) + "/this-route-does-not-exist"

    _navigate_client_side(page, bad)

    # The not-found view is the active view and names the bad path.
    error_view = page.locator("#view-error")
    assert error_view.get_attribute("class").find("active") != -1
    assert error_view.is_visible()
    assert page.locator("#error-view-path").inner_text().strip() == bad

    # The omnipresent header stays in place on the error view.
    header = page.locator(".app-header")
    assert header.is_visible()
    assert header.bounding_box()["y"] == 0

    # The bad URL is left in the address bar (not silently rewritten to the dashboard).
    assert page.evaluate("() => location.pathname") == bad

    # "Back to dashboard" returns to the sessions dashboard.
    page.locator("#btn-error-home").click()
    page.wait_for_selector("#view-clients.active")
    assert page.locator("#view-error").is_hidden()


def test_deep_link_to_missing_client_shows_error_view(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    _navigate_client_side(page, _base(page) + "/clients/no-such-client-id")

    assert page.locator("#view-error").is_visible()
    assert page.locator(".app-header").is_visible()
