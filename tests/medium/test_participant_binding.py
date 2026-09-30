# tests/medium/test_participant_binding.py
# Several participants on ONE plan, in the clipboard.
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


def test_two_clients_who_share_a_first_name_are_told_apart_on_their_tabs(
    page, local_server
):
    """A tab showed only the first word of the name, so "Jane Doe" and "Jane Novak" were both
    "Jane", and a set logged on the wrong one goes to the wrong person without a trace."""
    page.set_viewport_size({"width": 390, "height": 844})
    rename = (
        "state.clients.find((client) => client.id === '%s').name = 'Jane Novak';\n"
        "renderActiveGroupBoard();\n" % JOHN
    )
    load_with_stub(
        page,
        local_server,
        clipboard_stub(_two_participant_session(), extra_body=rename),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")

    names = page.locator(".client-tab-participant .client-tab-name").all_inner_texts()
    assert sorted(name.strip() for name in names) == ["Jane D.", "Jane N."], names


def test_the_control_says_which_way_it_will_go(page, local_server):
    """Bound, the row still read "Everyone on this plan", so the way back was a row that said the
    opposite of what it would do."""
    _mount(page, local_server)
    row = page.locator("#btn-bind-participants")
    assert "Everyone on this plan" in row.inner_text()

    _bind(page)
    assert "Give everyone their own plan" in row.inner_text()

    _bind(page)
    assert "Everyone on this plan" in row.inner_text()


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


# Each client with an injury and a last session of their own.
BOTH_INJURED_WITH_HISTORY = """
for (const [id, injury] of [['%s', 'Left shoulder'], ['%s', 'Right knee']]) {
  Object.assign(state.clients.find((client) => client.id === id), { hasInjury: true, injury });
  state.history.push({
    id: 'h-' + id, clientId: id, routineName: 'Lower Body', date: '2026-07-20T17:30:00',
    exercises: [{ id: 'p-' + id, type: 'exercise', name: 'Back Squat', completed: true,
      loadUnit: 'kg', metric: 'reps', modality: 'strength',
      sets: [{ reps: 8, weight: 60, completed: true }] }],
    feedback: [],
  });
}
renderActiveGroupBoard();
""" % (JANE, JOHN)


def test_one_plan_for_several_names_lists_each_injury_under_its_name(
    page, local_server
):
    """Bound to one plan, the group showed one injury, the tapped client's and unnamed: a trainer
    could apply one person's limit to another and miss the rest. Each member's injury is listed,
    under the client's name.

    It also showed one "Last time" row, with the same defect, and that half of this test is gone:
    the clipboard's card stack stopped carrying past sessions on 2026-09-30, so there is no surface
    left that shows a bound group's last sessions at all. The gap is written down where open work
    lives; it is not covered here, because nothing draws it."""
    page.set_viewport_size({"width": 390, "height": 844})
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            _two_participant_session(), extra_body=BOTH_INJURED_WITH_HISTORY
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    _bind(page)

    lines = page.locator("#clipboard-client-notes-text .client-caveat-line")
    expect(lines).to_have_count(2)
    assert sorted(lines.all_inner_texts()) == [
        "Jane Doe: Left shoulder",
        "John Smith: Right knee",
    ]
