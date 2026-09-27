# tests/medium/test_connected_accounts.py
# Settings' Connected accounts: each outside service the app holds a credential for can be cleared
# from this device or revoked at the service, and a revoke that cannot reach the service says so and
# gives the page to finish it by hand.
# Mounted via tests/medium/_harness.py's HEADER_STUB; fixtures come from tests/conftest.py.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

DRIVE = "[data-account='google-drive']"
CONNECTED = "() => localStorage.getItem('librept_drive_connected')"
# Google Identity Services that hands out no token, as when the trainer closes its window or Google
# cannot be reached. Installed before the tap so no real script is fetched.
GOOGLE_WITHOUT_A_TOKEN = """() => {
    window.google = { accounts: { oauth2: {
        initTokenClient: () => ({
            callback: () => {},
            requestAccessToken() { this.callback({ error: 'popup_closed' }); },
        }),
        revoke: () => {},
    } } };
}"""


def _open_accounts(page):
    page.locator("#btn-app-menu").click()
    page.locator("#menu-settings").click()
    page.locator("#menu-connected-accounts").click()
    page.wait_for_selector("#dialog-connected-accounts[open]")


def _connected(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    page.evaluate("() => localStorage.setItem('librept_drive_connected', '1')")
    _open_accounts(page)


def test_a_device_that_never_connected_offers_nothing_to_clear(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")
    _open_accounts(page)

    row = page.locator(DRIVE)
    assert "Google Drive" in row.inner_text()
    assert "Not connected" in row.inner_text()
    assert row.locator("[data-account-action]").count() == 0


def test_clearing_forgets_the_connection_on_this_device_only(page, local_server):
    _connected(page, local_server)

    page.locator(f"{DRIVE} [data-account-action='clear']").click()

    assert page.evaluate(CONNECTED) is None
    row = page.locator(DRIVE)
    assert "Not connected" in row.inner_text()
    assert "Other devices keep their access" in row.inner_text()


def test_a_revoke_that_cannot_reach_google_says_so_and_links_its_page(
    page, local_server
):
    _connected(page, local_server)
    page.evaluate(GOOGLE_WITHOUT_A_TOKEN)

    page.locator(f"{DRIVE} [data-account-action='revoke']").click()

    note = page.locator(f"{DRIVE} [data-account-note]")
    note.wait_for(state="visible")
    assert "could not be reached" in note.inner_text()
    assert (
        note.locator("a").get_attribute("href")
        == "https://myaccount.google.com/linkedapps"
    )
    # Forgotten here in every case: the device must not keep claiming a connection.
    assert page.evaluate(CONNECTED) is None
