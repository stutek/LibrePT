# tests/medium/test_session_invite_organizer.py — the invite dialog's organizer field.
#
# Mounts ONE component (bootSessionInviteDialog). The subject is the address an invite is sent FROM:
# whether the dialog remembers it, and whether it says what is lost without one. What the .ics does
# with it is pinned in tests/unit_js/data/calendarInvite.test.mjs, where no browser is needed.

import base64
import json
import urllib.parse

from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

INVITE_STUB = view_stub(
    imports="""
import { bootSessionInviteDialog } from './appBoot.js';
import { openSessionInviteDialog } from './modules/session/sessionInviteDialog.js';
""",
    view_id="clients",
    body="""
const state = {
  lang: 'en',
  clients: [{ id: 'c1', name: 'Jane Doe', email: 'jane@librept.test' }],
  sessions: [], routines: [], exercises: [], history: [], planUpdates: [],
};

bootSessionInviteDialog({ getState: () => state, t });

window.__openInvite = () => openSessionInviteDialog({
  sessionId: 's1',
  sessionName: 'Hypertrophy Upper',
  location: 'Studio A',
  dateLabel: '2026-09-15',
  timeLabel: '14:00 - 15:30',
  startDate: new Date('2026-09-15T14:00:00'),
  endDate: new Date('2026-09-15T15:30:00'),
  clientIds: ['c1'],
});
window.__openInvite();
""",
)


def test_the_dialog_asks_where_replies_should_go(page, local_server):
    """An .ics with no ORGANIZER is one no calendar client will reply to — so the dialog has to say
    that, rather than quietly sending an invitation with no return address."""
    load_with_stub(page, local_server, INVITE_STUB)

    expect(page.locator("#session-invite-organizer")).to_be_visible()
    expect(page.locator("#session-invite-organizer-hint")).to_contain_text(
        "nowhere to send"
    )


def test_a_typed_address_changes_what_the_dialog_promises(page, local_server):
    load_with_stub(page, local_server, INVITE_STUB)

    page.fill("#session-invite-organizer", "pt@librept.test")

    expect(page.locator("#session-invite-organizer-hint")).to_contain_text(
        "email replies"
    )


def test_the_address_is_remembered_for_the_next_invite(page, local_server):
    """Trainers send invites constantly and their own address never changes; asking twice for it
    would be the kind of friction this app exists to remove."""
    load_with_stub(page, local_server, INVITE_STUB)

    page.fill("#session-invite-organizer", "pt@librept.test")
    page.click("#dialog-session-invite .session-invite-send-btn")
    page.click("#dialog-session-invite .modal-cancel")
    page.evaluate("() => window.__openInvite()")

    expect(page.locator("#session-invite-organizer")).to_have_value("pt@librept.test")


def test_a_half_typed_address_is_not_remembered(page, local_server):
    """`readTrainerIdentity` promises that whatever it returns is an address."""
    load_with_stub(page, local_server, INVITE_STUB)

    page.fill("#session-invite-organizer", "pt@")
    page.click("#dialog-session-invite .session-invite-send-btn")

    assert page.evaluate("() => localStorage.getItem('librept_trainer_email')") is None


# --- The confirm link (TODO §1.6). An invite that cannot be answered is the state this closes: the
# .ics gets an acceptance only from a calendar client that speaks iMIP, which is not what a gym client
# has. So the invite also carries a link to LibrePT's own reply page. SMS was ruled in on 2026-08-17,
# and it only works if the trainer's phone rides in the payload — hence the phone field here. ---

INVITE_WITH_PHONE_STUB = INVITE_STUB.replace(
    "clients: [{ id: 'c1', name: 'Jane Doe', email: 'jane@librept.test' }],",
    "clients: [{ id: 'c1', name: 'Jane Doe', email: 'jane@librept.test', phone: '041 777 111' }],",
)


def test_the_invite_email_carries_a_link_the_client_can_answer(page, local_server):
    """A gym client answers a link, not an iMIP acceptance. The mailto body therefore contains the app's
    own reply page, carrying the invite payload."""
    load_with_stub(page, local_server, INVITE_WITH_PHONE_STUB)
    page.fill("#session-invite-organizer", "pt@librept.test")
    page.dispatch_event("#session-invite-organizer", "input")

    href = page.locator(".session-invite-send-btn").first.get_attribute("href")

    assert href.startswith("mailto:")
    assert "evt%3D" in href or "evt=" in href, (
        "the reply link is missing from the invite body"
    )


def _payload_in(href):
    """The event carried by a reply link, decoded from the link itself.

    Read out of the href rather than from a hook in the app: this is the string that actually reaches
    the client, and a test-only global in shipped code is exactly what was removed from the signup
    review dialog for the same reason.
    """
    unquoted = urllib.parse.unquote(href)
    encoded = unquoted.split("evt=")[1].split("&")[0].strip()
    padded = encoded + "=" * (-len(encoded) % 4)
    return json.loads(base64.urlsafe_b64decode(padded))


def test_the_reply_link_carries_the_trainers_phone_so_a_text_is_possible(
    page, local_server
):
    """The client's device knows nothing about the trainer except what the invite told it — so without
    this field the reply page can only ever offer email, whatever the client would rather use."""
    load_with_stub(page, local_server, INVITE_WITH_PHONE_STUB)
    page.fill("#session-invite-organizer", "pt@librept.test")
    page.fill("#session-invite-phone", "+386 41 234 567")
    page.dispatch_event("#session-invite-phone", "input")

    payload = _payload_in(
        page.locator(".session-invite-send-btn").first.get_attribute("href")
    )

    # Short keys are the wire format (sessionEventPayload.js): `p` is organizerPhone, `o` the email.
    assert payload["p"] == "+386 41 234 567"
    assert payload["o"] == "pt@librept.test"


def test_a_client_with_a_number_can_be_invited_by_text(page, local_server):
    """Clients answer texts (ruled 2026-08-17), and an SMS cannot carry the .ics — so the text channel
    carries the reply link and email keeps the calendar file. Both, never one instead of the other."""
    load_with_stub(page, local_server, INVITE_WITH_PHONE_STUB)
    page.fill("#session-invite-organizer", "pt@librept.test")

    sms = page.locator(".session-invite-sms-btn").first
    expect(sms).to_be_visible()
    href = sms.get_attribute("href")
    assert href.startswith("sms:")
    assert "evt%3D" in href or "evt=" in href


def test_a_client_with_no_number_is_not_offered_a_text(page, local_server):
    """Most client records have an email and no phone. A dead SMS button on every one of those rows
    would be noise in the surface a trainer uses while a client waits."""
    load_with_stub(page, local_server, INVITE_STUB)

    expect(page.locator(".session-invite-sms-btn")).to_have_count(0)


def test_the_trainers_phone_is_remembered_between_sessions(page, local_server):
    """Typed once, not once per session — the same reason the organizer email is remembered."""
    load_with_stub(page, local_server, INVITE_WITH_PHONE_STUB)
    page.fill("#session-invite-phone", "+386 41 234 567")

    page.locator(".session-invite-send-btn").first.click()

    assert (
        page.evaluate("() => localStorage.getItem('librept_trainer_phone')")
        == "+386 41 234 567"
    )
