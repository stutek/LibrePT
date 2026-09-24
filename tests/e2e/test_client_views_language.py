# tests/e2e/test_client_views_language.py
# The client directory, the client detail view and its two data-subject-request dialogs speak the
# language the trainer chose (TODO §38.20; src/modules/clients/clientsView.js and
# clientDataRights.js). E2E because the words reach the markup through the app's own translation
# pass (i18n/domMappings.js), which a mounted view does not run.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import re

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
    # Set by code, and which one depends on the client: the badge's words up to its brackets, and
    # the consent button's words with or without an email on file.
    badges = _slovenian(
        page, ["consent_badge_withdrawn", "consent_badge_none", "consent_badge_given"]
    )
    badge = page.locator("#profile-gdpr-status").inner_text().strip()
    assert any(badge.startswith(words.split("(")[0]) for words in badges), badge
    button = page.locator("#btn-send-consent-email-text").inner_text()
    assert button in _slovenian(page, ["profile_send_consent", "consent_no_email"])


def test_the_view_grabbers_are_labelled_in_slovenian(page, local_server):
    """What a screen reader says for the bar at the top of a view (TODO §38.20)."""
    page.goto(local_server + "history?lang=sl")
    expect(page.locator("#view-history")).to_be_visible()
    home, clipboard = _slovenian(page, ["view_grabber_home", "view_grabber_clipboard"])
    expect(page.locator("#view-history .view-grabber")).to_have_attribute(
        "aria-label", home
    )

    # The sessions list: its section still carries the older id `view-clients`.
    page.goto(local_server + "?lang=sl")
    expect(page.locator(".session-card").first).to_be_visible()
    expect(page.locator("#view-clients .view-grabber")).to_have_attribute(
        "aria-label", clipboard
    )


def test_the_header_buttons_are_labelled_in_slovenian(page, local_server):
    """The version and Sync & Backup buttons are icons; the label is all a screen reader has
    (TODO §38.20). The menu and language labels stay bilingual on purpose."""
    page.goto(local_server + "clients?lang=sl")
    expect(page.locator("#view-client-directory")).to_be_visible()
    version, backup = _slovenian(page, ["app_version_button_label", "backup_center"])

    expect(page.locator("#app-version")).to_have_attribute("aria-label", version)
    # Written by code with the sync state after it: "<base> — <state>".
    expect(page.locator("#backup-btn")).to_have_attribute(
        "aria-label", re.compile("^" + re.escape(backup) + " — ")
    )


def test_the_signup_review_is_titled_in_slovenian(page, local_server):
    """The dialog a trainer reviews a client's own details in had an English title (TODO §38.20).
    Its markup exists from boot, so the title is read without a signup to open it with."""
    page.goto(local_server + "clients?lang=sl")
    expect(page.locator("#view-client-directory")).to_be_visible()

    [title] = _slovenian(page, ["signup_review_title"])
    expect(page.locator("#signup-review-title")).to_have_text(title)


def test_the_erase_dialog_is_in_slovenian_when_slovenian_is_chosen(page, local_server):
    _open_first_client(page, local_server)
    page.locator("#btn-client-erase").click()
    expect(page.locator("#dialog-client-erase")).to_be_visible()

    _expect_slovenian(page, ERASE_DIALOG)
