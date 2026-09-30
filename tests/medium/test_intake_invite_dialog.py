# tests/medium/test_intake_invite_dialog.py
# Sending the intake link to one particular person.
#
# Which channel a typed contact implies is pinned without a browser in
# tests/unit_js/domain/contactChannel.test.mjs. What needs the DOM is the surface's promises: the
# trainer is told which app is about to open, the send is out of reach until there is somewhere to
# send to, the message is prefilled and addressed, and the way that needs no contact detail at all is
# still there.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from urllib.parse import unquote

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import {
  initIntakeInviteDialog,
  openIntakeInviteDialog,
} from './modules/clients/intakeInviteDialog.js';
""",
    view_id="clients",
    body="""
// The share sheet's answer is the caller's to give, so this tier can drive every outcome without a
// browser that has one.
window.__shareOutcome = 'shared';
window.__shareCalls = 0;

// The trainer's own details are a setting of the install (data/trainerIdentity.js); handed in here
// so this tier does not depend on what happens to be in localStorage.
window.__trainer = { name: 'Sam Trainer', phone: '+386 40 111 222' };

initIntakeInviteDialog({
  t,
  getLang: () => globalThis.stubLanguage || 'en',
  getTrainer: () => window.__trainer,
  onShare: ({ lang }) => { window.__lastShareLang = lang; window.__shareCalls += 1; return Promise.resolve(window.__shareOutcome); },
});
window.__t = t;
window.__open = () => openIntakeInviteDialog();
""",
)

SEND = "#intake-invite-send"


def _open(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.evaluate("() => window.__open()")
    page.wait_for_selector("#dialog-intake-invite[open]")


def test_the_contact_field_is_a_thumb_high(page, local_server):
    """The field for the client's number or address was 19 pixels high: it wore a class no style
    defines, while every other field in the app is an input a thumb can hit."""
    page.set_viewport_size({"width": 390, "height": 844})
    _open(page, local_server)
    box = page.locator("#intake-invite-contact").bounding_box()
    assert box and box["height"] >= 44, box


def test_there_is_nowhere_to_send_until_a_contact_is_typed(page, local_server):
    """A trainer is standing in front of somebody; the control that opens a mail app must not be
    reachable while the address is half typed."""
    _open(page, local_server)

    assert page.get_attribute(SEND, "href") is None, "it must not lead anywhere yet"
    # The button keeps its own name and is disabled; what is missing is said under the field.
    expect(page.locator(SEND)).to_contain_text("Write the message")
    expect(page.locator(SEND)).to_have_attribute("aria-disabled", "true")
    assert (
        page.evaluate(
            "getComputedStyle(document.querySelector('#intake-invite-send')).pointerEvents"
        )
        == "none"
    )
    # Primary action on the right: the secondary comes first.
    assert (
        page.locator("#intake-invite-share").bounding_box()["x"]
        < page.locator(SEND).bounding_box()["x"]
    )
    expect(page.locator("#intake-invite-channel")).to_contain_text(
        "phone number or an email"
    )


def test_a_phone_number_prepares_a_text_message_and_says_so(page, local_server):
    _open(page, local_server)

    page.fill("#intake-invite-contact", "+386 41 234 567")

    # What the trainer READS: which app is about to open, so the share sheet taking over the screen
    # is never a surprise.
    expect(page.locator("#intake-invite-channel")).to_contain_text("messages app")
    href = page.get_attribute(SEND, "href")
    assert href.startswith("sms:+38641234567"), href
    # ...and the invitation travels with it, because a bare URL in a text is indistinguishable from
    # a phishing attempt.
    assert "body=" in href and "intake" in href
    # Signed: a bare URL in a text message is indistinguishable from phishing, and the trainer's
    # number written in it is the closest thing to a contact card a text can carry.
    assert "Sam%20Trainer" in href and "111" in href


def test_an_email_address_prepares_a_mail_instead(page, local_server):
    _open(page, local_server)

    page.fill("#intake-invite-contact", "ana@example.com")

    expect(page.locator("#intake-invite-channel")).to_contain_text("mail app")
    href = page.get_attribute(SEND, "href")
    assert href.startswith("mailto:ana%40example.com"), href
    assert "subject=" in href


def test_correcting_the_contact_re_aims_the_send(page, local_server):
    """Numbers get retyped. The link has to follow the field rather than the first thing typed into
    it, or the invitation goes to whoever was there before."""
    _open(page, local_server)
    page.fill("#intake-invite-contact", "ana@example.com")

    page.fill("#intake-invite-contact", "041 234 567")

    assert page.get_attribute(SEND, "href").startswith("sms:041234567")


def test_the_way_that_needs_no_contact_detail_is_still_offered(page, local_server):
    """The generic share route, and the only one that reaches WhatsApp, Viber or Signal — or a client
    who would rather not give a number at all."""
    _open(page, local_server)

    page.click("#intake-invite-share")

    assert page.evaluate("() => window.__shareCalls") == 1
    expect(page.locator("#intake-invite-share")).to_contain_text("sent")


def test_a_browser_that_refuses_every_route_still_leaves_the_link_on_screen(
    page, local_server
):
    """The one outcome that must be impossible is a trainer standing in front of somebody with
    nothing to give them."""
    _open(page, local_server)
    page.evaluate("() => { window.__shareOutcome = 'unavailable'; }")

    page.click("#intake-invite-share")

    field = page.locator("#intake-invite-link")
    expect(field).to_be_visible()
    assert "/intake" in field.input_value()


def test_the_next_person_starts_from_an_empty_field(page, local_server):
    """Three friends ask on the same evening. A number left in the box is how the second invitation
    goes to the first friend."""
    _open(page, local_server)
    page.fill("#intake-invite-contact", "ana@example.com")
    page.click("#dialog-intake-invite .modal-close-btn")

    page.evaluate("() => window.__open()")

    expect(page.locator("#intake-invite-contact")).to_have_value("")
    assert page.get_attribute(SEND, "href") is None, "and nowhere to send it"


def test_the_code_on_screen_is_the_route_that_needs_no_typing(page, local_server):
    """Asked 2026-09-11: the two people are standing together, so the number and the address are
    things to be spelled out and mistyped. The trainer holds up a code instead and the client's own
    camera opens the page — no channel, no contact detail, and nothing sent anywhere.

    On screen the moment the dialog opens, with nothing to tap first: it is the route that needs no
    typing, and the code carries the trainer rather than any one client, so there is nothing about
    it to reveal."""
    _open(page, local_server)

    code = page.locator("#intake-invite-qr")
    expect(code).to_be_visible()
    expect(page.locator("#intake-invite-qr-hint")).to_contain_text("camera")

    # A drawn symbol, not an empty box: enough squares to be a code, in a picture with its quiet
    # zone around it.
    drawn = page.get_attribute("#intake-invite-qr-path", "d")
    assert drawn.count("z") > 100, drawn[:80]
    assert page.get_attribute("#intake-invite-qr-svg", "viewBox").startswith("-4 -4 ")

    # Big enough to read off a phone held at arm's length.
    box = page.locator("#intake-invite-qr-svg").bounding_box()
    assert box["width"] >= 200, box


def test_the_code_is_redrawn_from_the_trainers_details_each_time(page, local_server):
    """The trainer's own name, number and address are settings they can change between one
    invitation and the next, and the code carries all three. Drawn once and kept would be an
    invitation naming details they have since corrected."""
    _open(page, local_server)
    first = page.get_attribute("#intake-invite-qr-path", "d")

    page.click("#dialog-intake-invite .modal-close-btn")
    page.evaluate(
        "() => { window.__trainer = { name: 'Sam Trainer', phone: '+386 40 999 888' }; }"
    )
    page.evaluate("() => window.__open()")
    page.wait_for_selector("#dialog-intake-invite[open]")

    assert page.get_attribute("#intake-invite-qr-path", "d") != first


def test_the_trainer_chooses_the_language_the_client_reads(page, local_server):
    """A new client has no form language on record, so the dialog asks. In a Slovenian app the
    trainer picks English: the message, the intake link and the privacy link are English, while the
    dialog's own words stay Slovenian."""
    page.add_init_script("globalThis.stubLanguage = 'sl'")
    _open(page, local_server)
    page.fill("#intake-invite-contact", "emily@example.com")

    # Defaults to the app's language: the message is Slovenian until the trainer chooses.
    select = page.locator("#intake-invite-lang")
    assert select.input_value() == "sl"
    assert "intake%3Flang%3Dsl" in page.get_attribute(SEND, "href")
    assert [o.strip() for o in select.locator("option").all_inner_texts()] == [
        "English",
        "Slovenščina",
        "Deutsch",
    ]

    select.select_option("en")

    href = unquote(page.get_attribute(SEND, "href"))
    assert "intake?lang=en" in href and "intake?lang=sl" not in href, href
    assert "privacy-notice-en.html" in href, href
    assert "fill in your own details" in href, href
    assert "Your details for our training" in href, href
    # The trainer's words did not move.
    expect(page.locator("#intake-invite-title")).to_have_text(
        page.evaluate("() => window.__t('intake_invite_title')")
    )
    expect(page.locator("#intake-invite-title")).not_to_have_text("Invite a client")
    box = select.bounding_box()
    assert box and box["height"] >= 44, box


def test_the_chosen_language_also_reaches_the_code_and_the_share_sheet(
    page, local_server
):
    page.add_init_script("globalThis.stubLanguage = 'sl'")
    _open(page, local_server)
    before = page.get_attribute("#intake-invite-qr-path", "d")

    page.select_option("#intake-invite-lang", "de")

    assert page.get_attribute("#intake-invite-qr-path", "d") != before
    page.click("#intake-invite-share")
    assert page.evaluate("() => window.__lastShareLang") == "de"
