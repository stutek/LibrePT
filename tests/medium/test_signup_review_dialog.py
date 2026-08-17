# tests/medium/test_signup_review_dialog.py
# The trainer reviewing a submission a client sent them (TODO §26.5).
#
# **The dialog IS the trust boundary, not a nicety.** Anyone who photographs the QR on a gym wall can
# craft a file, and there is deliberately no signature to check (§26.8 — signing needs a key exchange,
# which needs the server this project does not have). So every test here is about the same promise:
# nothing enters the trainer's register that they did not look at and accept.
#
# Written before the dialog existed, per AGENT_RULES §5.10.

import json

from playwright.sync_api import expect

from tests.medium._harness import load_with_stub

# Mounts the dialog with an in-memory register, so a test can read what was written without a real
# store. `window.__saved` is the state the app would have persisted.
REVIEW_STUB = """
import * as appBoot from './appBoot.js';
import { openSignupReview, reviewSignupText } from './modules/clients/signupReviewDialog.js';
import { TRANSLATIONS } from './i18n/index.js';

window.__state = { clients: [
  { id: 'c1', name: 'Jana Novak', email: 'jana@example.com', phone: '041234567',
    goals: 'trainer-written goal', notes: 'trainer-written note', active: true },
] };
window.__saves = 0;
window.__rendered = 0;

appBoot.bootSignupReview({
  getState: () => window.__state,
  t: (key) => TRANSLATIONS.en[key] || key,
  saveState: () => { window.__saves += 1; },
  renderClientsList: () => { window.__rendered += 1; },
  newClientId: () => 'new-client-id',
  todayIso: () => '2026-08-17',
});

// A page cannot populate a file input, so the test drives the same function the input's change
// handler calls. Imported, not a window hook the shipped app carries for the suite's benefit.
window.__openWith = (text) => { openSignupReview(); return reviewSignupText(text); };
"""


def _mount(page, local_server):
    load_with_stub(page, local_server, REVIEW_STUB)


def _submission(**overrides):
    payload = {
        "v": 1,
        "name": "Jana Novak",
        "email": "jana@example.com",
        "phone": "041 234 567",
        "goals": "back to squatting after the knee",
        "injury": "knee reconstruction 2024",
        "gdprConsent": {
            "cloudSync": True,
            "consentDate": "2026-08-17",
            "formVersion": "2026-08-09",
            "formLang": "sl",
        },
    }
    payload.update(overrides)
    return json.dumps(payload)


def _open(page, text):
    page.evaluate("(text) => window.__openWith(text)", text)
    expect(page.locator("#dialog-signup-review")).to_be_visible()


def test_the_trainer_sees_what_the_person_said_before_anything_is_saved(
    page, local_server
):
    """A review is only a review if the whole submission is on screen — including the health detail the
    client chose to offer, which is the part a trainer must actually read before their first session."""
    _mount(page, local_server)

    _open(page, _submission(name="Nova Oseba", email="nova@example.com", phone=""))

    body = page.locator("#dialog-signup-review").inner_text()
    assert "Nova Oseba" in body
    assert "nova@example.com" in body
    assert "knee reconstruction 2024" in body
    assert "back to squatting after the knee" in body
    # Nothing is written until they accept.
    assert page.evaluate("() => window.__saves") == 0


def test_the_consent_is_shown_as_evidence_and_not_as_a_yes(page, local_server):
    """Art. 7(1) is about being able to demonstrate consent, so the review shows the three things that
    make it demonstrable — when, which wording, which language — rather than a tick."""
    _mount(page, local_server)

    _open(page, _submission(name="Nova Oseba", email="nova@example.com"))

    body = page.locator("#dialog-signup-review").inner_text()
    assert "2026-08-17" in body
    assert "2026-08-09" in body


