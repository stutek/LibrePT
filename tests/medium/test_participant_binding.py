# tests/medium/test_participant_binding.py
# Several participants on ONE plan, in the clipboard (TODO §8.1).
#
# The rules are pinned without a browser in tests/unit_js/domain/participantBinding.test.mjs. What
# needs the DOM is the promise a trainer feels on the gym floor: two people doing the identical
# circuit cost one tap per set, they read as one tab rather than three that always agree, and the
# whole thing is one control away from being undone.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

import pytest
from playwright.sync_api import expect

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

pytestmark = pytest.mark.clean_start

JANE = "c1a9f0e2"
JOHN = "c2b8e1d3"

PLAN = [exercise_item("e1", "Back Squat"), exercise_item("e2", "Bench Press")]


def _two_participant_session():
    session = json.loads(
        active_session_fixture(exercises=PLAN)
        .replace("Date.now()", "0")
        .replace("null", "null")
    )
    session["participants"] = [JANE, JOHN]
    session["clientRoutines"][JOHN] = {
        "routineId": "r1",
        "routineName": "Upper Body",
        "clientName": "John Smith",
        "activeExerciseIndex": 0,
        "deckAllCollapsed": False,
        "exercises": [dict(item) for item in PLAN],
        "logs": {},
    }
    return json.dumps(session).replace('"startTime": 0', '"startTime": Date.now()')


def _mount(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, clipboard_stub(_two_participant_session()))
    page.wait_for_selector("#active-session-overlay:not(.hidden)")


def _bind(page):
    page.click("#btn-session-menu")
    page.wait_for_selector("#session-menu:not(.hidden)")
    page.click("#btn-bind-participants")
    page.wait_for_timeout(200)


def test_participants_start_on_their_own_plans(page, local_server):
    _mount(page, local_server)

    tabs = page.locator("#active-session-client-tabs .client-tab-btn")
    assert tabs.count() == 2
    assert page.locator(".client-tab-bound").count() == 0


def test_binding_makes_them_one_tab(page, local_server):
    """Three tabs that always show the same plan invite three taps to check whether they do."""
    _mount(page, local_server)

    _bind(page)

    bound = page.locator(".client-tab-bound")
    expect(bound).to_be_visible()
    # The people are still named on it: a tab that says "group" tells nobody who is in it.
    expect(bound).to_contain_text("JD")
    expect(bound).to_contain_text("JS")


def test_logging_once_counts_for_everyone_bound(page, local_server):
    """The whole point: two people doing the identical circuit cost one tap per set."""
    _mount(page, local_server)
    _bind(page)

    logged = page.evaluate(
        """async (ids) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          session.clientRoutines[ids[0]].logs.e1 = [{ reps: 10, completed: true }];
          return ids.map((id) => session.clientRoutines[id].logs.e1?.[0]?.completed === true);
        }""",
        [JANE, JOHN],
    )

    assert logged == [True, True]


def test_it_can_be_undone_from_the_same_control(page, local_server):
    """A trainer who binds by mistake, or whose group splits mid-session, is one tap from their own
    plans again — and the plans are separate objects afterwards, not one shared by accident."""
    _mount(page, local_server)
    _bind(page)

    _bind(page)

    assert page.locator(".client-tab-bound").count() == 0
    separate = page.evaluate(
        """async (ids) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          session.clientRoutines[ids[0]].logs.e2 = [{ reps: 8, completed: true }];
          return session.clientRoutines[ids[1]].logs.e2 === undefined;
        }""",
        [JANE, JOHN],
    )
    assert separate is True
