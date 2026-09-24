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


def _stub(exercises_js):
    return view_stub(
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
  exercises: EXERCISES_JS,
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
  // The controller reads the state WHEN a handler runs, not when it was wired (TODO §40.3).
  getState: () => state,
  t,
  saveToLocalStorage: noop,
  populateDropdownSelectors: noop,
  navigateToPath,
  urlFor: (name) => `/${name}`,
});
""".replace("EXERCISES_JS", exercises_js),
    )


STUB = _stub("structuredClone(DEFAULT_EXERCISES)")
# A working database as a trainer has it: no exercise stored at all (TODO §45.5).
EMPTY_STUB = _stub("[]")


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

    page.click(".filter-chips[data-axis='category'] .chip[data-filter='Chest']")
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
        page.locator(".filter-chips[data-axis='category'] .chip.active").get_attribute(
            "data-filter"
        )
        == "Chest"
    )
    assert page.locator("#view-exercises .exercise-item").count() == chest_only, (
        "the list must still show what the visible chip says, not the whole catalog"
    )


def _create_own_exercise(page, name):
    page.click("#btn-add-exercise")
    page.wait_for_selector("#dialog-exercise[open]")
    page.fill("#exercise-name", name)
    page.select_option("#exercise-category", "Shoulders")
    page.select_option("#exercise-equipment", "Barbell")
    page.select_option("#exercise-pattern", "Vertical Push")
    page.locator("#form-exercise button[type='submit']").click()
    page.wait_for_selector("#dialog-exercise", state="hidden")


def test_an_empty_database_still_shows_the_librept_catalog(page, local_server):
    """The catalog is read from code, so a trainer's own workspace — which stores no exercise until
    they add one — still has a library to pick from. It used to be empty outside the sandbox."""
    load_with_stub(page, local_server, EMPTY_STUB)
    page.wait_for_selector("#view-exercises.active")

    catalog_size = page.evaluate(
        "async () => (await import('./data/index.js')).DEFAULT_EXERCISES.length"
    )
    assert page.locator("#view-exercises .exercise-item").count() == catalog_size


def test_source_filter_separates_and_marks_the_trainers_own(page, local_server):
    """Mine shows only what the trainer added, each with the pencil and the word; LibrePT shows the
    catalog, unmarked. The mark is a word as well as a glyph because a phone has no hover."""
    load_with_stub(page, local_server, EMPTY_STUB)
    page.wait_for_selector("#view-exercises.active")
    _create_own_exercise(page, "Landmine Press")

    page.click(".filter-chips[data-axis='source'] .chip[data-filter='own']")
    cards = page.locator("#view-exercises .exercise-item")
    assert cards.count() == 1
    assert cards.first.locator("h3").text_content() == "Landmine Press"
    mark = cards.first.locator(".taxonomy-badge-source")
    assert mark.locator("i.fa-pencil").count() == 1
    assert mark.text_content().strip() == "Mine"

    page.click(".filter-chips[data-axis='source'] .chip[data-filter='librept']")
    catalog_size = page.evaluate(
        "async () => (await import('./data/index.js')).DEFAULT_EXERCISES.length"
    )
    assert cards.count() == catalog_size
    assert page.locator("#view-exercises .taxonomy-badge-source").count() == 0


LIBRARY_FILE = """{
  "format": "librept.library/1",
  "source": "Ana Novak",
  "exercises": ["Sled Push", "Barbell Bench Press", {"muscle": "Legs"}],
  "circuits": [{"rounds": 3, "exercises": [{"name": "Sled Push", "reps": 20}, "Push-Ups"]}]
}"""


def test_import_reviews_first_then_adds_under_its_source(page, local_server):
    """TODO §45.5: the report comes before the write — what is new, what the library already has,
    what could not be read — and the library then opens on the imported source, each exercise
    marked with its name. A circuit with no name is given one from its first two exercises."""
    load_with_stub(page, local_server, EMPTY_STUB)
    page.wait_for_selector("#view-exercises.active")
    page.click("#btn-import-library")
    page.wait_for_selector("#dialog-library-import[open]")
    page.fill("#library-import-text", LIBRARY_FILE)

    report = page.locator("#library-import-report")
    assert "New exercises: 1. New circuits: 1." in report.text_content()
    assert "Barbell Bench Press" in report.text_content()
    assert "Entries that could not be read: 1" in report.text_content()
    assert page.locator("#library-import-source").input_value() == "Ana Novak"
    assert page.evaluate("() => window.__state.exercises.length") == 0, (
        "nothing may be written before Add to library"
    )

    page.click("#library-import-add")
    page.wait_for_selector("#dialog-library-import", state="hidden")
    active = page.locator(".filter-chips[data-axis='source'] .chip.active")
    assert active.text_content() == "Ana Novak"
    cards = page.locator("#view-exercises .exercise-item")
    assert cards.count() == 1
    mark = cards.first.locator(".taxonomy-badge-source")
    assert mark.locator("i.fa-file-import").count() == 1
    assert mark.text_content().strip() == "Ana Novak"

    circuits = page.evaluate("() => window.__state.circuits")
    assert [c["name"] for c in circuits] == ["Circuit — Sled Push, Push-Ups"]
    assert circuits[0]["series"] == 3
    assert circuits[0]["source"] == "Ana Novak"


def test_import_with_multiple_sources_keeps_all_new_exercises_visible(
    page, local_server
):
    load_with_stub(page, local_server, _stub("[{id: 'mine', name: 'My movement'}]"))
    page.click("#btn-import-library")
    page.fill(
        "#library-import-text",
        """{
      "exercises": [{"name": "Sled Push", "source": "Ana"},
                    {"name": "Sandbag Carry", "source": "Boris"}]
    }""",
    )
    page.click("#library-import-add")
    page.wait_for_selector("#dialog-library-import", state="hidden")
    names = page.locator("#view-exercises .exercise-item h3").all_text_contents()
    assert "Sled Push" in names
    assert "Sandbag Carry" in names
    assert (
        page.locator(".filter-chips[data-axis='source'] .chip.active").text_content()
        == "All"
    )
