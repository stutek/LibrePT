# tests/medium/test_copy_plan_to_participant.py
# Giving another participant tonight's plan — the walk-in who joins a session already
# underway, handed what the room is doing in one tap instead of re-authoring it.
#
# What is copied is pinned without a browser in tests/unit_js/domain/planCopy.test.mjs. What needs
# the DOM is the promise a trainer feels: they see WHO they are giving it to, the other person's
# plan is theirs from that moment, and it is not the same thing as putting them on one plan —
# a copy diverges, a binding does not.
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


def _two_participant_session():
    session = json.loads(
        active_session_fixture(
            exercises=[
                exercise_item("e1", "Back Squat"),
                exercise_item("e2", "Bench Press"),
            ]
        ).replace("Date.now()", "0")
    )
    session["participants"] = [JANE, JOHN]
    session["clientRoutines"][JOHN] = {
        "routineId": "r1",
        "routineName": "Whatever John had",
        "clientName": "John Smith",
        "activeExerciseIndex": 0,
        "deckAllCollapsed": False,
        "exercises": [exercise_item("j1", "Treadmill Run")],
        "logs": {},
    }
    return json.dumps(session).replace('"startTime": 0', '"startTime": Date.now()')


def _mount(page, local_server):
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(page, local_server, clipboard_stub(_two_participant_session()))
    page.wait_for_selector("#active-session-overlay:not(.hidden)")


def _open_copy_list(page):
    page.click("#btn-session-menu")
    page.wait_for_selector("#session-menu:not(.hidden)")
    page.click("#btn-copy-plan")


def test_the_trainer_sees_who_they_are_giving_it_to(page, local_server):
    """ "To whom" is the whole question — a control that guessed would be answering it for them."""
    _mount(page, local_server)

    _open_copy_list(page)

    expect(page.locator("#copy-plan-targets")).to_contain_text("John Smith")
    # Never themselves: copying a plan onto the person already doing it does nothing but confuse.
    expect(page.locator("#copy-plan-targets")).not_to_contain_text("Jane")


def test_copying_hands_over_the_session_being_run(page, local_server):
    _mount(page, local_server)
    _open_copy_list(page)

    page.click("[data-copy-to='%s']" % JOHN)
    page.wait_for_timeout(200)

    johns_plan = page.evaluate(
        """async (id) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          return session.clientRoutines[id].exercises.map((item) => item.name);
        }""",
        JOHN,
    )
    assert johns_plan == ["Back Squat", "Bench Press"]


def test_the_plan_a_copy_replaces_is_kept_as_an_unscheduled_plan(page, local_server):
    """John's own plan vanished without a question. A program is never deleted, so what
    the copy replaces waits among the unscheduled plans."""
    _mount(page, local_server)
    _open_copy_list(page)
    page.click("[data-copy-to='%s']" % JOHN)
    page.wait_for_timeout(200)

    kept = page.evaluate(
        """async (id) => {
          const store = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
          return store.getAppDeps().state.clientPrograms
            .filter((p) => p.clientId === id && p.status === 'planned' && !p.sessionId)
            .map((p) => p.exercises.map((item) => item.name));
        }""",
        JOHN,
    )
    assert kept == [["Treadmill Run"]]


def test_the_copy_is_his_own_from_that_moment(page, local_server):
    """The difference from binding them, and the reason both controls exist: editing one plan
    afterwards must not touch the other."""
    _mount(page, local_server)
    _open_copy_list(page)
    page.click("[data-copy-to='%s']" % JOHN)
    page.wait_for_timeout(200)

    diverged = page.evaluate(
        """async (ids) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          session.clientRoutines[ids[1]].exercises[0].repsTarget = 99;
          return {
            hers: session.clientRoutines[ids[0]].exercises[0].repsTarget,
            his: session.clientRoutines[ids[1]].exercises[0].repsTarget,
            sharedIds: session.clientRoutines[ids[0]].exercises.some((item) =>
              session.clientRoutines[ids[1]].exercises.some((other) => other.id === item.id),
            ),
          };
        }""",
        [JANE, JOHN],
    )
    assert diverged["his"] == 99
    assert diverged["hers"] != 99
    assert diverged["sharedIds"] is False


def test_the_control_says_it_copies_to_another_client_of_this_session(
    page, local_server
):
    """The old words, 'Copy this plan to…', promised a choice of day. It gives the plan to
    another client of the same session."""
    _mount(page, local_server)
    page.click("#btn-session-menu")

    expect(page.locator("#btn-copy-plan")).to_have_text(
        "Copy this plan to another client in this session"
    )


def test_a_session_with_one_client_offers_no_copy(page, local_server):
    """With nobody else in the session the control could only answer 'nobody'."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=[exercise_item("e1", "Back Squat")])
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-session-menu")
    page.wait_for_selector("#session-menu:not(.hidden)")

    expect(page.locator("#btn-copy-plan")).to_be_hidden()


def test_after_copying_the_app_says_to_whom(page, local_server):
    """Before, the menu closed and nothing said the copy had happened or to whom."""
    _mount(page, local_server)
    _open_copy_list(page)

    page.click("[data-copy-to='%s']" % JOHN)

    expect(page.locator("#copy-plan-targets [role=status]")).to_have_text(
        "Plan copied to John Smith"
    )
