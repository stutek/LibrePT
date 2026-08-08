# tests/e2e/test_record_dialog_routes.py
# The record editors (routine create/edit, exercise create, the adjustment wizard) are routes, so a
# link opens the record in context, Back backs out, and a reload reopens the form instead of dropping
# the trainer on a list. Each opens over ITS OWN list view — a dialog is never the whole screen.
#
# The one that is easy to get wrong: saving. The submit handler closes the dialog itself, and the
# router's close hook turns that into a history pop — exactly one, or Back would skip a screen.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


import pytest


# Opt this module's tests onto the pooled, storage-reset page (tests/conftest.py's `deeplink_page`)
# instead of a fresh browser context each. Overriding `page` MODULE-LOCALLY keeps every test
# signature and every autouse fixture exactly as they were, and leaves the rest of the suite on the
# default fresh-context path. These tests qualify because each starts by navigating to a URL cold
# and asserts on what the router does with it — none depends on state left by the one before.
@pytest.fixture
def page(deeplink_page):
    return deeplink_page


def _path(page):
    return page.evaluate("() => location.pathname")


def _goto_routines(page, local_server):
    page.goto(local_server + "routines")
    page.wait_for_selector("#view-routines.active")
    page.wait_for_timeout(300)


def test_routine_card_opens_an_addressable_editor(page, local_server):
    _goto_routines(page, local_server)
    page.locator(".routine-card").first.click()
    page.wait_for_selector("#dialog-routine[open]")

    path = _path(page)
    assert path.rsplit("/", 2)[-2] == "routines", f"not a routine route: {path}"
    assert page.locator("#routine-form-id").input_value(), (
        "the editor opened on no record"
    )


def test_routine_editor_deeplink_reopens_with_the_record_loaded(page, local_server):
    _goto_routines(page, local_server)
    page.locator(".routine-card").first.click()
    page.wait_for_selector("#dialog-routine[open]")
    routine_id = page.locator("#routine-form-id").input_value()
    name = page.locator("#routine-name").input_value()

    page.reload()
    page.wait_for_selector("#dialog-routine[open]")
    assert page.locator("#routine-form-id").input_value() == routine_id
    assert page.locator("#routine-name").input_value() == name
    # The list is painted behind it.
    page.wait_for_selector("#view-routines.active")


def test_back_closes_the_routine_editor(page, local_server):
    _goto_routines(page, local_server)
    page.locator(".routine-card").first.click()
    page.wait_for_selector("#dialog-routine[open]")

    page.go_back()
    page.wait_for_selector("#dialog-routine", state="hidden")
    assert _path(page).endswith("/routines")


def test_new_routine_is_its_own_route(page, local_server):
    _goto_routines(page, local_server)
    page.locator("#btn-add-routine").click()
    page.wait_for_selector("#dialog-routine[open]")

    assert _path(page).endswith("/routines/new")
    assert page.locator("#routine-form-id").input_value() == "", (
        "the create form opened on a record"
    )


def test_saving_pops_exactly_one_history_entry(page, local_server):
    """Save closes the dialog; the close hook pops. Two pops would skip the list entirely."""
    _goto_routines(page, local_server)
    page.locator("#btn-add-routine").click()
    page.wait_for_selector("#dialog-routine[open]")

    page.locator("#routine-name").fill("Deep-link smoke routine")
    # A routine must carry at least one exercise, or submit alerts and returns.
    page.locator("#routine-ex-picker .picker-item").first.click()
    page.wait_for_selector(".routine-builder-row")
    page.locator("#form-routine button[type='submit']").click()
    page.wait_for_selector("#dialog-routine", state="hidden")
    page.wait_for_timeout(400)

    assert _path(page).endswith("/routines"), (
        f"save left the dialog's URL behind: {_path(page)}"
    )
    # One more Back leaves the routines list — proof the save popped once, not twice.
    page.go_back()
    page.wait_for_timeout(400)
    assert not _path(page).endswith("/routines")


def test_new_exercise_is_its_own_route(page, local_server):
    page.goto(local_server + "exercises")
    page.wait_for_selector("#view-exercises.active")
    page.locator("#btn-add-exercise").click()
    page.wait_for_selector("#dialog-exercise[open]")
    assert _path(page).endswith("/exercises/new")

    page.go_back()
    page.wait_for_selector("#dialog-exercise", state="hidden")
    assert _path(page).endswith("/exercises")


def test_adjustment_wizard_is_addressable(page, local_server):
    page.goto(local_server + "adjustments")
    page.wait_for_selector("#view-adjustments.active")
    page.wait_for_timeout(300)
    page.locator(".btn-resolve-alert").first.click()
    page.wait_for_selector("#dialog-apply-adjustment[open]")

    path = _path(page)
    assert "/adjustments/" in path, f"the wizard is not addressable: {path}"

    page.reload()
    page.wait_for_selector("#dialog-apply-adjustment[open]")
    assert _path(page) == path
    page.wait_for_selector("#view-adjustments.active")
