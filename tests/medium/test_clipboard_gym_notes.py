# tests/medium/test_clipboard_gym_notes.py
# What the gym already said about this client, shown where their next plan is being shaped
# (TODO §35.3d).
#
# The claim under test is the one §35's story is built around: a signal taken one-handed mid-circuit
# comes back at the moment it can change something, against the right person, with the ones about
# movements in THIS plan first. The selection and ordering rules are pinned without a browser in
# tests/unit_js/domain/gymNotes.test.mjs; what needs the DOM is that the panel shows them, marks
# the in-plan ones, and stays out of the way when there is nothing to say.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
    open_plan_editor,
)

pytestmark = pytest.mark.clean_start

# Jane Doe — the seeded client active_session_fixture defaults to.
CLIENT_ID = "c1a9f0e2"

PLAN = [exercise_item("exA", "Barbell Row"), exercise_item("exB", "Overhead Press")]

# Two unanswered signals: one about a movement in the plan on screen, one about a movement that is
# not, and the second is the NEWER — so date alone would put the wrong one first.
SEEDED_NOTES = """
state.planUpdates.push(
  { id: 'n1', clientId: '%s', clientName: 'Jane Doe', exerciseName: 'Barbell Row',
    tag: 'Too Hard - Reduce Load', date: '2026-08-01T10:00:00.000Z', resolved: false },
  { id: 'n2', clientId: '%s', clientName: 'Jane Doe', exerciseName: 'Deadlift',
    tag: 'Form Break - Watch Position', date: '2026-08-12T10:00:00.000Z', resolved: false },
);
renderActiveGroupBoard();
""" % (CLIENT_ID, CLIENT_ID)


def _mount(page, local_server, extra_body=""):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=PLAN),
            extra_body=extra_body,
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    open_plan_editor(page)
    page.wait_for_selector(".clipboard-editor")


def test_the_trainer_sees_what_the_gym_said_while_shaping_the_next_plan(
    page, local_server
):
    _mount(page, local_server, SEEDED_NOTES)

    block = page.locator("#client-focus-gym")
    expect(block).to_be_visible()
    expect(block).to_contain_text("Barbell Row")
    expect(block).to_contain_text("Too Hard")
    expect(block).to_contain_text("Deadlift")


def test_a_note_about_a_movement_in_this_plan_comes_first_and_says_so(
    page, local_server
):
    """§35.3d's actual promise. Newest-first alone would bury the row note under the deadlift one,
    and an unexplained order reads as arbitrary — so the in-plan entry is also marked."""
    _mount(page, local_server, SEEDED_NOTES)

    rows = page.locator("#client-focus-gym-notes .gym-note")
    expect(rows.first).to_contain_text("Barbell Row")
    # Marked in WORDS, not by position or colour: a trainer reading two rows on a phone has no
    # other way to tell an entry about the movement in front of them from last week's bench press.
    expect(rows.first).to_contain_text("in this plan")
    expect(rows.nth(1)).to_contain_text("Deadlift")
    expect(rows.nth(1)).not_to_contain_text("in this plan")


def test_a_note_the_trainer_already_dealt_with_does_not_come_back(page, local_server):
    """Asking the same question twice is how a review surface teaches people to stop reading it."""
    _mount(
        page,
        local_server,
        """
state.planUpdates.push(
  { id: 'done', clientId: '%s', exerciseName: 'Barbell Row',
    tag: 'Too Easy - Increase Load', date: '2026-08-01T10:00:00.000Z', resolved: true },
);
renderActiveGroupBoard();
"""
        % CLIENT_ID,
    )

    expect(page.locator("#client-focus-gym")).to_be_hidden()


def test_nothing_logged_costs_the_plan_no_space(page, local_server):
    """The panel shares a 390px screen with the plan being edited, so an empty block is not free."""
    _mount(page, local_server)

    expect(page.locator("#client-focus-gym")).to_be_hidden()
