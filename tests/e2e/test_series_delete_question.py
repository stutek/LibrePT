# tests/e2e/test_series_delete_question.py
# Deleting one evening of a repeating session removes that evening only, and the question says so.
# The edit form already said it ("This is one evening of a repeating session…"); the delete question
# said nothing, so a trainer could fear every Tuesday to the end of the year was gone.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright; the demo data,
# seeded by the conftest, holds a repeating session with evenings already stored.

import re

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


# --- Deleting a session names it, and a STARTED session is deleted by sliding ----------------------
# The question names the session (title, ISO date, 24-hour time). For a session already started it
# also says which logged sets cannot come back, and the destructive button is not offered: a slide
# confirms, so a phone in a pocket cannot delete a workout in progress.

CARD_TITLE = "Group Strength & Conditioning"
COUNT_SESSIONS_TITLED = """async (title) => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    return store.getState().sessions.filter((s) => s.title === title).length;
}"""
# The demo opens this session with progress already logged in it, and a session keeps what was
# logged in it. The questions below are about what THIS test logs, so the session starts clean.
CLEAR_LOGGED_SETS = """async () => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    for (const clientState of Object.values(live.getActiveSession().clientRoutines)) {
        for (const sets of Object.values(clientState.logs)) for (const set of sets) set.completed = false;
    }
}"""
LOG_ONE_SET = """async () => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    const session = live.getActiveSession();
    const clientState = session.clientRoutines[session.participants[0]];
    const exId = clientState.exercises.find((e) => e.type !== 'rest').id;
    clientState.logs[exId] = [{ reps: 5, weight: 20, completed: true, note: '' }];
}"""


def _open_delete_dialog(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(".session-card", has_text=CARD_TITLE).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")


def _ask_to_delete(page):
    page.click("#btn-session-menu")
    page.click("#btn-delete-session")
    page.wait_for_selector("#dialog-app-question[open]")


def _slide(page, fraction):
    box = page.locator("#app-question-slider").bounding_box()
    y = box["y"] + box["height"] / 2
    page.mouse.move(box["x"] + 4, y)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] * fraction, y, steps=8)
    if fraction >= 1:
        page.mouse.move(box["x"] + box["width"] + 40, y, steps=2)
    page.mouse.up()


def test_an_unstarted_session_is_named_and_deleted_by_the_button(page, local_server):
    _open_delete_dialog(page, local_server)
    before = page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE)
    _ask_to_delete(page)

    text = page.inner_text("#app-question-text")
    assert CARD_TITLE in text
    assert re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}", text), text
    assert page.locator("#app-question-slider").is_visible() is False
    page.click("#app-question-confirm")

    page.wait_for_function(
        "() => !document.querySelector('#dialog-app-question[open]')"
    )
    assert page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE) == before - 1


def test_a_started_session_says_its_sets_and_is_deleted_only_by_sliding_to_the_end(
    page, local_server
):
    _open_delete_dialog(page, local_server)
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open], #btn-finish-session")
    page.keyboard.press("Escape")
    page.evaluate(CLEAR_LOGGED_SETS)
    page.evaluate(LOG_ONE_SET)
    before = page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE)
    _ask_to_delete(page)

    text = page.inner_text("#app-question-text")
    assert CARD_TITLE in text
    assert re.search(r"cannot be restored\. \S.*: 1 set$", text), text
    assert page.locator("#app-question-confirm").is_visible() is False
    slider = page.locator("#app-question-slider")
    assert slider.is_visible() is True
    assert page.locator("label[for=app-question-slider]").inner_text().strip() != ""
    assert slider.bounding_box()["height"] >= 44

    _slide(page, 0.5)
    assert (
        page.evaluate("() => document.getElementById('app-question-slider').value")
        == "0"
    )
    assert page.locator("#dialog-app-question[open]").count() == 1
    assert page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE) == before

    _slide(page, 1)
    page.wait_for_function(
        "() => !document.querySelector('#dialog-app-question[open]')"
    )
    assert page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE) == before - 1


def test_a_tap_at_the_far_end_of_the_slider_deletes_nothing(page, local_server):
    # A range input jumps to wherever it is touched. One tap at the end of the track is what a
    # phone in a pocket does, and it must not count as a slide.
    _open_delete_dialog(page, local_server)
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open], #btn-finish-session")
    page.keyboard.press("Escape")
    before = page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE)
    _ask_to_delete(page)

    box = page.locator("#app-question-slider").bounding_box()
    page.mouse.click(box["x"] + box["width"] - 2, box["y"] + box["height"] / 2)

    assert page.locator("#dialog-app-question[open]").count() == 1
    assert (
        page.evaluate("() => document.getElementById('app-question-slider').value")
        == "0"
    )
    assert page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE) == before


