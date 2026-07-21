# tests/e2e/test_view_split_navigation.py
# TODO 4.8: the dashboard used to bundle three things into one view/route (#view-clients) --
# the session list, Pending Plan Adjustments, and the Client Directory. Each is now its own
# first-class view with its own route and ☰-menu entry, and the homepage keeps only the session
# list. Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_menu(page):
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")


def test_homepage_only_shows_the_session_list(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    assert page.locator("#sessions-categories-grid").count() == 1
    # Neither of the two extracted sections' content lives in the home view anymore.
    assert page.locator("#view-clients #dashboard-adjustments-list").count() == 0
    assert page.locator("#view-clients #clients-list").count() == 0


def test_menu_navigates_to_pending_adjustments(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    page.locator("#menu-adjustments").click()
    page.wait_for_selector("#view-adjustments.active")
    assert page.url.rstrip("/").endswith("/adjustments")
    assert page.locator("#dashboard-adjustments-list .adjustment-card").count() > 0


def test_menu_navigates_to_client_directory(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    page.locator("#menu-clients-register").click()
    page.wait_for_selector("#view-client-directory.active")
    assert page.url.rstrip("/").endswith("/clients")
    assert page.locator("#clients-list .client-card").count() > 0


def test_logo_returns_home_from_either_new_view(page, local_server):
    page.goto(local_server + "adjustments")
    page.wait_for_selector("#view-adjustments.active")

    page.locator("#logo-area").click()
    page.wait_for_selector("#view-clients.active")


def test_deep_links_to_the_two_new_views(page, local_server):
    page.goto(local_server + "adjustments")
    page.wait_for_selector("#view-adjustments.active")

    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")


def test_pending_adjustments_menu_badge_matches_unresolved_count(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    # Three seeded plan updates start unresolved (src/data/planUpdates.js).
    assert page.locator("#menu-badge-adjustments-count").inner_text().strip() == "3"


# Regression: gestureController.js's goHome() and activeSessionController.js's
# cancelWorkoutSession() both hardcoded navigateToPath("/clients") from when that route was an
# alias for home. Once /clients became the real Client Directory route, leaving the clipboard (or
# deleting a session) silently landed there instead of on the sessions dashboard.


def test_leaving_the_clipboard_via_grab_handle_goes_home_not_client_directory(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(
        ".booking-card", has_text="Group Strength & Conditioning"
    ).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    page.locator("#active-session-overlay .view-grabber").click()
    page.wait_for_selector("#view-clients.active")
    assert page.locator("#view-client-directory.active").count() == 0


def test_deleting_a_session_goes_home_not_client_directory(page, local_server):
    page.on("dialog", lambda d: d.accept())

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(
        ".booking-card", has_text="Group Strength & Conditioning"
    ).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    page.locator("#btn-session-menu").click()
    page.wait_for_selector("#session-menu:not(.hidden)")
    page.locator("#btn-delete-session").click()
    page.wait_for_selector("#view-clients.active")
    assert page.locator("#view-client-directory.active").count() == 0
