# tests/medium/test_plan_fits_slot.py
# "Does this fit in the hour?", answered while the plan is still being built (TODO §35.3b).
#
# The arithmetic is pinned without a browser in tests/unit_js/domain/planDuration.test.mjs. What
# needs the DOM is where the answer appears and when it shuts up: beside the plan being edited,
# marked when the plan is over its slot, and absent when there is no slot to be over.
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

METER = ".editor-plan-fit"


def _mount(page, local_server, *, exercises, slot="18:00 - 19:00"):
    page.set_viewport_size({"width": 390, "height": 844})
    session = active_session_fixture(
        exercises=exercises,
        sourceSession={"id": "s1", "timeLabel": slot} if slot else None,
    )
    load_with_stub(page, local_server, clipboard_stub(session))
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    open_plan_editor(page)
    page.wait_for_selector(".clipboard-editor")


def test_a_trainer_building_a_plan_can_see_whether_it_fits(page, local_server):
    _mount(
        page,
        local_server,
        exercises=[
            {**exercise_item("e1", "Back Squat"), "setsTargetCount": 4},
            {**exercise_item("e2", "Bench Press"), "setsTargetCount": 4},
        ],
    )

    expect(page.locator(METER)).to_be_visible()
    expect(page.locator(METER)).to_contain_text("60 min")


def test_a_plan_over_its_slot_says_so(page, local_server):
    """The number a trainer scans for is not "45", it is whether the evening runs over."""
    _mount(
        page,
        local_server,
        exercises=[
            {**exercise_item(f"e{i}", f"Movement {i}"), "setsTargetCount": 5}
            for i in range(20)
        ],
    )

    meter = page.locator(METER)
    expect(meter).to_be_visible()
    colour = page.evaluate(
        "() => getComputedStyle(document.querySelector('.editor-plan-fit')).color"
    )
    plain = page.evaluate(
        "() => getComputedStyle(document.querySelector('.editor-list')).color"
    )
    assert colour != plain, (
        "an over-running plan has to look different from one that fits"
    )


def test_a_programme_with_no_slot_is_not_judged_against_one(page, local_server):
    """A planning programme has no time at all, and a meter there would report a problem that does
    not exist."""
    _mount(page, local_server, exercises=[exercise_item("e1", "Back Squat")], slot=None)

    assert page.locator(METER).count() == 0
