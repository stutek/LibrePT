# tests/medium/test_trainer_details.py
# The trainer's own details: the ☰ menu opens a form over the four values data/trainerIdentity.js
# stores (first name, last name, phone, email), what is typed comes back, and every field is
# required there as on the welcome screen — what is wrong is said at the field and nothing is written.
#
# Medium tier because the promise is the form itself — markup, the menu item that opens it, and the
# write it performs. Nothing here needs the router, a database or a real boot.
# Mounted via tests/medium/_harness.py's HEADER_STUB; fixtures come from tests/conftest.py.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

EMPTY = {"firstName": "", "lastName": "", "phone": "", "email": ""}


def _stored_identity(page):
    """What the app would read back, asked of the module itself rather than of localStorage keys —
    the storage key names are that module's private business, and a test spelling them again would
    pass while the app read nothing."""
    return page.evaluate(
        """async () => {
            const identity = await import(
                new URL('data/trainerIdentity.js', document.baseURI).href
            );
            const { firstName, lastName, phone, email } = identity.readTrainerIdentity();
            return { firstName, lastName, phone, email };
        }"""
    )


def _open_details(page):
    # From Settings, which stay open behind the form and are where a save returns to.
    if not page.locator("#dialog-settings[open]").count():
        page.locator("#btn-app-menu").click()
        page.wait_for_selector("#app-menu:not(.hidden)")
        page.locator("#menu-settings").click()
    page.locator("#menu-trainer-details").click()
    page.wait_for_selector("#dialog-trainer-details[open]")


def _fill(page, first, last, phone, email):
    page.locator("#trainer-details-firstName").fill(first)
    page.locator("#trainer-details-lastName").fill(last)
    page.locator("#trainer-details-phone").fill(phone)
    page.locator("#trainer-details-email").fill(email)


def test_menu_opens_the_form_with_a_field_for_each_name(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)

    # One field per name. A single "name" field was read by the first trainer to use the app as a
    # request for one name only.
    assert page.locator("#trainer-details-firstName-label").inner_text() == "First name"
    assert page.locator("#trainer-details-lastName-label").inner_text() == "Last name"
    assert page.locator("#trainer-details-firstName").input_value() == ""


def test_saving_stores_all_four_and_they_come_back(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)
    _fill(page, "Ana", "Kovač", "+386 40 123 456", "ana@example.com")
    page.locator("#trainer-details-save").click()
    page.wait_for_selector("#dialog-trainer-details", state="hidden")

    assert _stored_identity(page) == {
        "firstName": "Ana",
        "lastName": "Kovač",
        "phone": "+386 40 123 456",
        "email": "ana@example.com",
    }

    # Reopening shows what was saved: a form that forgets is one a trainer cannot check.
    _open_details(page)
    assert page.locator("#trainer-details-firstName").input_value() == "Ana"
    assert page.locator("#trainer-details-lastName").input_value() == "Kovač"
    assert page.locator("#trainer-details-phone").input_value() == "+386 40 123 456"
    assert page.locator("#trainer-details-email").input_value() == "ana@example.com"


def test_an_address_that_is_not_one_is_refused_and_nothing_is_written(
    page, local_server
):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)
    _fill(page, "Ana", "Kovač", "+386 40 123 456", "ana.example.com")
    page.locator("#trainer-details-save").click()

    # Still open, with the reason under the field — the whole point of refusing rather than storing
    # it: a trainer who was told nothing would believe replies were reaching them.
    assert page.locator("#dialog-trainer-details").get_attribute("open") is not None
    assert page.locator("#trainer-details-email-error").is_visible()
    assert _stored_identity(page) == EMPTY


def test_a_blank_field_is_refused_in_the_menu_too(page, local_server):
    """The menu's form holds the welcome screen's rule: a save here that blanked a field would undo
    what the first launch required."""
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)
    _fill(page, "Ana", "Kovač", "+386 40 123 456", "")
    page.locator("#trainer-details-save").click()

    assert page.locator("#dialog-trainer-details").get_attribute("open") is not None
    assert page.locator("#trainer-details-email-error").is_visible()
    assert _stored_identity(page) == EMPTY
