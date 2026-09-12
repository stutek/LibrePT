# tests/medium/test_session_participant_picker.py
# Who is on a session, chosen from a client base that may hold hundreds (TODO §46.2).
#
# The form used to render every client as a checkbox row with a routine <select>, and to open with
# all of them ticked. This tier is where that behaviour belongs: it is the setup view's own DOM,
# with no router, no database and no app boot — mounted through _harness.view_stub the way
# test_clients_directory.py mounts the directory grid.
#
# What is pinned here is the trainer's side of it: the form opens with nobody on the session, a name
# typed into the search finds the person, a tap puts them on it with a programme to assign, and a tap
# on the cross takes them off again.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { bootWorkoutSetup } from './appBoot.js';
import { renderWorkoutSetupViewShell } from './modules/session/editSessionView.js';
import { openWorkoutSetupModal } from './modules/session/editSessionControl.js';
import { DEFAULT_CLIENTS, DEFAULT_ROUTINES } from './data/index.js';
""",
    view_id="workout-setup",
    body="""
const state = {
  clients: structuredClone(DEFAULT_CLIENTS),
  routines: structuredClone(DEFAULT_ROUTINES),
  sessions: [],
  lang: 'en',
};

renderWorkoutSetupViewShell();
bootWorkoutSetup({
  getState: () => state,
  t,
  getClientDisplayNameHTML: (client) => client.name,
  switchView: activateView,
  navigateToPath: noop,
  saveToLocalStorage: noop,
  renderEverything: noop,
});
openWorkoutSetupModal();
""",
)

MATCHES = "#setup-participant-matches"
ROWS = "#setup-participants-assignment-list .participant-setup-row"


def test_the_form_opens_with_nobody_on_the_session(page, local_server):
    """Eight seeded clients, and not one of them is booked until the trainer says so."""
    load_with_stub(page, local_server, STUB)
    expect(page.locator(ROWS)).to_have_count(0)
    expect(page.locator("#setup-participants-empty")).to_be_visible()
    expect(page.locator(MATCHES)).to_be_hidden()


def test_a_typed_name_finds_the_client_and_a_tap_books_them(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-participant-search", "Jane")

    matches = page.locator(f"{MATCHES} .participant-match")
    expect(matches).to_have_count(1)
    matches.first.click()

    expect(page.locator(ROWS)).to_have_count(1)
    expect(page.locator(ROWS).first).to_contain_text("Jane")
    # Every booked client carries their own programme picker, and the count says how many there are.
    expect(page.locator(ROWS).first.locator("select")).to_be_visible()
    expect(page.locator("#setup-participant-count")).to_have_text("Chosen: 1")
    # The field empties itself, ready for the next name.
    expect(page.locator("#setup-participant-search")).to_have_value("")
    expect(page.locator(MATCHES)).to_be_hidden()


def test_a_name_nobody_has_says_so_rather_than_showing_nothing(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-participant-search", "Zzz")
    expect(page.locator(f"{MATCHES} .participant-match-empty")).to_be_visible()
    expect(page.locator(f"{MATCHES} .participant-match")).to_have_count(0)


def test_someone_already_on_the_session_is_not_offered_again(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-participant-search", "Jane")
    page.locator(f"{MATCHES} .participant-match").first.click()

    page.fill("#setup-participant-search", "Jane")
    expect(page.locator(f"{MATCHES} .participant-match")).to_have_count(0)
    expect(page.locator(f"{MATCHES} .participant-match-empty")).to_be_visible()


def test_the_cross_takes_a_client_off_the_session(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-participant-search", "Jane")
    page.locator(f"{MATCHES} .participant-match").first.click()
    expect(page.locator(ROWS)).to_have_count(1)

    page.locator(f"{ROWS} .participant-remove").first.click()
    expect(page.locator(ROWS)).to_have_count(0)
    expect(page.locator("#setup-participants-empty")).to_be_visible()
    expect(page.locator("#setup-participant-count")).to_have_text("")


def test_enter_books_the_first_match_without_submitting_the_form(page, local_server):
    """A trainer at a keyboard never leaves the field — and Enter must not launch the clipboard."""
    load_with_stub(page, local_server, STUB)
    page.evaluate(
        """() => {
             window.__submitted = 0;
             document
               .getElementById('form-workout-setup')
               .addEventListener('submit', () => { window.__submitted += 1; });
           }"""
    )
    page.fill("#setup-participant-search", "Jane")
    page.press("#setup-participant-search", "Enter")

    expect(page.locator(ROWS)).to_have_count(1)
    submitted = page.evaluate("() => window.__submitted")
    assert submitted == 0, (
        "Enter in the search field must add a client, not launch the clipboard"
    )
