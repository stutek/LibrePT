# tests/e2e/test_intake.py
# A prospective client opening /intake on their own phone (TODO §1.7/§26).
#
# What only this tier can prove is the BOOT DECISION. tests/medium/test_intake_form.py mounts
# `bootIntake` directly and covers the form's behaviour; nothing there can tell you that a real
# navigation to /intake takes that path instead of the trainer's — which is the whole promise. So
# these tests navigate for real and assert what the client's device is left holding: no database, no
# splash hold, no first-run agreement, and no trainer chrome.
#
# `clean_start` on every test, deliberately: the demo-data seed injection would be a lie here. This
# page is opened by someone who has never seen the app.

import json

import pytest
from playwright.sync_api import expect

# The app's own storage keys all start with this. `librept_terms_accepted` is written by conftest's
# autouse fixture rather than by the app, so it is excluded by name.
APP_KEY_PREFIX = "librept"
HARNESS_KEY = "librept_terms_accepted"


def _app_written_keys(page):
    keys = page.evaluate("() => Object.keys(localStorage)")
    return [
        key for key in keys if key.startswith(APP_KEY_PREFIX) and key != HARNESS_KEY
    ]


@pytest.mark.clean_start
def test_a_client_gets_the_form_and_not_the_trainers_app(page, local_server):
    """The one thing the medium tier cannot check: /intake runs its own boot. No splash to wait out, no
    terms modal to accept, and none of the trainer's chrome — a stranger asked to introduce themselves
    should not first be shown someone else's dashboard."""
    page.goto(f"{local_server}intake")

    expect(page.locator("#view-intake")).to_be_visible(timeout=15_000)
    expect(page.locator("#app-splash")).to_be_hidden()
    expect(page.locator("#dialog-terms")).to_have_count(0)
    # The header and the notification footer render their own markup during the trainer's boot; on
    # this path nothing calls them, so their canvases stay empty.
    assert (
        page.evaluate("() => document.getElementById('app-header').children.length")
        == 0
    )
    expect(page.locator("#view-client-directory")).to_have_count(0)


@pytest.mark.clean_start
def test_filling_it_in_leaves_nothing_on_the_clients_device(page, local_server):
    """§26.1's stateless promise, through a real navigation and a real IndexedDB. A prospective client
    who fills this in and walks away — or decides not to send it — leaves no trace of themselves on
    their own phone."""
    page.goto(f"{local_server}intake")
    expect(page.locator("#view-intake")).to_be_visible(timeout=15_000)

    page.fill("#intake-name", "Jana Novak")
    page.fill("#intake-email", "jana@example.com")
    page.fill("#intake-injury", "knee reconstruction 2024")
    page.check("#intake-consent")

    assert _app_written_keys(page) == []
    assert (
        page.evaluate("async () => (await indexedDB.databases()).map((d) => d.name)")
        == []
    )


@pytest.mark.clean_start
def test_the_saved_file_is_what_the_trainer_will_open(page, local_server):
    """The real download, through the real browser: this is the artifact that lands in an inbox, so it
    is worth reading its actual bytes once rather than only the fake platform's copy of them."""
    page.goto(f"{local_server}intake")
    expect(page.locator("#view-intake")).to_be_visible(timeout=15_000)

    page.fill("#intake-name", "Jana Novak")
    page.fill("#intake-phone", "041 234 567")
    page.fill("#intake-goals", "back to squatting after the knee")
    page.check("#intake-consent")

    with page.expect_download() as download_info:
        page.click("#intake-save")
    download = download_info.value

    assert download.suggested_filename.endswith(".librept-signup.json")
    with open(download.path(), encoding="utf-8") as handle:
        payload = json.load(handle)
    assert payload["name"] == "Jana Novak"
    assert payload["goals"] == "back to squatting after the knee"
    assert payload["gdprConsent"]["cloudSync"] is True
    # The wording version and language the client actually read — the Art. 7(1) evidence that a
    # trainer-typed date cannot provide.
    assert payload["gdprConsent"]["formVersion"]
    assert payload["gdprConsent"]["formLang"] == "en"


@pytest.mark.clean_start
def test_a_trainers_qr_can_hand_over_the_language(page, local_server):
    """A leaflet or a wall code names it (`?lang=sl`), because the client should not have to find a
    switch before they can read the consent wording they are being asked to agree to."""
    page.goto(f"{local_server}intake?lang=sl")

    expect(page.locator("#intake-title")).to_contain_text(
        "Predstavi se", timeout=15_000
    )
    assert page.evaluate("() => document.documentElement.lang") == "sl"


@pytest.mark.clean_start
@pytest.mark.keep_splash
def test_the_intake_visit_does_not_consume_the_trainers_first_run(page, local_server):
    """Leaving intake and opening the app proper must behave like any first visit. The splash's hold is
    a once-per-tab-session moment (`librept_splash_held`), so an intake page that ran any of the
    trainer's boot would silently spend it — and the trainer would wonder why their first launch looked
    half-finished.

    `keep_splash` because conftest otherwise dismisses the splash after every navigation, which would
    make this assertion vacuous."""
    page.goto(f"{local_server}intake")
    expect(page.locator("#view-intake")).to_be_visible(timeout=15_000)
    assert page.evaluate("() => Object.keys(sessionStorage)") == []

    page.goto(local_server)

    # The splash is up and the app boots normally: proof the intake visit left no "already held"
    # marker and nothing else behind it.
    expect(page.locator("#app-splash")).to_be_visible(timeout=15_000)
