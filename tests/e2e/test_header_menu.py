# tests/e2e/test_header_menu.py
# End-to-end coverage of the application (hamburger / ☰) header menu (TODO 10.1): the dropdown
# toggles and closes on an outside click, its items are translated, GitHub is a real new-tab
# link, Export opens the Sync & Backup modal, About/Terms open their modals, and the cloud
# placeholder surfaces a "coming soon" message.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_menu(page):
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")


def test_menu_toggles_and_closes_on_outside_click(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    menu = page.locator("#app-menu")
    assert "hidden" in (menu.get_attribute("class") or "")

    _open_menu(page)
    assert page.locator("#btn-app-menu").get_attribute("aria-expanded") == "true"

    # Clicking a neutral element outside the menu dismisses it.
    page.locator("#view-clients .view-header h2").click()
    page.wait_for_function("() => document.getElementById('app-menu').classList.contains('hidden')")
    assert page.locator("#btn-app-menu").get_attribute("aria-expanded") == "false"


def test_menu_items_present_and_github_link(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    for item_id, text in [
        ("#menu-connect-cloud", "Connect cloud storage"),
        ("#menu-export-data", "Export data as a file"),
        ("#menu-github", "GitHub project"),
        ("#menu-about", "About"),
        ("#menu-terms", "Terms & disclaimer"),
    ]:
        el = page.locator(item_id)
        assert el.is_visible()
        assert text in el.inner_text()

    github = page.locator("#menu-github")
    assert github.get_attribute("href") == "https://github.com/stutek/LibrePT"
    assert github.get_attribute("target") == "_blank"


def test_export_item_opens_backup_modal(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    page.locator("#menu-export-data").click()
    assert page.locator("#dialog-backup").get_attribute("open") is not None
    # The menu closed behind the modal.
    assert "hidden" in (page.locator("#app-menu").get_attribute("class") or "")


def test_about_modal_opens_and_closes(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    page.locator("#menu-about").click()
    about = page.locator("#dialog-about")
    assert about.get_attribute("open") is not None
    assert page.locator("#about-repo-link").get_attribute("href") == "https://github.com/stutek/LibrePT"

    page.locator("#dialog-about .modal-close-btn").click()
    assert about.get_attribute("open") is None


def test_terms_modal_opens_and_agree_closes_it(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    page.locator("#menu-terms").click()
    terms = page.locator("#dialog-terms")
    assert terms.get_attribute("open") is not None
    assert page.locator("#btn-terms-agree").is_visible()

    page.locator("#btn-terms-agree").click()
    assert terms.get_attribute("open") is None


def test_connect_cloud_shows_coming_soon(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    _open_menu(page)

    messages = []
    page.on("dialog", lambda d: (messages.append(d.message), d.dismiss()))
    page.locator("#menu-connect-cloud").click()
    page.wait_for_timeout(200)
    assert messages, "expected a 'coming soon' alert"
    assert "coming soon" in messages[0].lower()


def test_menu_labels_translate_to_slovenian(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # The language switcher now lives inside the ☰ menu, so open it first, then switch.
    _open_menu(page)
    page.locator("#lang-switcher").select_option("sl")

    assert "Poveži shrambo" in page.locator("#menu-connect-cloud").inner_text()
    assert "O aplikaciji" in page.locator("#menu-about").inner_text()
    # The relocated control labels translate too.
    assert page.locator("#menu-label-lang").inner_text().strip() == "Jezik"
    assert page.locator("#menu-label-theme").inner_text().strip() == "Tema"
