# tests/medium/test_participant_binding.py
# Several participants starting from ONE plan, in the clipboard.
#
# The rules are pinned without a browser in tests/unit_js/domain/participantBinding.test.mjs. What
# needs the DOM is the promise a trainer sees on the gym floor (ruled 2026-10-02): everyone in a group
# keeps their own tab, marked as grouped, because group members move through a session at their own
# speed and are logged one by one; changing one member's plan takes that member out of the group;
# and the whole thing is one control away from being undone.
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


def test_grouping_keeps_a_tab_for_each_member_and_marks_it(page, local_server):
    """Members of a group are not merged: each has their own tab, and the tab says they are grouped
    with a glyph and a word for a screen reader, not with colour alone."""
    _mount(page, local_server)

    _bind(page)

    tabs = page.locator("#active-session-client-tabs .client-tab-participant")
    expect(tabs).to_have_count(2)
    expect(page.locator(".client-tab-bound")).to_have_count(2)
    expect(page.locator(".client-tab-bound .client-tab-group-mark")).to_have_count(2)
    assert page.locator(".client-tab-bound .sr-only").all_inner_texts() == [
        "Together",
        "Together",
    ]


def test_a_set_logged_for_one_member_is_that_member_s_only(page, local_server):
    """They started from one plan, under the same item ids, and each logs their own sets."""
    _mount(page, local_server)
    _bind(page)

    seen = page.evaluate(
        """async (ids) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          const [jane, john] = ids.map((id) => session.clientRoutines[id]);
          jane.logs.e1 = [{ reps: 10, completed: true }];
          return {
            sameIds: jane.exercises.map((e) => e.id).join() === john.exercises.map((e) => e.id).join(),
            johnLogged: john.logs.e1.some((set) => set.completed),
          };
        }""",
        [JANE, JOHN],
    )

    assert seen == {"sameIds": True, "johnLogged": False}


def test_changing_one_member_s_plan_takes_that_member_out_of_the_group(
    page, local_server
):
    """Changed, the plan is no longer the one the others train, so the member leaves the group with
    the changed copy. With two members, that ends the group."""
    _mount(page, local_server)
    _bind(page)
    expect(page.locator(".client-tab-bound")).to_have_count(2)

    page.click("#btn-session-menu")
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.locator(".editor-row-name").first.fill("Front Squat")
    page.locator(".editor-row-name").first.dispatch_event("change")
    page.click("#btn-done-edit")

    expect(page.locator(".client-tab-bound")).to_have_count(0)
    names = page.evaluate(
        """async (ids) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          return ids.map((id) => session.clientRoutines[id].exercises[0].name);
        }""",
        [JANE, JOHN],
    )
    assert names == ["Front Squat", "Back Squat"], (
        "only the edited member's plan changed"
    )


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
    """A trainer who groups by mistake, or whose group splits mid-session, is one tap from no group
    — and the plans stay separate objects, each member's own."""
    _mount(page, local_server)
    _bind(page)

    _bind(page)

    assert page.locator(".client-tab-bound").count() == 0
    separate = page.evaluate(
        """async (ids) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          const session = ctrl.getActiveSession();
          const [jane, john] = ids.map((id) => session.clientRoutines[id]);
          jane.logs.e2 = [{ reps: 8, completed: true }];
          return jane !== john && !(john.logs.e2 || []).some((set) => set.completed);
        }""",
        [JANE, JOHN],
    )
    assert separate is True


# Each client with an injury and a last session of their own.
BOTH_INJURED_WITH_HISTORY = """
const { recordTrainings } = await import('./data/trainingRecords.js');
for (const [id, injury] of [['%s', 'Left shoulder'], ['%s', 'Right knee']]) {
  Object.assign(state.clients.find((client) => client.id === id), { hasInjury: true, injury });
  recordTrainings(state, [{
    id: 'h-' + id, clientId: id, routineName: 'Lower Body', date: '2026-07-20T17:30:00',
    exercises: [{ id: 'p-' + id, type: 'exercise', name: 'Back Squat', completed: true,
      loadUnit: 'kg', metric: 'reps', modality: 'strength',
      sets: [{ reps: 8, weight: 60, completed: true }] }],
    feedback: [],
  }]);
}
renderActiveGroupBoard();
""" % (JANE, JOHN)


def test_each_member_s_tab_shows_that_member_s_injury(page, local_server):
    """Grouped, the members kept one tab and the banner listed every member's injury under their
    name. Each member now has their own tab again, so the banner shows the injury of the client on
    screen, and switching the tab switches it."""
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

    banner = page.locator("#clipboard-client-notes-text")
    expect(banner).to_have_text("Left shoulder")
    # The harness mounts no router, so the tab's navigation is done the way the router does it.
    page.evaluate(
        """async (john) => {
          const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
          ctrl.getActiveSession().activeClientId = john;
          ctrl.renderActiveGroupBoard();
        }""",
        JOHN,
    )
    expect(banner).to_have_text("Right knee")
