# tests/e2e/test_data_rights_language.py
# The two data-subject-request dialogs (src/modules/clients/clientDataRights.js) speak the language
# the trainer chose (TODO §38.20). E2E because the words reach the markup through the app's own
# translation pass (i18n/domMappings.js), which a mounted dialog does not run.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from playwright.sync_api import expect

WORDS = """async (keys) => {
    const { TRANSLATIONS } = await import(new URL('i18n/index.js', document.baseURI).href);
    return keys.map((key) => [TRANSLATIONS.sl[key], TRANSLATIONS.en[key]]);
}"""

# Each control, and the key whose words it must show.
ERASE_DIALOG = {
    "#client-erase-title": "rights_erase_title",
    "#btn-erase-confirm": "rights_erase_confirm",
    "#dialog-client-erase .modal-cancel": "btn_cancel",
    "label[for='client-erase-requested']": "rights_erase_requested",
}


def test_the_erase_dialog_is_in_slovenian_when_slovenian_is_chosen(page, local_server):
    page.goto(local_server + "clients?init=demo_data_load&lang=sl")
    page.locator("#clients-list .client-card").first.click()
    page.locator("#btn-client-erase").click()
    expect(page.locator("#dialog-client-erase")).to_be_visible()

    words = page.evaluate(WORDS, list(ERASE_DIALOG.values()))
    for (selector, key), (slovenian, english) in zip(ERASE_DIALOG.items(), words):
        assert slovenian and slovenian != english, key
        expect(page.locator(selector)).to_have_text(slovenian)
