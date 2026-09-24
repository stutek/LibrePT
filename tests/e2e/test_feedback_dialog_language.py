# tests/e2e/test_feedback_dialog_language.py
# The feedback dialog a trainer opens from a live clipboard card (src/modules/common/feedbackModal.js)
# speaks the language the trainer chose (TODO §38.20). The five feedback choices are stored in English
# and shown so elsewhere, so they are not part of this promise.
# Opened the way tests/e2e/test_gym_note_kept_on_record.py opens it, with `?lang=sl` in the address.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.e2e.test_client_views_language import _expect_slovenian

OPEN_ONE_EXERCISE = """async () => {
    const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    ctrl.openSessionFromHistory({
        id: 'language-log', clientId: store.getState().clients[0].id, routineName: 'Language Test',
        date: new Date().toISOString(), duration: 0,
        exercises: [{ id: 'exA', type: 'exercise', name: 'Barbell Row',
                      sets: [{ reps: 10, weight: 40, completed: false }], circuitId: null }],
    });
}"""

# Each control, and the key whose words it must show.
FEEDBACK_DIALOG = {
    "#dialog-feedback .modal-header h3": "log_client_feedback",
    "#dialog-feedback .feedback-local-badge": "feedback_local_only",
    "label[for='feedback-custom-note']": "custom_details",
    "#dialog-feedback .modal-cancel": "btn_cancel",
    "#form-feedback button[type=submit]": "btn_log_alert",
}


def test_the_feedback_dialog_is_in_slovenian_when_slovenian_is_chosen(
    page, local_server
):
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector(".session-card", timeout=10000)
    page.locator(".session-card").first.click()
    page.wait_for_timeout(700)
    page.evaluate(OPEN_ONE_EXERCISE)
    page.wait_for_timeout(400)
    # force=True: collapsed cards overlap, so a sibling can intercept the pointer.
    page.locator(".exercise-deck-card:not(.past-session)").first.click(force=True)
    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback[open]")

    _expect_slovenian(page, FEEDBACK_DIALOG)
