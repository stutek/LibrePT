# tests/medium/test_program_import_dialog.py
# Bringing in a programme written somewhere else (TODO §29).
#
# The parser and its refusals are pinned without a browser in tests/unit_js/domain/ (including the
# frozen corpus of real pasted shapes). What needs the DOM is the surface's own promises: every
# failure is shown BEFORE anything opens, the trainer is told what came through, and the readable
# items are still worth having when some line was not.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

import pytest
from playwright.sync_api import expect

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import {
  initProgramImportDialog,
  openProgramImportDialog,
} from './modules/plans/programImportDialog.js';
import { DEFAULT_CLIENTS, DEFAULT_EXERCISES, DEFAULT_SESSIONS } from './data/index.js';
""",
    view_id="clients",
    body="""
const state = {
  lang: 'en',
  clients: structuredClone(DEFAULT_CLIENTS),
  exercises: structuredClone(DEFAULT_EXERCISES),
  sessions: structuredClone(DEFAULT_SESSIONS),
  routines: [],
  history: [],
  planUpdates: [],
};

// What the dialog hands back, recorded rather than acted on: opening the editor is the app's job,
// and this tier is about the surface that decides WHAT to open it with.
window.__imported = null;
initProgramImportDialog({
  t,
  getState: () => state,
  onImport: (plan) => { window.__imported = plan; },
  readFileText: (file) => file.text(),
});
window.__open = () => openProgramImportDialog();
""",
)

GOOD = {
    "format": "librept.program/1",
    "title": "Upper Body A",
    "items": [
        {
            "name": "Barbell Bench Press",
            "sets": 3,
            "reps": 5,
            "weight": 60,
            "unit": "kg",
        },
        {"rest": 90},
        {"name": "Bulgarian Split Squat With A Towel", "sets": 3, "reps": 8},
    ],
}


def _open(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.evaluate("() => window.__open()")
    page.wait_for_selector("#dialog-program-import[open]")


def _paste(page, payload):
    page.fill(
        "#program-import-text",
        payload if isinstance(payload, str) else json.dumps(payload),
    )
    page.wait_for_timeout(200)


def test_a_pasted_programme_says_what_came_through_before_anything_opens(
    page, local_server
):
    _open(page, local_server)

    _paste(page, GOOD)

    report = page.locator("#program-import-report")
    expect(report).to_be_visible()
    expect(report).to_contain_text("3 items read")
    # The movement the catalogue does not have is ALLOWED and COUNTED, never refused and never
    # silently renamed into the nearest thing (§29.1).
    expect(report).to_contain_text("1 of them not in your catalogue")


def test_text_that_is_not_a_programme_is_refused_with_a_reason(page, local_server):
    _open(page, local_server)

    _paste(page, "here is the plan: do some squats")

    expect(page.locator("#program-import-report")).to_contain_text("no programme data")
    expect(page.locator("#program-import-open")).to_be_disabled()


def test_the_lines_that_could_not_be_read_are_all_listed_with_their_position(
    page, local_server
):
    """A trainer who lands in an editor and only then notices the gaps has been handed a puzzle."""
    _open(page, local_server)

    _paste(
        page,
        {
            "format": "librept.program/1",
            "items": [
                {"name": "Back Squat", "sets": 3, "reps": 5},
                {"nonsense": True},
                {"name": "Plank", "sets": 2, "reps": 30},
            ],
        },
    )

    report = page.locator("#program-import-report")
    expect(report).to_contain_text("1 could not be read")
    expect(report).to_contain_text("2:")
    # ...and the rest is still worth having: item 7 being unreadable must not lose items 1-6.
    expect(page.locator("#program-import-open")).to_be_enabled()


def test_the_format_can_be_looked_at_rather_than_interpreted(page, local_server):
    """A working example steps a schema: "show me the format" fills the box with one that parses."""
    _open(page, local_server)

    page.click("#program-import-template")

    expect(page.locator("#program-import-report")).to_contain_text("items read")


def test_opening_hands_over_the_plan_and_who_it_is_for(page, local_server):
    _open(page, local_server)
    _paste(page, GOOD)
    page.select_option("#program-import-client", index=1)

    page.click("#program-import-open")

    handed = page.evaluate("() => window.__imported")
    assert [item.get("name") for item in handed["items"] if item.get("name")] == [
        "Barbell Bench Press",
        "Bulgarian Split Squat With A Towel",
    ]
    assert handed["title"] == "Upper Body A"
    assert handed["clientId"], "the client picked is who it is for"
    expect(page.locator("#dialog-program-import")).not_to_be_visible()


def test_a_movement_the_catalogue_does_not_have_is_marked_in_the_editor(
    page, local_server
):
    """§29.1's ruling has two halves and both matter: the movement is ALLOWED — refusing it would
    throw away the trainer's programme over a naming difference — and it is MARKED, or the catalogue
    quietly becomes forty spellings of one movement."""
    _open(page, local_server)
    _paste(page, GOOD)

    page.click("#program-import-open")

    # The mark travels ON the item, which is what the editor renders its badge from.
    handed = page.evaluate("() => window.__imported")
    custom = [item["name"] for item in handed["items"] if item.get("custom")]
    assert custom == ["Bulgarian Split Squat With A Towel"], custom
    # ...and a movement the catalogue DOES know is not marked, or the mark would say nothing.
    known = [
        item for item in handed["items"] if item.get("name") == "Barbell Bench Press"
    ]
    assert known[0]["custom"] is False
