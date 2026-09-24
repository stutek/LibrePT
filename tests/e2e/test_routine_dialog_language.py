# tests/e2e/test_routine_dialog_language.py
# The Routine Template dialog (src/controllers/routineFormsController.js) and the exercise rows it
# builds on every open (src/modules/plans/plansView.js) speak the chosen language (TODO §38.20). The
# rows are built after the markup's translation pass, so they are checked separately.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from playwright.sync_api import expect

from tests.e2e.test_client_views_language import _expect_slovenian, _slovenian

ROUTINE_DIALOG = {
    "#routine-modal-title": "create_routine_title",
    "label[for='routine-name']": "routine_name",
    "#dialog-routine .section-sub-title h4": "routine_exercises_heading",
    "#dialog-routine .modal-cancel": "btn_cancel",
}


def test_the_routine_dialog_is_in_slovenian_when_slovenian_is_chosen(
    page, local_server
):
    page.goto(local_server + "routines?lang=sl")
    page.locator("#btn-add-routine").click()
    page.wait_for_selector("#routine-ex-picker:not(.hidden)")

    _expect_slovenian(page, ROUTINE_DIALOG)
    # A row, built by code after the translation pass.
    page.locator("#routine-ex-picker .picker-item").first.click()
    [rest] = _slovenian(page, ["routine_row_rest"])
    expect(page.locator("#routine-exercises-list .input-rest").first).to_have_attribute(
        "placeholder", rest
    )
