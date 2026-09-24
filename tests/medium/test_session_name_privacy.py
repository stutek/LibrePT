# tests/medium/test_session_name_privacy.py — a session's name and location may not name a client.
#
# Ruled 2026-09-18 (Simon), TODO §66: whole-word matches against every client's name, surname and
# alias, and the save is refused. A name typed here is a name the app can never take out again —
# scrubbing prose needs the name, and after an erasure the name is gone (§65).
#
# Mounts ONE component (bootWorkoutSetup) against index.html's real markup: the subject is what the
# form does with what was typed, not what saving one does — including the refusal of a session with
# nobody in it, in the chosen language (TODO §38.20).

import re

from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

STUB = view_stub(
    imports="""
import { bootWorkoutSetup } from './appBoot.js';
import { openWorkoutSetupModal } from './modules/session/editSessionControl.js';
import { renderWorkoutSetupViewShell } from './modules/session/editSessionView.js';
""",
    view_id="workout-setup",
    body="""
renderWorkoutSetupViewShell();

const state = {
  lang: 'en',
  sessions: [],
  clients: [
    { id: 'c1', name: 'Jane Doe', alias: 'morning' },
    { id: 'c2', name: 'Sam Ray' },
  ],
  routines: [{ id: 'r1', name: 'Upper Body' }],
  exercises: [],
  history: [],
  planUpdates: [],
};

// What a refused save must NOT do: reach the session at all.
window.__started = false;

bootWorkoutSetup({
  getState: () => state,
  t,
  escapeHTML: (s) => s,
  getClientDisplayNameHTML: (client) => client.name,
  switchView: activateView,
  pushRoute: noop,
  urlFor: (name) => `/${name}`,
  getISODateForColumn: () => '2026-09-15',
  scheduleTimelineSettle: noop,
  startWorkoutSession: () => { window.__started = true; },
  saveToLocalStorage: noop,
  rerenderSessions: noop,
  openSessionInviteDialog: noop,
});

openWorkoutSetupModal(null, null, null);
""",
)


assert STUB.count("  t,\n") == 1
SLOVENIAN_STUB = STUB.replace("  t,\n", "  t: (key) => TRANSLATIONS.sl[key] || key,\n")


def test_a_session_with_nobody_in_it_is_refused_in_the_chosen_language(
    page, local_server
):
    """The two refusals below the field checks were written in English beside keys that held the
    same sentence in every language (TODO §38.20)."""
    load_with_stub(page, local_server, SLOVENIAN_STUB)
    messages = []
    page.on(
        "dialog", lambda dialog: (messages.append(dialog.message), dialog.dismiss())
    )

    _save(page)

    expected = page.evaluate(
        """async () => {
            const { TRANSLATIONS } = await import(new URL('i18n/index.js', document.baseURI).href);
            return TRANSLATIONS.sl.err_select_client;
        }"""
    )
    expect(page.locator("#form-workout-setup")).to_be_visible()
    assert messages == [expected]
    assert page.evaluate("() => window.__started") is False


def _save(page):
    page.locator("#form-workout-setup button[type=submit]").click()


def test_a_session_named_after_a_client_is_refused_and_says_why(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-session-name", "Jane 1:1")

    _save(page)

    expect(page.locator("#setup-session-name")).to_have_class(re.compile("is-invalid"))
    message = page.locator("#setup-session-name-error")
    expect(message).to_be_visible()
    # The reason, in words a trainer can act on — and their own word quoted back, emphasised, so they
    # can see which part of what they typed the app means.
    expect(message).to_contain_text("cannot contain a client's name")
    assert message.locator(".form-error-word").inner_text() == "Jane"
    assert page.evaluate("() => window.__started") is False, (
        "the session must not start"
    )


def test_an_alias_in_the_location_is_refused_too(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-location", "morning gym")

    _save(page)

    expect(page.locator("#setup-location")).to_have_class(re.compile("is-invalid"))
    assert (
        page.locator("#setup-location-error .form-error-word").inner_text() == "morning"
    )


def test_a_name_inside_a_longer_word_is_not_a_name(page, local_server):
    """Whole words only (Simon, 2026-09-18) — otherwise ordinary titles would be refused."""
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-session-name", "Samurai conditioning")

    _save(page)

    expect(page.locator("#setup-session-name-error")).to_be_hidden()


def test_editing_the_field_clears_the_refusal(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-session-name", "Jane 1:1")
    _save(page)
    expect(page.locator("#setup-session-name-error")).to_be_visible()

    page.fill("#setup-session-name", "Strength 1:1")

    expect(page.locator("#setup-session-name-error")).to_be_hidden()
    expect(page.locator("#setup-session-name")).not_to_have_class(
        re.compile("is-invalid")
    )
