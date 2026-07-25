# tests/e2e/test_exercise_taxonomy.py
# The exercise catalog is a professional movement taxonomy, not a beginner encyclopedia (TODO §13 /
# UC6): the list shows equipment + pattern badges instead of instructions; the routine builder drops
# standardized movement IDs via a filtered picker (Scenario A); and custom-exercise creation forces
# a muscle group, equipment, and movement pattern so volume analytics stay clean (Scenario C).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _base(page):
    return page.evaluate("() => new URL(document.baseURI).pathname").rstrip("/")


def _nav(page, path):
    page.evaluate(
        "(p) => { window.history.pushState(null, '', p);"
        "         window.dispatchEvent(new PopStateEvent('popstate')); }",
        path,
    )
    page.wait_for_timeout(300)


def test_catalog_shows_taxonomy_badges_not_instructions(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/exercises")

    assert page.locator("#view-exercises .taxonomy-badge").count() > 0, (
        "exercise cards should show equipment/pattern taxonomy badges"
    )
    assert page.locator("#view-exercises .exercise-instructions").count() == 0, (
        "instructional text should be gone from the professional taxonomy view"
    )


def test_routine_builder_picker_drops_a_movement(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/routines")

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


def test_custom_exercise_requires_taxonomy(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/exercises")

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


def test_routine_builder_row_is_modality_aware(page, local_server):
    # The routine builder authors metrics per the selected movement's MODALITY, at parity with the
    # inline clipboard editor (TODO §17.1): a cardio movement hides the load axis and relabels the
    # primary field to its effort metric; switching to a strength movement restores reps + load.
    page.goto(local_server)
    page.wait_for_timeout(500)
    _nav(page, f"{_base(page)}/routines")

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

    # Strength (Barbell Bench Press): load axis returns, primary field is reps again.
    row.locator(".select-ex").select_option("e10a2b3c")
    page.wait_for_timeout(100)
    assert "hidden" not in (load_cell.get_attribute("class") or ""), (
        "a strength movement carries load, so the load field must show"
    )
    assert reps.get_attribute("placeholder") == "reps"
