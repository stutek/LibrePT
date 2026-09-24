# tests/e2e/test_encrypted_reader_language.py
# The encrypted-file reader (src/modules/common/encryptedFileReader.js) is the one screen a CLIENT
# uses, to open the export their trainer sent. It speaks the chosen language, its markup and the
# messages its code writes alike (TODO §38.20).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from playwright.sync_api import expect

from tests.e2e.test_client_views_language import _expect_slovenian, _slovenian

READER = {
    "#open-encrypted-title": "encrypted_title",
    "label[for='open-encrypted-passphrase']": "encrypted_passphrase_label",
    "#btn-open-encrypted": "encrypted_open",
}


def test_the_encrypted_reader_is_in_slovenian_when_slovenian_is_chosen(
    page, local_server
):
    page.goto(local_server + "?lang=sl")
    page.locator("#btn-app-menu").click()
    page.locator("#menu-open-encrypted").click()
    expect(page.locator("#dialog-open-encrypted")).to_be_visible()

    _expect_slovenian(page, READER)
    # Open with nothing chosen: the message the code writes is in the same language.
    page.locator("#btn-open-encrypted").click()
    [choose_file] = _slovenian(page, ["encrypted_choose_file"])
    expect(page.locator("#open-encrypted-status")).to_have_text(choose_file)
