# tests/medium/test_header_menu.py
# The application (hamburger / ☰) header menu: five places — training sessions, the client
# directory, exercises and routines, data management, settings — plus Leave the sandbox inside the
# sandbox only. The dropdown toggles and closes on an outside click, its items are translated, Data
# management opens the Sync & Backup dialog, and Settings holds the language and theme, the help and
# legal rows (GitHub a real new-tab link) and the About/Terms dialogs.
# Mounted via tests/medium/_harness.py's HEADER_STUB.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from agent_tools import overflow_scan
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


def _open_settings(page):
    _open_menu(page)
    page.locator("#menu-settings").click()
    page.wait_for_selector("#dialog-settings[open]")


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


def test_the_menu_holds_five_places(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    for item_id, text in [
        ("#menu-sessions", "Training sessions"),
        ("#menu-clients-register", "Clients Directory"),
        ("#menu-library", "Exercises and routines"),
        ("#menu-data", "Data management"),
        ("#menu-settings", "Settings"),
    ]:
        el = page.locator(item_id)
        assert el.is_visible()
        assert text in el.inner_text()
    visible_rows = page.locator("#app-menu .session-menu-item:visible")
    assert visible_rows.count() == 5
    # Outside the sandbox there is nothing to leave.
    assert page.locator("#menu-sandbox-leave").is_hidden()


def test_settings_holds_help_and_legal_and_github_link(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_settings(page)

    for item_id, text in [
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
    # asserts is that the link points at the tracker publicUrls.js names, not that the tracker is
    # any particular address.
    assert github.get_attribute("href") == _issue_tracker_url(page)
    assert github.get_attribute("target") == "_blank"

    # The privacy policy is a SHIPPED page, not a GitHub link — which is what makes it readable
    # offline and what OAuth verification requires (a policy on a domain we own). The distinction
    # from #menu-github above is the point: the repo link goes off-site on purpose, this one must not.
    privacy = page.locator("#menu-privacy")
    assert privacy.get_attribute("href") == "./privacy.html"
    assert "github.com" not in (privacy.get_attribute("href") or "")
    assert privacy.get_attribute("target") == "_blank"


def test_data_management_opens_the_backup_dialog(page, local_server):
    """One row for the cloud, export, import and an encrypted file. Before, two rows (Connect cloud
    storage, Export data as a file) opened this same dialog."""
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_menu(page)

    page.locator("#menu-data").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None
    assert page.locator("#drive-sync-card").is_visible()
    assert page.locator("#btn-backup-open-encrypted").is_visible()
    # The menu closed behind the modal.
    assert "hidden" in (page.locator("#app-menu").get_attribute("class") or "")


def test_about_modal_opens_and_closes(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_settings(page)

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
    _open_settings(page)

    page.locator("#menu-terms").click()
    terms = page.locator("#dialog-terms")
    assert terms.get_attribute("open") is not None
    assert page.locator("#btn-terms-agree").is_visible()

    page.locator("#btn-terms-agree").click()
    assert terms.get_attribute("open") is None


def test_menu_and_settings_translate_to_slovenian(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    # The language switcher lives in Settings.
    _open_settings(page)
    page.locator("#lang-switcher").select_option("sl")

    assert "O aplikaciji" in page.locator("#menu-about").inner_text()
    assert page.locator("#menu-label-lang").inner_text().strip() == "Jezik"
    assert page.locator("#menu-label-theme").inner_text().strip() == "Tema"
    page.locator("#dialog-settings .modal-close-btn").click()

    _open_menu(page)
    assert page.locator("#menu-library").inner_text().strip() == "Vaje in rutine"
    assert page.locator("#menu-data").inner_text().strip() == "Upravljanje podatkov"


def test_every_menu_item_is_reachable_on_a_phone(page, local_server):
    """The menu grew past the screen and nothing said so — items below the fold were simply
    untappable, which on a phone is the same as not existing.

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


def test_nothing_in_the_header_breaks_out_of_it(page, local_server):
    """The bar has no height of its own any more (2026-09-12): it is as tall as what it holds, and
    applicationHeader.js measures the result into --hdr-height for the five surfaces below it.

    So the thing worth gating changed with it. The old assertion here was that the bar spent no more
    than 14px on padding — a number I chose, guarding a number somebody else had chosen. With the
    height DERIVED there is no number left to regress, and what remains is the property that can
    still break: something inside the bar overflowing it, which is a text-length bug as much as a
    layout one and shows up first in Slovenian.

    Swept with agent_tools/overflow_scan.py, the same check the route walk and a hand-run diagnosis
    use, restricted to the header — not a second geometry check written here to drift from it."""
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    for width, height in ((390, 844), (1280, 800)):
        page.set_viewport_size({"width": width, "height": height})
        findings = overflow_scan.scan(page, root=".app-header")
        assert findings == [], (
            f"at {width}px the header cannot hold its own content: {findings}"
        )


def test_the_published_height_is_the_measured_one(page, local_server):
    """Five surfaces position themselves below the bar — the notification area's height, the
    clipboard overlay's top and height, the walkthrough card's offset — and they need a NUMBER.

    They used to read one the bar was TOLD to have, which made the bar's real size and that number
    two facts free to disagree. Now applicationHeader.js measures and publishes, so the contract is
    that they agree. index.css still declares a value, but only as the first-paint fallback, and a
    fallback that drifted from reality would be invisible until something landed in the wrong place."""
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    measured = page.evaluate(
        """() => ({
             bar: Math.round(document.querySelector('.app-header').getBoundingClientRect().height),
             published: getComputedStyle(document.documentElement)
               .getPropertyValue('--hdr-height').trim(),
           })"""
    )
    assert measured["published"] == f"{measured['bar']}px", measured
