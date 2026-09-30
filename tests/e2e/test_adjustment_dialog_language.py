# tests/e2e/test_adjustment_dialog_language.py
# The Apply Program Adjustment dialog (src/modules/plans/planAdjustments.js) speaks the language the
# trainer chose. Opened the way tests/e2e/test_record_dialog_routes.py opens it.
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


def test_swapping_an_exercise_starts_with_no_replacement_chosen(page, local_server):
    """The list is alphabetical, so a pre-chosen first entry put a Barbell Back Squat into the
    programme of a client with a sore knee on one tap. Nothing is chosen until the trainer taps a
    movement, and Apply stays disabled until then."""
    page.goto(local_server + "adjustments?lang=sl")
    page.wait_for_selector("#view-adjustments.active")
    page.locator(".btn-resolve-alert").first.click()
    page.wait_for_selector("#dialog-apply-adjustment[open]")
    page.select_option("#adjust-action-type", "swap")
    page.wait_for_selector("#adjust-swap-picker .picker-item")

    apply = page.locator("#form-apply-adjustment button[type=submit]")
    assert page.locator("#adjust-swap-picker .picker-item.selected").count() == 0
    assert page.input_value("#adjust-exercise-swap") == ""
    assert apply.is_disabled()
    assert page.locator("#adjust-swap-needed").is_visible()

    page.locator("#adjust-swap-picker .picker-item").first.click()
    assert apply.is_enabled()
    assert not page.locator("#adjust-swap-needed").is_visible()

    page.select_option("#adjust-action-type", "modify")
    assert apply.is_enabled()