# --- Cancelling keeps the session on the board, marked cancelled (ruled by Simon 2026-10-09) -------

ROWS_TITLED = """async (title) => {
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = store.getState();
    return state.sessions.filter((s) => s.title === title).map((s) => ({
        id: s.id,
        status: s.status,
        programsOnIt: state.clientPrograms.filter((p) => p.sessionId === s.id).length,
    }));
}"""


def _tap_cancel(page):
    page.click("#btn-session-menu")
    page.click("#btn-cancel-session")


def _ask_to_cancel(page):
    _tap_cancel(page)
    page.wait_for_selector("#dialog-app-question[open]")


def test_cancelling_keeps_the_session_on_the_board_marked_cancelled(page, local_server):
    _open_delete_dialog(page, local_server)
    session_id = page.evaluate(
        """async () => {
            const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
            return live.getActiveSession().sourceSession.id;
        }"""
    )
    before = page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE)
    _ask_to_cancel(page)

    text = page.inner_text("#app-question-text")
    assert CARD_TITLE in text, "the question names the session"
    assert re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}", text), text
    assert "stays on the schedule" in text, text
    assert (
        page.inner_text("#app-question-confirm").strip() == "Mark session as cancelled"
    )
    assert page.locator("#app-question-slider").is_visible() is False
    page.click("#app-question-confirm")
    page.wait_for_selector("#active-session-overlay", state="hidden")

    assert page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE) == before, "the row stays"
    row = next(
        r for r in page.evaluate(ROWS_TITLED, CARD_TITLE) if r["id"] == session_id
    )
    assert row == {"id": session_id, "status": "cancelled", "programsOnIt": 0}, row

    card = page.locator(f'.session-card[data-session-id="{session_id}"]')
    card.wait_for()
    assert "Cancelled" in card.inner_text()

    # Tapping it opens nothing: no clipboard for a session that will not take place.
    card.click()
    page.wait_for_timeout(300)
    assert page.locator("#active-session-overlay").is_visible() is False


def test_a_link_to_a_cancelled_session_opens_no_clipboard(page, local_server):
    _open_delete_dialog(page, local_server)
    session_id = page.evaluate(
        """async () => {
            const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
            return live.getActiveSession().sourceSession.id;
        }"""
    )
    answer_app_questions(page)
    _tap_cancel(page)
    page.wait_for_selector("#active-session-overlay", state="hidden")
    page.evaluate(
        """async () => {
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await queue.flushWrites();
        }"""
    )

    page.goto(f"{local_server}session/{session_id}")
    page.wait_for_timeout(500)
    assert page.locator("#active-session-overlay").is_visible() is False
    assert page.locator("#view-clients.active").count() == 1, (
        "the board is shown instead"
    )


def test_a_started_session_is_cancelled_only_by_sliding(page, local_server):
    _open_delete_dialog(page, local_server)
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open], #btn-finish-session")
    page.keyboard.press("Escape")
    _ask_to_cancel(page)

    assert page.locator("#app-question-confirm").is_visible() is False
    assert page.locator("#app-question-slider").is_visible() is True
    assert (
        page.locator("label[for=app-question-slider]").inner_text().strip()
        == "Slide to the end to mark this session as cancelled"
    )


def test_cancelling_an_evening_of_a_series_says_only_that_evening_is_cancelled(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    evening = page.evaluate(A_SERIES_EVENING)
    assert evening

    page.goto(f"{local_server}session/{evening}")
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    answer_app_questions(page, accept=False)
    _tap_cancel(page)
    page.wait_for_function("() => (window.__appQuestionMessages || []).length > 0")

    assert "Only this evening is cancelled" in app_question_messages(page)[0]


def test_a_started_session_can_be_deleted_from_the_keyboard_with_the_end_key(
    page, local_server
):
    _open_delete_dialog(page, local_server)
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open], #btn-finish-session")
    page.keyboard.press("Escape")
    page.evaluate(CLEAR_LOGGED_SETS)
    before = page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE)
    _ask_to_delete(page)

    assert "No sets are logged yet." in page.inner_text("#app-question-text")
    page.locator("#app-question-slider").focus()
    page.keyboard.press("ArrowRight")
    assert page.locator("#dialog-app-question[open]").count() == 1
    page.keyboard.press("End")

    page.wait_for_function(
        "() => !document.querySelector('#dialog-app-question[open]')"
    )
    assert page.evaluate(COUNT_SESSIONS_TITLED, CARD_TITLE) == before - 1
