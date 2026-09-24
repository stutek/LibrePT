# tests/e2e/test_adjustment_dialog_language.py
# The Apply Program Adjustment dialog (src/modules/plans/planAdjustments.js) speaks the language the
# trainer chose (TODO §38.20). Opened the way tests/e2e/test_record_dialog_routes.py opens it.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.e2e.test_client_views_language import _expect_slovenian

# Each control, and the key whose words it must show.
ADJUSTMENT_DIALOG = {
    "#dialog-apply-adjustment .modal-header h3": "adjust_title",
    "label[for='adjust-action-type']": "adjust_action_label",
    "#adjust-action-type option[value='swap']": "adjust_action_swap",
    "label[for='adjust-sets']": "adjust_target_sets",
    "#form-apply-adjustment button[type=submit]": "adjust_apply",
}


def test_the_adjustment_dialog_is_in_slovenian_when_slovenian_is_chosen(
    page, local_server
):
    page.goto(local_server + "adjustments?lang=sl")
    page.wait_for_selector("#view-adjustments.active")
    page.locator(".btn-resolve-alert").first.click()
    page.wait_for_selector("#dialog-apply-adjustment[open]")

    _expect_slovenian(page, ADJUSTMENT_DIALOG)
