# tests/e2e/test_picker_empty_search.py
# The exercise picker of the plan editor (modules/exercises/exercisePicker.js): a typed search that
# finds nothing offers to add that name as a new exercise, or to import a larger library.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

PICKER = "#routine-ex-picker"


def _open_picker(page, local_server):
    page.goto(local_server + "routines")
    page.locator("#btn-add-routine").click()
    page.wait_for_selector(f"{PICKER}:not(.hidden)")


def test_a_search_with_no_match_adds_the_typed_name_and_picks_it(page, local_server):
    _open_picker(page, local_server)
    page.locator(f"{PICKER} .picker-search").fill("zzz kettlebell swing")
    add = page.locator(f"{PICKER} [data-empty-action='create']")
    assert add.inner_text() == 'Add "zzz kettlebell swing" as a new exercise'
    assert add.evaluate("b => b.getBoundingClientRect().height") >= 44

    add.click()
    page.wait_for_selector("#dialog-exercise[open]")
    assert page.input_value("#exercise-name") == "zzz kettlebell swing"
    page.click("#dialog-exercise button[type='submit']")
    page.wait_for_selector("#dialog-exercise", state="hidden")

    # Found by the same search, and already in the routine without a second tap.
    assert page.locator(f"{PICKER} .picker-item").count() == 1
    assert page.locator("#routine-exercises-list > *").count() == 1
    assert page.locator(f"{PICKER} [data-empty-action]").count() == 0


def test_the_import_button_opens_the_import_dialog(page, local_server):
    _open_picker(page, local_server)
    page.locator(f"{PICKER} .picker-search").fill("zzz burpee")
    page.locator(f"{PICKER} [data-empty-action='import']").click()
    page.wait_for_selector("#dialog-library-import[open]")


def test_filters_alone_that_match_nothing_offer_neither(page, local_server):
    _open_picker(page, local_server)
    # Cardio and Barbell: no movement is both, and nothing was typed.
    page.locator(
        f"{PICKER} .picker-chips[data-axis='muscle'] .chip", has_text="Cardio"
    ).click()
    page.locator(
        f"{PICKER} .picker-chips[data-axis='equipment'] .chip", has_text="Barbell"
    ).click()
    assert page.locator(f"{PICKER} .picker-item").count() == 0
    assert page.locator(f"{PICKER} .picker-empty").count() == 1
    assert page.locator(f"{PICKER} [data-empty-action]").count() == 0
