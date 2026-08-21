# tests/medium/test_exercise_catalog.py
# The exercise catalog view (modules/exercises/exercisesView.js) as a professional movement
# taxonomy rather than a beginner encyclopedia (TODO §13 / UC6): cards carry equipment/pattern
# badges instead of instructional text, a cardio movement leads with a highlighted modality badge
# where a strength lift shows none, and custom-exercise creation forces the taxonomy fields so
# volume analytics stay clean (Scenario C).
#
# Collected here from the view-level halves of test_exercise_taxonomy.py and
# test_exercise_modality.py; the routine-builder tests in those files genuinely span views (picker
# → builder row) and stay in tests/e2e/. The whole controller is booted, not just the view render,
# because the search box and the create dialog are wired by exerciseFormsController — the same
# reason clients_directory wires its own input.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import { renderExercisesViewShell, renderExercisesList } from './modules/exercises/exercisesView.js';
import {
  setupExerciseForms,
  openExerciseCreateDialog,
} from './controllers/exerciseFormsController.js';
import { DEFAULT_EXERCISES } from './data/index.js';
""",
    view_id="exercises",
    body="""
const state = {
  lang: 'en',
  exercises: structuredClone(DEFAULT_EXERCISES),
  clients: [],
  routines: [],
  sessions: [],
  history: [],
};

renderExercisesViewShell();
renderExercisesList({ state, t });
// "Add exercise" navigates to the exercise.new route rather than opening the dialog directly, so
// the fake router opens it the way that route's enter() does — keeping the button's own wiring
// under test instead of reaching past it.
function navigateToPath(path) {
  if (path === '/exercise.new') openExerciseCreateDialog();
}

// Exposed so the persistence assertion can read what the controller actually wrote, the same
// fact the e2e original read out of stateStore.
window.__state = state;

setupExerciseForms({
  state,
  t,
  saveToLocalStorage: noop,
  populateDropdownSelectors: noop,
  navigateToPath,
  urlFor: (name) => `/${name}`,
});
""",
)


def test_catalog_shows_taxonomy_badges_not_instructions(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-exercises.active")

    assert page.locator("#view-exercises .taxonomy-badge").count() > 0, (
        "exercise cards should show equipment/pattern taxonomy badges"
    )
    assert page.locator("#view-exercises .exercise-instructions").count() == 0, (
        "instructional text should be gone from the professional taxonomy view"
    )


def test_catalog_marks_cardio_with_a_modality_badge(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-exercises.active")

    # A seeded cardio erg leads with a modality badge; a strength lift shows none.
    page.fill("#search-exercises", "Assault Bike")
    page.wait_for_timeout(200)
    assert page.locator("#view-exercises .taxonomy-badge-modality").count() >= 1, (
        "a cardio movement should carry a highlighted modality badge in the catalog"
    )

    page.fill("#search-exercises", "Barbell Bench Press")
    page.wait_for_timeout(200)
    assert page.locator("#view-exercises .taxonomy-badge-modality").count() == 0, (
        "a strength movement should not carry a modality badge"
    )


def test_custom_exercise_requires_taxonomy(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-exercises.active")

    page.click("#btn-add-exercise")
    page.wait_for_selector("#dialog-exercise[open]")

    # Strict inheritance (Scenario C): equipment + movement pattern are mandatory.
    assert (
        page.evaluate("() => document.getElementById('exercise-equipment').required")
        is True
    )
    assert (
        page.evaluate("() => document.getElementById('exercise-pattern').required")
        is True
    )
    # Options are seeded canonical taxonomy enums.
    assert page.locator("#exercise-equipment option[value='Barbell']").count() == 1
    assert page.locator("#exercise-pattern option[value='Hinge']").count() == 1


def test_create_cardio_exercise_reveals_metric_and_persists(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-exercises.active")

    page.click("#btn-add-exercise")
    page.wait_for_selector("#dialog-exercise[open]")

    # The cardio metric selector is hidden until the modality is set to cardio.
    assert page.locator("#exercise-metric-group").evaluate(
        "el => el.classList.contains('hidden')"
    ), "the cardio metric field should start hidden"

    page.fill("#exercise-name", "Test Rower Sprint")
    page.select_option("#exercise-category", "Cardio")
    page.select_option("#exercise-equipment", "Machine")
    page.select_option("#exercise-pattern", "Conditioning")
    page.select_option("#exercise-modality", "cardio")
    page.wait_for_timeout(100)
    assert not page.locator("#exercise-metric-group").evaluate(
        "el => el.classList.contains('hidden')"
    ), "choosing cardio should reveal the metric selector"

    page.select_option("#exercise-metric", "distance")
    page.locator("#form-exercise button[type='submit']").click()
    page.wait_for_timeout(200)

    # The e2e original read this back out of stateStore; the controller writes into the state
    # object it was handed, which is the same contract without needing IndexedDB to observe it.
    saved = page.evaluate(
        "() => window.__state.exercises.find((e) => e.name === 'Test Rower Sprint') || null"
    )
    assert saved is not None, "the custom cardio exercise should persist to the store"
    assert saved["modality"] == "cardio"
    assert saved["metric"] == "distance"


def test_filter_survives_a_re_render_it_did_not_trigger(page, local_server):
    """The chip and the search box ARE the filter — no copy of it lives in state, so any re-render
    with no filter arguments (adding an exercise, switching language, restoring a backup) must read
    them back. It used to show the whole catalog under a chip that still said Chest."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-exercises.active")

    page.click(".filter-chips .chip[data-filter='Chest']")
    page.wait_for_timeout(200)
    chest_only = page.locator("#view-exercises .exercise-item").count()
    assert chest_only > 0, (
        "the seeded catalog should hold chest movements to filter down to"
    )

    # Creating an exercise re-renders the list through the controller, passing no filter.
    page.click("#btn-add-exercise")
    page.wait_for_selector("#dialog-exercise[open]")
    page.fill("#exercise-name", "Test Rower Sprint")
    page.select_option("#exercise-category", "Cardio")
    page.select_option("#exercise-equipment", "Machine")
    page.select_option("#exercise-pattern", "Conditioning")
    page.locator("#form-exercise button[type='submit']").click()
    page.wait_for_timeout(200)

    assert (
        page.locator(".filter-chips .chip.active").get_attribute("data-filter")
        == "Chest"
    )
    assert page.locator("#view-exercises .exercise-item").count() == chest_only, (
        "the list must still show what the visible chip says, not the whole catalog"
    )
