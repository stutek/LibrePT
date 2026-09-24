# tests/e2e/test_exercise_dialog_language.py
# The Custom Exercise dialog (src/controllers/exerciseFormsController.js) speaks the language the
# trainer chose (TODO §38.20). The muscle, equipment and pattern options are taxonomy values and stay
# as stored; how an exercise is logged is the app's own wording, so those options are translated.
# E2E because the words reach the markup through the app's own translation pass.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from playwright.sync_api import expect

from tests.e2e.test_client_views_language import _expect_slovenian

# Each control, and the key whose words it must show.
EXERCISE_DIALOG = {
    "#dialog-exercise .modal-header h3": "create_exercise_title",
    "label[for='exercise-modality']": "modality_label",
    "#exercise-modality option[value='strength']": "modality_option_strength",
    "#dialog-exercise .modal-cancel": "btn_cancel",
    "#dialog-exercise button[type='submit']": "btn_save",
}


def test_the_exercise_dialog_is_in_slovenian_when_slovenian_is_chosen(
    page, local_server
):
    page.goto(local_server + "exercises?lang=sl")
    page.locator("#btn-add-exercise").click()
    expect(page.locator("#dialog-exercise")).to_be_visible()

    _expect_slovenian(page, EXERCISE_DIALOG)
