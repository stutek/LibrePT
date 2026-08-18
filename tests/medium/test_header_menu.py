# tests/medium/test_header_menu.py
# End-to-end coverage of the application (hamburger / ☰) header menu (TODO 10.1): the dropdown
# toggles and closes on an outside click, its items are translated, GitHub is a real new-tab
# link, Export opens the Sync & Backup modal, About/Terms open their modals, and Connect cloud
# storage opens the Drive sync card. Mounted via tests/medium/_harness.py's HEADER_STUB.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start


def _issue_tracker_url(page):
    """The address src/data/publicUrls.js declares, read in the page rather than repeated here."""
    return page.evaluate(
        """async () => {
            const urls = await import(new URL('data/publicUrls.js', document.baseURI).href);
            return urls.ISSUE_TRACKER_URL;
        }"""
    )


def _open_menu(page):
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")


def test_menu_toggles_and_closes_on_outside_click(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    menu = page.locator("#app-menu")
    assert "hidden" in (menu.get_attribute("class") or "")

    _open_menu(page)
    assert page.locator("#btn-app-menu").get_attribute("aria-expanded") == "true"

    # Clicking a neutral element outside the menu dismisses it.
    page.locator("#logo-area").click()
    page.wait_for_function(
        "() => document.getElementById('app-menu').classList.contains('hidden')"
    )
    assert page.locator("#btn-app-menu").get_attribute("aria-expanded") == "false"


def test_menu_items_present_and_github_link(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    for item_id, text in [
        ("#menu-connect-cloud", "Connect cloud storage"),
        ("#menu-export-data", "Export data as a file"),
        ("#menu-github", "GitHub project"),
        ("#menu-about", "About"),
        ("#menu-terms", "Terms & disclaimer"),
        ("#menu-privacy", "Privacy & GDPR Statement"),
    ]:
        el = page.locator(item_id)
        assert el.is_visible()
        assert text in el.inner_text()

    github = page.locator("#menu-github")
    # Compared against the app's own declaration rather than a second copy of the URL: what this
    # asserts is that the menu points at the tracker publicUrls.js names, not that the tracker is
    # any particular address (TODO §28.1).
    assert github.get_attribute("href") == _issue_tracker_url(page)
    assert github.get_attribute("target") == "_blank"

    # The privacy policy is a SHIPPED page now, not a GitHub link — which is what makes it readable
    # offline and what OAuth verification requires (a policy on a domain we own). The distinction
    # from #menu-github above is the point: the repo link goes off-site on purpose, this one must not.
    privacy = page.locator("#menu-privacy")
    assert privacy.get_attribute("href") == "./privacy.html"
    assert "github.com" not in (privacy.get_attribute("href") or "")
    assert privacy.get_attribute("target") == "_blank"


def test_export_item_opens_backup_modal(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    page.locator("#menu-export-data").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None
    # The menu closed behind the modal.
    assert "hidden" in (page.locator("#app-menu").get_attribute("class") or "")


def test_about_modal_opens_and_closes(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    page.locator("#menu-about").click()
    about = page.locator("#dialog-about")
    assert about.get_attribute("open") is not None
    assert page.locator("#about-repo-link").get_attribute("href") == _issue_tracker_url(
        page
    )

    page.locator("#dialog-about .modal-close-btn").click()
    assert about.get_attribute("open") is None


def test_terms_modal_opens_and_agree_closes_it(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    page.locator("#menu-terms").click()
    terms = page.locator("#dialog-terms")
    assert terms.get_attribute("open") is not None
    assert page.locator("#btn-terms-agree").is_visible()

    page.locator("#btn-terms-agree").click()
    assert terms.get_attribute("open") is None


def test_connect_cloud_opens_the_drive_sync_card(page, local_server):
    # menu-connect-cloud opens the Sync & Backup dialog on its Google Drive card (driveSyncUi.js).
    # What that card shows is test_drive_sync_ui.py's concern; this pins only the routing.
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    page.locator("#menu-connect-cloud").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None
    assert page.locator("#drive-sync-card").is_visible()


def test_menu_labels_translate_to_slovenian(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    # The language switcher lives inside the ☰ menu, so open it first, then switch.
    _open_menu(page)
    page.locator("#lang-switcher").select_option("sl")

    assert "Poveži shrambo" in page.locator("#menu-connect-cloud").inner_text()
    assert "O aplikaciji" in page.locator("#menu-about").inner_text()
    # A navigation item, not just the dialog entries — inherited from the deleted
    # tests/e2e/test_clipboard.py, whose every other assertion test_gym_floor_flow.py already made.
    assert page.locator("#menu-routines").inner_text().strip() == "Rutine"
    # The relocated control labels translate too.
    assert page.locator("#menu-label-lang").inner_text().strip() == "Jezik"
    assert page.locator("#menu-label-theme").inner_text().strip() == "Tema"


def test_every_menu_item_is_reachable_on_a_phone(page, local_server):
    """The menu grew past the screen and nothing said so — items below the fold were simply
    untappable, which on a phone is the same as not existing (AGENT_RULES §2.D.1).

    Found on 2026-08-17: adding one item pushed `#menu-terms` out of the viewport and broke
    test_terms_modal_opens_and_agree_closes_it. The menu now caps its height under the header and
    scrolls, so this asserts the property that was missing rather than the item count that happened to
    fit — the next item added must not be able to reintroduce it.

    Asserted at 390x844 (iPhone 14, the narrowest real device in tests/e2e/test_layout_overflow.py)
    because the shortest viewport is where a tall menu fails first.
    """
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    menu = page.locator("#app-menu")
    # The menu fits the space under the header rather than running past the bottom of the screen.
    fits = page.evaluate("""() => {
      const menu = document.getElementById('app-menu');
      const box = menu.getBoundingClientRect();
      return box.bottom <= window.innerHeight + 1;
    }""")
    assert fits, "the app menu extends past the bottom of the viewport"

    # And the last item is genuinely reachable: scrollable into view inside the menu, then clickable.
    last_item = menu.locator(".session-menu-item, a.session-menu-item").last
    last_item.scroll_into_view_if_needed()
    assert last_item.is_visible()
    box = last_item.bounding_box()
    assert box["y"] + box["height"] <= 844 + 1, "the last menu item sits below the fold"


# ── The app name is the way home (reported 2026-08-18) ─────────────────────────────────────────
# "clicking on application header application name does not link to homepage, seems to be a noop on
# the session list page". Two things were true. It was a <div> with a click handler — not a link at
# all, so it could not be focused, could not be opened in a new tab, and was announced as nothing;
# and on the dashboard it navigated to the route already on screen, which looks like a dead control
# whatever the router did underneath.


def test_the_app_name_is_a_real_link(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    logo = page.locator("#logo-area")
    assert logo.evaluate("el => el.tagName") == "A", "the way home has to BE a link"
    assert logo.get_attribute("href"), "a link with no href is a div wearing a costume"
    # Reachable without a pointer: a link a keyboard cannot get to is not a link either.
    page.keyboard.press("Tab")
    assert page.evaluate("() => document.activeElement?.id") == "logo-area"


def test_tapping_it_goes_home_without_letting_the_browser_leave(page, local_server):
    """The href is what makes it a link; the handler is what keeps it a single-page app. Both, or
    the tap reloads the whole app from the network — which in a basement gym is the one thing that
    must never be required."""
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    url_before = page.url

    page.locator("#logo-area").click()

    assert page.evaluate("() => window.__navigatedTo") == "/"
    assert page.url == url_before, "the browser must not have followed the href"
