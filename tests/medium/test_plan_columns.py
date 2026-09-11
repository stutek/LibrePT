# tests/medium/test_plan_columns.py
# Several participants' programmes edited side by side while PLANNING (TODO §41.0).
#
# The COUNT rule is arithmetic and is pinned in tests/unit_js/modules/clipboard/planColumns.test.mjs.
# What needs a browser is the branch itself: that width and plan mode together decide whether the
# board paints columns or the single editor it has always painted, and that a LIVE session never
# gets them — which is a safety property, not a layout preference, and the kind that a later tidy-up
# would remove without noticing.
# Mounted via tests/medium/_harness.py's clipboard_stub; fixtures come from tests/conftest.py.

import json

import pytest

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
    open_plan_editor,
)

pytestmark = pytest.mark.clean_start

JANE = "c1a9f0e2"
JOHN = "c2b8e1d3"

# Wide enough for three columns of 330px, which is what a desk actually offers.
DESK = {"width": 1280, "height": 900}
PHONE = {"width": 390, "height": 844}


def _session(*, planning):
    """Two participants with a programme each. `planning` is the only difference that decides
    whether columns are allowed: `currentPlanMode()` reads `sourceSession.isPlanning`."""
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
        "routineName": "John's programme",
        "clientName": "John Smith",
        "activeExerciseIndex": 0,
        "deckAllCollapsed": False,
        "exercises": [exercise_item("j1", "Treadmill Run")],
        "logs": {},
    }
    session["sourceSession"] = {"isPlanning": True} if planning else None
    return json.dumps(session).replace('"startTime": 0', '"startTime": Date.now()')


def _mount(page, local_server, *, planning, viewport):
    page.set_viewport_size(viewport)
    load_with_stub(page, local_server, clipboard_stub(_session(planning=planning)))
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    open_plan_editor(page)


def test_planning_at_desk_width_edits_both_programmes_at_once(page, local_server):
    """The reason the whole thing exists: building a group session is where "the same for everyone,
    except Ana's knee" is decided, and that decision wants the programmes side by side."""
    _mount(page, local_server, planning=True, viewport=DESK)

    columns = page.locator(".plan-column")
    assert columns.count() == 2, (
        "one column per participant, as many as the width allows"
    )

    # Read from the FIELDS: a movement's name lives in an editable input, so the column's text
    # content does not contain it — an assertion on inner_text would pass on an empty editor.
    names = page.eval_on_selector_all(
        ".plan-column",
        """cols => cols.map((c) =>
             [...c.querySelectorAll('.editor-row-name')].map((i) => i.value))""",
    )
    assert "Back Squat" in names[0], names
    assert "Treadmill Run" in names[1], (
        f"the second column is the OTHER participant's plan, not a copy of the first: {names}"
    )


def test_one_shared_list_of_exercise_names_not_one_per_column(page, local_server):
    """The editor renders its own `<datalist>` under a fixed id. Several editors would put several
    elements under that id in one document, and `list=` then resolves to whichever came first — so
    the columns render the list once and hand every editor its id."""
    _mount(page, local_server, planning=True, viewport=DESK)

    assert page.locator("#active-exercise-scroll-deck datalist").count() == 1
    lists = page.eval_on_selector_all(
        ".plan-column .editor-row-name", "els => els.map((e) => e.getAttribute('list'))"
    )
    assert lists, "the rows are there to check"
    assert len(set(lists)) == 1, f"every row points at the same list, got {set(lists)}"


def test_a_phone_gets_one_programme_however_many_participants(page, local_server):
    """Columns are what the width allows. On a phone it allows one, and the board falls through to
    the single editor it has always painted."""
    _mount(page, local_server, planning=True, viewport=PHONE)

    assert page.locator(".plan-column").count() == 0
    assert page.locator(".clipboard-editor").count() == 1


def test_a_live_session_never_gets_columns_however_wide_the_screen(page, local_server):
    """A safety property rather than a layout preference (TODO §41.0, and §41.4 which argued it).
    The live clipboard is where sets and quick signals are WRITTEN, and one participant per screen
    with thumb-sized targets is what keeps a mis-tap from logging against the wrong client. A plan
    is not a log."""
    _mount(page, local_server, planning=False, viewport=DESK)

    assert page.locator(".plan-column").count() == 0
    assert page.locator(".clipboard-editor").count() == 1
