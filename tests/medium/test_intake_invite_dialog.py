# tests/medium/test_intake_invite_dialog.py
# Sending the intake link to one particular person (TODO §26.3 step 2).
#
# Which channel a typed contact implies is pinned without a browser in
# tests/unit_js/domain/contactChannel.test.mjs. What needs the DOM is the surface's promises: the
# trainer is told which app is about to open, the send is out of reach until there is somewhere to
# send to, the message is prefilled and addressed, and the way that needs no contact detail at all is
# still there.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

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

initIntakeInviteDialog({
  t,
  getLang: () => 'en',
  onShare: () => { window.__shareCalls += 1; return Promise.resolve(window.__shareOutcome); },
});
window.__open = () => openIntakeInviteDialog();
""",
)

SEND = "#intake-invite-send"


def _open(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.evaluate("() => window.__open()")
    page.wait_for_selector("#dialog-intake-invite[open]")


def test_there_is_nowhere_to_send_until_a_contact_is_typed(page, local_server):
    """A trainer is standing in front of somebody; the control that opens a mail app must not be
    reachable while the address is half typed."""
    _open(page, local_server)

    assert page.get_attribute(SEND, "href") is None, "it must not lead anywhere yet"
    expect(page.locator(SEND)).to_contain_text("Nowhere to send it yet")
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
    """§26.3's first step, and the only route that reaches WhatsApp, Viber or Signal — or a client
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
