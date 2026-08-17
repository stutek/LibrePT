# tests/e2e/test_rsvp_ingestion.py
# The trainer tapping the link a client's reply carried (TODO §1.6).
#
# This is the last leg of the loop and the only one that WRITES: the client answered on their own
# phone, the answer came back as a message, and one tap has to land it in the trainer's own store —
# which means real IndexedDB and a real reload, so it belongs here rather than in a component test.
#
# What it must NOT do is equally load-bearing (decided 2026-08-17): the answer lands on the INVITATION.
# `session.participants` is the attendee list and is left alone — an answer is not an act of joining or
# leaving a session, and a "no" must not quietly remove someone the trainer put there.

import base64
import json

import pytest
from playwright.sync_api import expect


def _encoded(event):
    raw = json.dumps(event, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _rsvp(session_id, client_id, answer):
    return _encoded({"v": 1, "k": "rsvp", "s": session_id, "c": client_id, "a": answer})


# Read straight out of IndexedDB rather than through a debug global on `window`. Two reasons: the
# shipped app should not carry a "hand me the whole database" hook for the suite's convenience (the
# same correction made twice already today), and reading the store is what actually proves the answer
# was PERSISTED rather than merely held in memory.
READ_COLLECTION = """
async (collection) => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('librept');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (!db.objectStoreNames.contains('schemaP')) return [];
  const store = db.transaction('schemaP', 'readonly').objectStore('schemaP');
  const rows = await new Promise((resolve) => {
    const request = store.index('byCollection').getAll(collection);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve([]);
  });
  // A stored row IS the record, with a `collection` field added — not a wrapper around one.
  return rows;
}
"""


def _collection(page, name):
    return page.evaluate(READ_COLLECTION, name)


def _seeded_ids(page):
    """A real seeded session and one of its participants, read from the database itself."""
    sessions = _collection(page, "sessions")
    session = next(s for s in sessions if s.get("participants"))
    return {"sessionId": session["id"], "clientId": session["participants"][0]}


def _open_app(page, local_server, query=""):
    page.goto(f"{local_server}{query}")
    page.wait_for_selector("#app-header", timeout=15_000)


def test_the_answer_lands_on_the_invitation_and_survives_a_reload(page, local_server):
    _open_app(page, local_server)
    ids = _seeded_ids(page)

    _open_app(
        page, local_server, f"?evt={_rsvp(ids['sessionId'], ids['clientId'], 'yes')}"
    )

    page.reload()
    page.wait_for_selector("#app-header", timeout=15_000)
    invites = _collection(page, "invites")
    assert len(invites) == 1
    assert invites[0]["clientId"] == ids["clientId"]
    assert invites[0]["answer"] == "yes"
    assert invites[0]["status"] == "answered"


def test_an_answer_never_edits_the_attendee_list(page, local_server):
    """Decided 2026-08-17: sessions host attendees, invitations host the RSVP. A "no" is an answer, not
    a withdrawal — the trainer decides who is in the session, and a client's reply must not silently
    take them out of it."""
    _open_app(page, local_server)
    ids = _seeded_ids(page)
    before = next(
        s for s in _collection(page, "sessions") if s["id"] == ids["sessionId"]
    )["participants"]

    _open_app(
        page, local_server, f"?evt={_rsvp(ids['sessionId'], ids['clientId'], 'no')}"
    )

    after = next(
        s for s in _collection(page, "sessions") if s["id"] == ids["sessionId"]
    )["participants"]
    assert after == before


def test_a_second_answer_replaces_the_first_rather_than_stacking(page, local_server):
    """Clients change their minds, and they answer from a link they still have in their messages."""
    _open_app(page, local_server)
    ids = _seeded_ids(page)

    _open_app(
        page, local_server, f"?evt={_rsvp(ids['sessionId'], ids['clientId'], 'yes')}"
    )
    _open_app(
        page, local_server, f"?evt={_rsvp(ids['sessionId'], ids['clientId'], 'no')}"
    )

    invites = _collection(page, "invites")
    assert len(invites) == 1
    assert invites[0]["answer"] == "no"


def test_the_trainer_is_told_an_answer_arrived(page, local_server):
    """A tap that silently writes a record is a tap the trainer cannot tell worked. It says who
    answered and how — the feed is where they will look."""
    _open_app(page, local_server)
    ids = _seeded_ids(page)

    _open_app(
        page, local_server, f"?evt={_rsvp(ids['sessionId'], ids['clientId'], 'yes')}"
    )

    expect(page.locator("#notification-area")).to_contain_text("RSVP", ignore_case=True)


@pytest.mark.clean_start
def test_an_answer_for_a_session_this_device_has_never_seen_is_still_kept(
    page, local_server
):
    """The trainer may have sent the invite from another phone. The reply is the only thing that came
    back from the client, so it is recorded rather than dropped — with no `sentAt`, because this device
    genuinely never saw it sent."""
    _open_app(
        page,
        local_server,
        f"?evt={_rsvp('unknown-session', 'unknown-client', 'maybe')}",
    )

    invites = _collection(page, "invites")
    assert len(invites) == 1
    assert invites[0]["answer"] == "maybe"
    assert invites[0]["sentAt"] == ""


def test_the_link_is_consumed_so_a_refresh_does_not_replay_it(page, local_server):
    """A `?evt=` left in the address bar would re-apply on every reload and on every link the trainer
    copies out of it — the same reason `?init=demo_data_load` is stripped after boot."""
    _open_app(page, local_server)
    ids = _seeded_ids(page)

    _open_app(
        page, local_server, f"?evt={_rsvp(ids['sessionId'], ids['clientId'], 'yes')}"
    )

    assert "evt=" not in page.url
