# tests/medium/test_session_invite_organizer.py — the invite dialog's organizer field.
#
# Mounts ONE component (bootSessionInviteDialog). The subject is the address an invite is sent FROM:
# whether the dialog remembers it, and whether it says what is lost without one. What the .ics does
# with it is pinned in tests/unit_js/data/calendarInvite.test.mjs, where no browser is needed.

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
