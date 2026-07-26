# tests/e2e/test_dialog_routing.py
# A dialog is a state a reload should restore, so the globally-reachable ones (About, Terms, Build
# info, Sync & Backup) are routes. Three things must hold, and they are what this file pins:
#   * Back closes the dialog — the universal dismiss gesture on the phone this app lives on;
#   * the ✕ and Back agree, so the address bar never names a dialog that is off screen;
#   * a cold link (or a reload while one is open) reopens it over a real view, not a blank shell.
# The first-run terms agreement is deliberately NOT routed: it is a boot precondition, and Back must
# not dismiss an agreement that has not been accepted.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _path(page):
    return page.evaluate("() => location.pathname")


def _open_about(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#btn-app-menu")
    page.wait_for_timeout(300)
    page.locator("#btn-app-menu").click()
    page.locator("#menu-about").click()
    page.wait_for_selector("#dialog-about[open]")


def test_opening_a_dialog_is_a_navigation(page, local_server):
    _open_about(page, local_server)
    assert _path(page).endswith("/about")


def test_back_closes_the_dialog(page, local_server):
    _open_about(page, local_server)
    page.go_back()
    page.wait_for_selector("#dialog-about", state="hidden")
    # And lands on the view that was underneath, not out of the app.
    assert "/sessions/" in _path(page)


def test_the_close_button_and_back_agree(page, local_server):
    """Closing by ✕ must pop the entry that opened the dialog, or the URL keeps naming it."""
    _open_about(page, local_server)
    page.locator("#dialog-about .modal-close-btn").click()
    page.wait_for_selector("#dialog-about", state="hidden")
    page.wait_for_timeout(300)
    assert not _path(page).endswith("/about"), (
        "the ✕ closed the dialog but left its URL behind"
    )
    assert "/sessions/" in _path(page)


def test_escape_closes_and_pops_too(page, local_server):
    _open_about(page, local_server)
    page.keyboard.press("Escape")
    page.wait_for_selector("#dialog-about", state="hidden")
    page.wait_for_timeout(300)
    assert not _path(page).endswith("/about")


def test_cold_deep_link_opens_the_dialog_over_a_real_view(page, local_server):
    page.goto(local_server + "backup")
    page.wait_for_selector("#dialog-backup[open]")
    # The dashboard is painted behind it — a dialog is never the whole screen.
    page.wait_for_selector("#view-clients.active")


def test_back_from_a_cold_deep_link_stays_in_the_app(page, local_server):
    """Arriving straight at a dialog URL has nothing underneath; the router synthesises the entry."""
    page.goto(local_server + "backup")
    page.wait_for_selector("#dialog-backup[open]")
    page.wait_for_timeout(300)

    page.go_back()
    page.wait_for_selector("#dialog-backup", state="hidden")
    assert "/sessions/" in _path(page), "Back from a cold dialog link left the app"


def test_reload_reopens_the_routed_dialog(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-version")
    page.wait_for_timeout(300)
    page.locator("#app-version").click()
    page.wait_for_selector("#dialog-build-info[open]")

    page.reload()
    page.wait_for_selector("#dialog-build-info[open]")
    assert _path(page).endswith("/build")


def test_build_stamp_does_not_also_navigate_home(page, local_server):
    """The stamp sits inside #logo-area, whose click goes home — that must not close the dialog."""
    page.goto(local_server + "exercises")
    page.wait_for_selector("#view-exercises.active")
    page.locator("#app-version").click()
    page.wait_for_selector("#dialog-build-info[open]")
    page.wait_for_timeout(400)
    assert page.locator("#dialog-build-info[open]").count() == 1
    assert _path(page).endswith("/build")


def test_a_background_render_does_not_clobber_an_open_dialog(page, local_server):
    """Syncing redraws the dashboard underneath; the day deck must not push its URL over the dialog."""
    page.goto(local_server)
    page.wait_for_selector("#backup-btn")
    page.wait_for_timeout(300)
    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")

    page.locator("#btn-sync-data").click()
    page.wait_for_selector("#sync-status.text-emerald")
    assert _path(page).endswith("/backup"), (
        "a background re-render pushed over the dialog's URL"
    )

    page.locator("#dialog-backup .modal-close-btn").click()
    page.wait_for_selector("#dialog-backup", state="hidden")


def test_first_run_terms_is_not_routed(browser, local_server):
    """The mandatory agreement is a boot precondition, not a place the trainer navigated to.

    Own context, like test_first_run_terms.py: the conftest auto-accept covers the shared `page`
    fixture and would suppress the modal entirely.
    """
    context = browser.new_context()
    page = context.new_page()
    try:
        page.goto(local_server)
        page.wait_for_selector("#dialog-terms[open]")

        assert not _path(page).endswith("/terms"), (
            "the first-run agreement claimed a history entry"
        )
        # Escape stays blocked, and the router has not claimed the dialog.
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        assert page.locator("#dialog-terms[open]").count() == 1
        assert (
            page.evaluate(
                "() => document.getElementById('dialog-terms').dataset.routeName"
            )
            is None
        )
    finally:
        context.close()


def test_terms_from_the_menu_is_routed(page, local_server):
    """Reopened from the ☰ menu it is an ordinary dialog, so it gets a URL and Back closes it."""
    page.goto(local_server)
    page.wait_for_selector("#btn-app-menu")
    page.wait_for_timeout(300)
    page.locator("#btn-app-menu").click()
    page.locator("#menu-terms").click()
    page.wait_for_selector("#dialog-terms[open]")
    assert _path(page).endswith("/terms")

    page.go_back()
    page.wait_for_selector("#dialog-terms", state="hidden")