def test_accepting_a_new_person_adds_them_once(page, local_server):
    _mount(page, local_server)
    _open(page, _submission(name="Nova Oseba", email="nova@example.com", phone=""))

    page.click("#signup-review-save")

    clients = page.evaluate("() => window.__state.clients")
    assert [client["name"] for client in clients] == ["Jana Novak", "Nova Oseba"]
    added = clients[1]
    assert added["id"] == "new-client-id"
    assert added["active"] is True
    assert added["injury"] == "knee reconstruction 2024"
    assert added["gdprConsent"]["formLang"] == "sl"
    assert page.evaluate("() => window.__saves") == 1
    # The directory re-renders, or the trainer is left looking at a list that does not have them in it.
    assert page.evaluate("() => window.__rendered") == 1


def test_a_returning_client_is_offered_as_an_update_rather_than_a_second_record(
    page, local_server
):
    """§26.5's dedupe. Matched on email or phone, never on name — and the trainer still decides, since
    only they know whether this is the same person."""
    _mount(page, local_server)

    _open(page, _submission())

    expect(page.locator("#signup-review-match")).to_be_visible()
    assert "Jana Novak" in page.locator("#signup-review-match").inner_text()
    page.click("#signup-review-save")

    clients = page.evaluate("() => window.__state.clients")
    assert len(clients) == 1, "no second Jana Novak"
    assert clients[0]["id"] == "c1", "the same record, updated in place"
    assert clients[0]["injury"] == "knee reconstruction 2024"


def test_an_update_never_blanks_what_the_client_did_not_mention(page, local_server):
    """The trainer's own notes are theirs. A client who skips the goals box must not wipe a goal the
    trainer wrote after their last session."""
    _mount(page, local_server)

    _open(page, _submission(goals="", injury=""))

    page.click("#signup-review-save")

    updated = page.evaluate("() => window.__state.clients[0]")
    assert updated["goals"] == "trainer-written goal"
    assert updated["notes"] == "trainer-written note"


def test_the_trainer_can_insist_this_is_someone_new(page, local_server):
    """Two people do share a phone — a couple training together, a parent's number on a teenager's
    form. The match is an offer, so it can be declined."""
    _mount(page, local_server)
    _open(page, _submission())

    page.uncheck("#signup-review-update-existing")
    page.click("#signup-review-save")

    clients = page.evaluate("() => window.__state.clients")
    assert len(clients) == 2
    assert clients[1]["id"] == "new-client-id"


def test_declining_writes_nothing_and_keeps_no_copy(page, local_server):
    """Cancel has to be a real refusal: the submission is gone, not primed for a later stray tap on
    Save — the same rule the backup restore follows for a declined file."""
    _mount(page, local_server)
    _open(page, _submission(name="Nova Oseba", email="nova@example.com"))

    page.click("#signup-review-cancel")

    expect(page.locator("#dialog-signup-review")).to_be_hidden()
    assert page.evaluate("() => window.__state.clients.length") == 1
    assert page.evaluate("() => window.__saves") == 0


def test_the_wrong_attachment_says_so_instead_of_saving_something(page, local_server):
    """A trainer taps the wrong file in an inbox; that is ordinary. It must produce a readable refusal
    and no record — never a half-filled client."""
    _mount(page, local_server)

    for wrong in [
        "not json",
        json.dumps({"clients": [], "schemaVersion": 4}),
        _submission(v=99),
    ]:
        page.evaluate("(text) => window.__openWith(text)", wrong)
        expect(page.locator("#signup-review-status")).to_be_visible()
        assert page.evaluate("() => window.__state.clients.length") == 1
        assert page.evaluate("() => window.__saves") == 0


def test_a_submission_cannot_name_the_record_it_lands_on(page, local_server):
    """The crafted case the trust boundary exists for: a file that tries to overwrite an existing client
    by carrying their id, or to reactivate an archived one."""
    _mount(page, local_server)

    _open(
        page,
        _submission(
            name="Nova Oseba", email="nova@example.com", phone="", id="c1", active=False
        ),
    )
    page.click("#signup-review-save")

    clients = page.evaluate("() => window.__state.clients")
    assert clients[0]["name"] == "Jana Novak", "the existing record is untouched"
    assert clients[1]["id"] == "new-client-id", "the sender's id was ignored"
    assert clients[1]["active"] is True
