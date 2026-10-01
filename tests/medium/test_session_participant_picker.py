# tests/medium/test_session_participant_picker.py
# Who is on a session, chosen from a client base that may hold hundreds.
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


def test_the_picker_names_a_routine_by_one_name(page, local_server):
    """The picker opened on "Select Exercise" although it lists routines, and its screen-reader
    name said "Programme": one thing had several names on one screen. It is a routine."""
    load_with_stub(page, local_server, STUB)
    page.fill("#setup-participant-search", "Jane")
    page.locator(f"{MATCHES} .participant-match").first.click()

    select = page.locator(ROWS).first.locator("select")
    assert select.locator("option").first.inner_text() == "Choose a routine"
    assert select.get_attribute("aria-label") == "Routine for this client"


def test_an_empty_directory_says_so_and_offers_to_add_the_name(page, local_server):
    """On a new app the search answered "No client of that name", as if the name were the problem.
    The directory is empty, and the typed name can become the first client from here."""
    empty = STUB.replace("clients: structuredClone(DEFAULT_CLIENTS),", "clients: [],")
    assert empty != STUB
    load_with_stub(page, local_server, empty)
    page.fill("#setup-participant-search", "Ana")

    expect(page.locator(f"{MATCHES} .participant-match-empty")).to_have_text(
        "No clients in the directory yet"
    )
    expect(page.locator(f"{MATCHES} .participant-add-new")).to_have_text(
        'Add "Ana" as a new client'
    )


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


def test_a_typed_alias_finds_the_client(page, local_server):
    """Two clients with one name are told apart by their alias, so the alias is what the trainer
    types; it answered "No client of that name"."""
    seeded = "  clients: structuredClone(DEFAULT_CLIENTS),"
    assert seeded in STUB
    stub = STUB.replace(
        seeded,
        "  clients: structuredClone(DEFAULT_CLIENTS).map((c) =>"
        " c.name === 'Jane Doe' ? { ...c, alias: 'mornings' } : c),",
    )
    load_with_stub(page, local_server, stub)
    page.fill("#setup-participant-search", "morn")
    matches = page.locator(f"{MATCHES} .participant-match")
    expect(matches).to_have_count(1)
    expect(matches.first).to_contain_text("Jane")


def test_a_client_who_withdrew_consent_is_shown_but_cannot_be_booked(
    page, local_server
):
    """Withdrawal stops further processing — the consent letter says so to the client — so a
    withdrawn client may not be put on a new session. The search still finds them, so the trainer
    learns WHY rather than meeting a name that seems to have vanished."""
    seeded = "  clients: structuredClone(DEFAULT_CLIENTS),"
    assert seeded in STUB
    stub = STUB.replace(
        seeded,
        "  clients: structuredClone(DEFAULT_CLIENTS).map((c) => c.name === 'Jane Doe'"
        " ? { ...c, gdprConsent: { cloudSync: false, consentDate: '2026-06-15',"
        " formVersion: '2026-08-09', withdrawnDate: '2026-09-21' } } : c),",
    )
    load_with_stub(page, local_server, stub)
    page.fill("#setup-participant-search", "Jane")

    match = page.locator(f"{MATCHES} .participant-match")
    expect(match).to_have_count(1)
    expect(match.first).to_be_disabled()
    expect(match.first).to_contain_text("Consent withdrawn 2026-09-21")

    page.press("#setup-participant-search", "Enter")
    expect(page.locator(ROWS)).to_have_count(0)
