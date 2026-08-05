# tests/medium/test_routine_builder.py
# The routine builder's movement picker (TODO §13 / UC6, Scenario A): the builder drops standardized
# movement IDs through a filtered picker rather than free text, and each dropped row authors its
# metrics per the movement's MODALITY — a cardio movement hides the load axis and relabels the
# primary field to its effort metric, at parity with the inline clipboard editor (TODO §17.1).
#
# These lived in tests/e2e/test_exercise_taxonomy.py under a header claiming they "span views".
# That claim was wrong: #routine-ex-picker and #routine-exercises-list are both rendered by
# routineFormsController inside the routines view, so this is one view plus its controller — the
# same shape as test_exercise_catalog.py.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { renderRoutinesViewShell, renderRoutinesList } from './modules/plans/plansView.js';
import {
  setupRoutineForms,
  openRoutineCreateDialog,
} from './controllers/routineFormsController.js';
import { DEFAULT_EXERCISES, DEFAULT_ROUTINES } from './data/index.js';
""",
    view_id="routines",
    body="""
const state = {
  lang: 'en',
  exercises: structuredClone(DEFAULT_EXERCISES),
  routines: structuredClone(DEFAULT_ROUTINES),
  clients: [],
  sessions: [],
  history: [],
};

// "New routine" navigates to the routine.new route rather than opening the dialog directly, so the
// fake router does what that route's enter() does — keeping the button's own wiring under test.
function navigateToPath(path) {
  if (path === '/routine.new') openRoutineCreateDialog();
}

renderRoutinesViewShell();
renderRoutinesList({ state, t, openWorkoutSetupModal: noop });
setupRoutineForms({
  state,
  t,
  saveToLocalStorage: noop,
  populateDropdownSelectors: noop,
  openWorkoutSetupModal: noop,
  navigateToPath,
  urlFor: (name) => `/${name}`,
});
""",
)


def test_routine_builder_picker_drops_a_movement(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-routines.active")

    page.click("#btn-add-routine")
    page.wait_for_selector("#routine-ex-picker:not(.hidden)")
    page.wait_for_timeout(150)

    # The picker offers filter chips over a single-tap movement list.
    assert (
        page.locator("#routine-ex-picker .picker-chips[data-axis='equipment']").count()
        == 1
    )
    assert page.locator("#routine-ex-picker .picker-item").count() > 0
    assert page.locator("#routine-exercises-list > *").count() == 0

    page.locator("#routine-ex-picker .picker-item").first.click()
    page.wait_for_timeout(200)
    assert page.locator("#routine-exercises-list > *").count() == 1, (
        "tapping a movement should drop a configured row into the template"
    )


def test_routine_builder_row_is_modality_aware(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-routines.active")

    page.click("#btn-add-routine")
    page.wait_for_selector("#routine-ex-picker:not(.hidden)")
    page.locator("#routine-ex-picker .picker-item").first.click()
    page.wait_for_timeout(150)

    row = page.locator("#routine-exercises-list .routine-builder-row").first
    load_cell = row.locator(".load-cell")
    reps = row.locator(".input-reps")

    # Cardio (Assault Bike, metric=calories): load axis hidden, primary field relabeled to the metric.
    row.locator(".select-ex").select_option("e41d5e6f")
    page.wait_for_timeout(100)
    assert "hidden" in (load_cell.get_attribute("class") or ""), (
        "a cardio movement carries no external load, so the load field must hide"
    )
    assert reps.get_attribute("placeholder") == "cal", (
        "the primary field must relabel to the cardio effort metric"
    )
