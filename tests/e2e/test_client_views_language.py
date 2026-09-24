# tests/e2e/test_client_views_language.py
# The client directory, the client detail view and its two data-subject-request dialogs speak the
# language the trainer chose (TODO §38.20; src/modules/clients/clientsView.js and
# clientDataRights.js). E2E because the words reach the markup through the app's own translation
# pass (i18n/domMappings.js), which a mounted view does not run.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from playwright.sync_api import expect

WORDS = """async (keys) => {
    const { TRANSLATIONS } = await import(new URL('i18n/index.js', document.baseURI).href);
    return keys.map((key) => [TRANSLATIONS.sl[key], TRANSLATIONS.en[key]]);
}"""

# Each control, and the key whose words it must show.
DIRECTORY = {
    "#view-client-directory h2": "clients_title",
    "#btn-add-client span": "btn_add_client",
}

DETAIL = {
    "#btn-back-to-clients span": "btn_back",
    "#btn-edit-client span": "btn_edit_profile",
    "#view-client-detail .info-block label >> nth=0": "goals",
    "#btn-client-export span": "profile_export_data",
    "#btn-client-erase span": "profile_erase_client",
    "#view-client-detail .section-title h3": "client_history_header",
}

ERASE_DIALOG = {
    "#client-erase-title": "rights_erase_title",
    "#btn-erase-confirm": "rights_erase_confirm",
    "#dialog-client-erase .modal-cancel": "btn_cancel",
    "label[for='client-erase-requested']": "rights_erase_requested",
}


def _slovenian(page, keys):
    """The Slovenian words for `keys`, each checked to differ from the English, so a control that
    stayed English cannot pass by accident."""
    words = page.evaluate(WORDS, keys)
    for key, (slovenian, english) in zip(keys, words):
        assert slovenian and slovenian != english, key
    return [slovenian for slovenian, _english in words]


def _expect_slovenian(page, controls):
    for selector, words in zip(controls, _slovenian(page, list(controls.values()))):
        expect(page.locator(selector)).to_have_text(words)


def _open_first_client(page, local_server):
    page.goto(local_server + "clients?init=demo_data_load&lang=sl")
    page.locator("#clients-list .client-card").first.click()
    expect(page.locator("#view-client-detail")).to_be_visible()


def test_the_client_directory_is_in_slovenian_when_slovenian_is_chosen(
    page, local_server
):
    page.goto(local_server + "clients?init=demo_data_load&lang=sl")
    expect(page.locator("#view-client-directory")).to_be_visible()

    _expect_slovenian(page, DIRECTORY)
    [search] = _slovenian(page, ["placeholder_search_clients"])
    expect(page.locator("#search-clients")).to_have_attribute("placeholder", search)


def test_the_client_detail_view_is_in_slovenian_when_slovenian_is_chosen(
    page, local_server
):
    _open_first_client(page, local_server)

    _expect_slovenian(page, DETAIL)


def test_the_erase_dialog_is_in_slovenian_when_slovenian_is_chosen(page, local_server):
    _open_first_client(page, local_server)
    page.locator("#btn-client-erase").click()
    expect(page.locator("#dialog-client-erase")).to_be_visible()

    _expect_slovenian(page, ERASE_DIALOG)
