# tests/e2e/test_rsvp_link.py
# Opening an invite link as the client who received it (TODO §1.6's confirm link).
#
# The page's behaviour is covered in tests/medium/test_rsvp_page.py. What only this tier can show is the
# BOOT DECISION, and here it turns on the payload rather than on a path: an invite link is the app's own
# root with `?evt=`, so the app has to decode the event and work out who is holding the phone. An
# INVITE means the client is answering; an RSVP means the trainer is collecting an answer.
#
# That is also why there is no `/rsvp` route — the link already existed (eventTransports.buildEventLink
# puts `?evt=` on the app URL), and inventing a second shape would have broken links already sent.

import base64
import json

import pytest
from playwright.sync_api import expect


def _encoded(event):
    """The wire form sessionEventPayload.js produces — url-safe base64 of the short-keyed JSON."""
    raw = json.dumps(event, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


INVITE = _encoded(
    {
        "v": 1,
        "k": "invite",
        "s": "s1",
        "c": "c1",
        "t": "Group Strength",
        "w": 1789200000000,
        "d": 60,
        "l": "Studio 2",
        "o": "pt@example.com",
        "n": "Sam Ray",
        "p": "+386 41 234 567",
    }
)


@pytest.mark.clean_start
def test_a_client_opening_an_invite_link_gets_the_answer_page(page, local_server):
    """Not the trainer's dashboard. The person holding this link was sent it — they have no account, no
    data, and no reason to be shown someone else's clients."""
    page.goto(f"{local_server}?evt={INVITE}")

    expect(page.locator("#view-rsvp")).to_be_visible(timeout=15_000)
    expect(page.locator("#rsvp-title")).to_contain_text("Group Strength")
    expect(page.locator("#view-client-directory")).to_have_count(0)
    assert (
        page.evaluate("() => document.getElementById('app-header').children.length")
        == 0
    )


@pytest.mark.clean_start
def test_answering_leaves_nothing_on_the_clients_phone(page, local_server):
    """Same promise as /intake: answering an invite is not a reason to put a database on a phone that is
    not the trainer's."""
    page.goto(f"{local_server}?evt={INVITE}")
    expect(page.locator("#view-rsvp")).to_be_visible(timeout=15_000)

    page.click("#rsvp-yes")

    keys = page.evaluate("() => Object.keys(localStorage)")
    assert [key for key in keys if key != "librept_terms_accepted"] == []
    assert (
        page.evaluate("async () => (await indexedDB.databases()).map((d) => d.name)")
        == []
    )


@pytest.mark.clean_start
def test_both_reply_channels_are_offered_on_a_real_invite(page, local_server):
    """SMS was ruled in on 2026-08-17, and it only works because the invite carries the trainer's phone —
    so this is the test that fails if that field ever stops travelling."""
    page.goto(f"{local_server}?evt={INVITE}")
    expect(page.locator("#view-rsvp")).to_be_visible(timeout=15_000)

    page.click("#rsvp-yes")

    expect(page.locator("#rsvp-send-sms")).to_be_visible()
    expect(page.locator("#rsvp-send-email")).to_be_visible()


@pytest.mark.clean_start
def test_a_mangled_link_explains_itself(page, local_server):
    """Messaging apps wrap and truncate long links. The client must be told to ask again, not left on a
    blank screen wondering whether their trainer heard them."""
    page.goto(f"{local_server}?evt=this-is-not-an-event")

    expect(page.locator("#rsvp-unreadable")).to_be_visible(timeout=15_000)
