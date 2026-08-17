# tests/e2e/test_session_change_resend.py
# Being asked to tell the clients when a session moves (TODO §1.6).
#
# Asked for 2026-08-17 (Simon): "when a session gets changed, PT should be asked if they want to resend
# invitations". WHICH changes count is pinned without a browser
# (tests/unit_js/domain/sessionChangeNotice.test.mjs). What needs the whole app is the wiring: that a real
# edit, saved through the real form, reaches the prompt — and that the prompt never sends anything by
# itself, because a trainer who says no has decided to tell the client another way.
#
# The prompt is a `confirm()`, answered here through a dialog handler.

import pytest
from playwright.sync_api import expect

INVITED_SESSION = """
async ([sessionId, clientId]) => {
  const invite = { id: 'i-resend', sessionId, clientId, channel: 'email',
                   sentAt: '2026-08-17T09:00:00.000Z', status: 'sent', collection: 'invites' };
  const db = await new Promise((resolve) => {
    const request = indexedDB.open('librept');
    request.onsuccess = () => resolve(request.result);
  });
  await new Promise((resolve) => {
    const tx = db.transaction(['schemaP', 'schema4'], 'readwrite');
    tx.objectStore('schemaP').put(invite);
    tx.oncomplete = resolve;
  });
}
"""


def _a_scheduled_session(page):
    """A seeded session with participants, read from the database the app just wrote."""
    return page.evaluate(
        """async () => {
          const db = await new Promise((resolve) => {
            const request = indexedDB.open('librept');
            request.onsuccess = () => resolve(request.result);
          });
          const rows = await new Promise((resolve) => {
            const request = db
              .transaction('schemaP', 'readonly')
              .objectStore('schemaP')
              .index('byCollection')
              .getAll('sessions');
            request.onsuccess = () => resolve(request.result);
          });
          const session = rows.find((row) => (row.participants || []).length > 0 && !row.completed);
          return session ? { id: session.id, clientId: session.participants[0] } : null;
        }"""
    )


def _answer_prompts(page, accept=False):
    """Record every confirm() the app raises, answering them all the same way."""
    seen = []

    def handle(dialog):
        seen.append(dialog.message)
        dialog.accept() if accept else dialog.dismiss()

    page.on("dialog", handle)
    return seen


def _edit_the_time(page, local_server, session):
    page.goto(f"{local_server}session/setup/{session['id']}")
    page.wait_for_selector("#view-workout-setup.active", timeout=15_000)
    # A different slot — the change a client would actually act on.
    page.fill("#setup-start-time", "07:15")
    page.fill("#setup-end-time", "08:15")
    page.locator("#view-workout-setup button[type=submit]").click()


def test_moving_a_session_asks_whether_the_invited_clients_should_be_told(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector("#app-header", timeout=15_000)
    session = _a_scheduled_session(page)
    assert session, (
        "the seeded data should include a scheduled session with participants"
    )
    page.evaluate(INVITED_SESSION, [session["id"], session["clientId"]])

    prompts = _answer_prompts(page)
    _edit_the_time(page, local_server, session)
    page.wait_for_timeout(1_500)

    resend = [message for message in prompts if "invited" in message.lower()]
    assert resend, f"no resend prompt was raised; prompts seen: {prompts}"
    # It names WHAT moved: a trainer deciding whether six people need a message should not have to
    # reopen the form to find out which detail changed.
    assert "time" in resend[0].lower()


def test_saying_no_sends_nothing_and_leaves_no_dialog_behind(page, local_server):
    """Dismissing is the trainer saying "I will tell them myself" — it must not open the invite dialog,
    and it must not leave the app blocked behind one."""
    page.goto(local_server)
    page.wait_for_selector("#app-header", timeout=15_000)
    session = _a_scheduled_session(page)
    page.evaluate(INVITED_SESSION, [session["id"], session["clientId"]])

    _answer_prompts(page, accept=False)
    _edit_the_time(page, local_server, session)
    page.wait_for_timeout(1_500)

    expect(page.locator("#dialog-session-invite")).to_have_count(0)


@pytest.mark.clean_start
def test_a_session_nobody_was_invited_to_never_raises_the_prompt(page, local_server):
    """Most sessions are like this — the trainer added attendees by hand and sent nothing. Asking about
    invitations that do not exist is how a prompt teaches people to dismiss it."""
    page.goto(f"{local_server}session/new")
    page.wait_for_selector("#view-workout-setup.active", timeout=15_000)
    prompts = _answer_prompts(page)

    page.fill("#setup-session-name", "No invites here")
    page.fill("#setup-session-date", "2026-09-15")
    page.fill("#setup-start-time", "18:00")
    page.fill("#setup-end-time", "19:00")
    page.locator("#view-workout-setup button[type=submit]").click()
    page.wait_for_timeout(1_000)

    assert [message for message in prompts if "invited" in message.lower()] == []
