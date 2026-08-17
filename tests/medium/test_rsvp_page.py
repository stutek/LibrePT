# tests/medium/test_rsvp_page.py
# The page a client lands on from an invite, where they answer it (TODO §1.6's confirm link).
#
# **Why a page and not two links in the invite.** The original sketch put prefilled `mailto:`/`sms:`
# Confirm links straight in the invite body. That works in an email and fails in a text: an `sms:` URI
# inside an SMS body is not linkified by most messaging apps, so the SMS leg — which is the one the
# maintainer ruled in on 2026-08-17 ("let us have SMS too, for sure") — would have had no working
# confirm route at all. Both invite channels can carry a plain https link, so the app builds the reply
# URI at tap time instead, when it knows which channel the client actually chose.
#
# Like `/intake`, this is a CLIENT-facing route and therefore stateless: no store, no boot of the
# trainer's app, nothing written to a phone that is not theirs.
#
# Written before the page existed, per AGENT_RULES §5.10.

import json
import urllib.parse

from playwright.sync_api import expect

from tests.medium._harness import load_with_stub

# The invite a client received, encoded the way eventTransports puts it in a link.
RSVP_STUB = """
import * as appBoot from './appBoot.js';
import { encodeSessionEvent, SESSION_INVITE } from './data/sessionEventPayload.js';
import { TRANSLATIONS } from './i18n/index.js';

window.__opened = [];
const invite = {
  kind: SESSION_INVITE,
  sessionId: 's1',
  clientId: 'c1',
  title: 'Group Strength',
  startsAt: 1789200000000,
  durationMinutes: 60,
  location: 'Studio 2',
  organizerName: 'Sam Ray',
  organizerEmail: 'pt@example.com',
  organizerPhone: window.__organizerPhone === null ? undefined : '+386 41 234 567',
};

appBoot.bootRsvpReply({
  encodedEvent: encodeSessionEvent(invite),
  t: (key) => TRANSLATIONS.en[key] || key,
  appUrl: 'https://app.example/LibrePT/',
  platform: {
    openUrl: (url) => { window.__opened.push(url); },
    share: async (data) => { window.__opened.push(data.url); },
    canShare: () => false,
    writeText: async (text) => { window.__opened.push(text); },
  },
});
"""


def _mount(page, local_server, with_phone=True):
    page.add_init_script(
        f"window.__organizerPhone = {json.dumps(None if not with_phone else '+386 41 234 567')};"
    )
    load_with_stub(page, local_server, RSVP_STUB)
    expect(page.locator("#view-rsvp")).to_be_visible()


def _opened(page):
    return page.evaluate("() => window.__opened")


def test_the_client_sees_which_session_they_are_answering(page, local_server):
    """An answer to "are you coming?" is worthless if the person cannot see what they are answering
    about — and this page is opened days later, from a message, on a phone."""
    _mount(page, local_server)

    body = page.locator("#view-rsvp").inner_text()
    assert "Group Strength" in body
    assert "Studio 2" in body
    assert "Sam Ray" in body


def test_answering_by_text_addresses_the_trainer_and_carries_the_answer(
    page, local_server
):
    """SMS is in because clients answer texts (ruled 2026-08-17). The number comes from the invite, so
    the client never types it, and the body carries the deep link the trainer taps once."""
    _mount(page, local_server)

    page.click("#rsvp-yes")
    page.click("#rsvp-send-sms")

    sent = _opened(page)[-1]
    assert sent.startswith("sms:")
    assert urllib.parse.quote("+386 41 234 567", safe="") in sent or "386" in sent
    # The reply deep link is in the body, on the app's own URL.
    assert "app.example" in urllib.parse.unquote(sent)
    assert "evt=" in urllib.parse.unquote(sent)


def test_answering_by_email_is_offered_alongside_it_and_not_instead(page, local_server):
    """Both channels, because prefill is inconsistent across Android messaging apps: a mangled SMS body
    is a reply with no link in it, and email is the leg where the body is reliably honoured."""
    _mount(page, local_server)

    page.click("#rsvp-yes")
    page.click("#rsvp-send-email")

    sent = urllib.parse.unquote(_opened(page)[-1])
    assert sent.startswith("mailto:pt@example.com")
    assert "evt=" in sent


def test_the_text_option_is_hidden_when_the_invite_carried_no_number(
    page, local_server
):
    """An older invite — or one from a trainer who has no phone on file — cannot be answered by text.
    Showing a dead button would be worse than showing one route that works."""
    _mount(page, local_server, with_phone=False)

    page.click("#rsvp-yes")

    expect(page.locator("#rsvp-send-sms")).to_be_hidden()
    expect(page.locator("#rsvp-send-email")).to_be_visible()


def test_a_channel_is_offered_only_after_an_answer_is_chosen(page, local_server):
    """Otherwise the client sends "here is my reply" with no reply in it — the trainer receives a
    message that says nothing and has to ask again."""
    _mount(page, local_server)

    expect(page.locator("#rsvp-send-email")).to_be_hidden()
    page.click("#rsvp-maybe")
    expect(page.locator("#rsvp-send-email")).to_be_visible()


def test_the_reply_names_no_one(page, local_server):
    """The reply crosses a carrier and rests in two message histories. It carries opaque ids and one
    word — never the client's name, the session title, or a location that would disclose where a named
    person is at a given hour."""
    _mount(page, local_server)

    page.click("#rsvp-no")
    page.click("#rsvp-send-email")

    sent = urllib.parse.unquote(_opened(page)[-1])
    # The human sentence names the session for the TRAINER's inbox, but the payload itself must not.
    payload = sent.split("evt=")[1].split("&")[0].split()[0]
    for leak in ["Group Strength", "Studio 2"]:
        assert leak not in payload, f"{leak} rode in the payload"


def test_the_page_writes_nothing_to_the_clients_phone(page, local_server):
    """Same promise as /intake: this is not the trainer's device, and answering an invite is not a
    reason to put a database on someone's phone."""
    _mount(page, local_server)
    page.click("#rsvp-yes")

    keys = page.evaluate("() => Object.keys(localStorage)")
    assert [key for key in keys if key != "librept_terms_accepted"] == []
    assert (
        page.evaluate("async () => (await indexedDB.databases()).map((d) => d.name)")
        == []
    )


def test_a_broken_or_stale_link_says_so_instead_of_showing_a_blank_page(
    page, local_server
):
    """A link mangled by a messaging app must not leave the client staring at an empty screen with no
    idea whether their trainer got an answer."""
    load_with_stub(
        page,
        local_server,
        RSVP_STUB.replace(
            "encodedEvent: encodeSessionEvent(invite)", "encodedEvent: 'not-an-event'"
        ),
    )

    expect(page.locator("#rsvp-unreadable")).to_be_visible()
    expect(page.locator("#rsvp-answers")).to_be_hidden()
