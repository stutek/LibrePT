# tests/e2e/test_series_delete_question.py
# Deleting one evening of a repeating session removes that evening only, and the question says so.
# The edit form already said it ("This is one evening of a repeating session…"); the delete question
# said nothing, so a trainer could fear every Tuesday to the end of the year was gone.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright; the demo data,
# seeded by the conftest, holds a repeating session with evenings already stored.

from tests.conftest import answer_app_questions, app_question_messages

A_SERIES_EVENING = """async () => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const row = store.getState().sessions.find((session) => session.seriesId);
    return row ? row.id : null;
}"""


def test_deleting_an_evening_of_a_series_says_only_that_evening_goes(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    evening = page.evaluate(A_SERIES_EVENING)
    assert evening, (
        "the demo should store at least one evening of its repeating session"
    )

    page.goto(f"{local_server}session/{evening}")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    answer_app_questions(page, accept=False)
    page.click("#btn-session-menu")
    page.click("#btn-delete-session")
    page.wait_for_function("() => (window.__appQuestionMessages || []).length > 0")

    assert "Only this evening is deleted" in app_question_messages(page)[0]
