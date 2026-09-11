# tests/medium/test_trainer_details.py
# The trainer's own details (TODO §45.2): the ☰ menu opens a form over the three values
# data/trainerIdentity.js stores, what is typed comes back, and an email that is not one is refused
# at the field rather than silently dropped.
#
# Medium tier because the promise is the form itself — markup, the menu item that opens it, and the
# write it performs. Nothing here needs the router, a database or a real boot.
# Mounted via tests/medium/_harness.py's HEADER_STUB; fixtures come from tests/conftest.py.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start


def _stored_identity(page):
    """What the app would read back, asked of the module itself rather than of localStorage keys —
    the storage key names are that module's private business, and a test spelling them again would
    pass while the app read nothing."""
    return page.evaluate(
        """async () => {
            const identity = await import(
                new URL('data/trainerIdentity.js', document.baseURI).href
            );
            const { name, email, phone } = identity.readTrainerIdentity();
            return { name, email, phone };
        }"""
    )


def _open_details(page):
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#menu-trainer-details").click()
    page.wait_for_selector("#dialog-trainer-details[open]")


def _fill(page, name, phone, email):
    page.locator("#trainer-details-name").fill(name)
    page.locator("#trainer-details-phone").fill(phone)
    page.locator("#trainer-details-email").fill(email)


def test_menu_opens_the_form(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)

    # The label asks for both names. "Your name" was what the first trainer to use the app read as
    # a request for one (TODO §45.3), and the same wording is used here.
    assert (
        page.locator("#trainer-details-name-label").inner_text()
        == "First and last name"
    )
    assert page.locator("#trainer-details-name").input_value() == ""


def test_saving_stores_all_three_and_they_come_back(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)
    _fill(page, "Ana Kovač", "+386 40 123 456", "ana@example.com")
    page.locator("#trainer-details-save").click()
    page.wait_for_selector("#dialog-trainer-details", state="hidden")

    assert _stored_identity(page) == {
        "name": "Ana Kovač",
        "phone": "+386 40 123 456",
        "email": "ana@example.com",
    }

    # Reopening shows what was saved: a form that forgets is one a trainer cannot check.
    _open_details(page)
    assert page.locator("#trainer-details-name").input_value() == "Ana Kovač"
    assert page.locator("#trainer-details-phone").input_value() == "+386 40 123 456"
    assert page.locator("#trainer-details-email").input_value() == "ana@example.com"


def test_an_address_that_is_not_one_is_refused_and_nothing_is_written(
    page, local_server
):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)
    _fill(page, "Ana Kovač", "", "ana.example.com")
    page.locator("#trainer-details-save").click()

    # Still open, with the reason under the field — the whole point of refusing rather than storing
    # it: a trainer who was told nothing would believe replies were reaching them.
    assert page.locator("#dialog-trainer-details").get_attribute("open") is not None
    assert page.locator("#trainer-details-email-error").is_visible()
    assert _stored_identity(page) == {"name": "", "phone": "", "email": ""}


def test_an_empty_address_is_allowed(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    _open_details(page)
    _fill(page, "Ana Kovač", "+386 40 123 456", "")
    page.locator("#trainer-details-save").click()
    page.wait_for_selector("#dialog-trainer-details", state="hidden")

    # Not every trainer wants to be answered by mail, so blank is a choice rather than an omission.
    assert _stored_identity(page)["email"] == ""
    assert _stored_identity(page)["name"] == "Ana Kovač"
