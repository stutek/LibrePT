# tests/e2e/test_nothing_lost_on_close.py
# A save the trainer made is still there when the app is opened again, however soon it was closed.
#
# Saving is write-behind (src/data/writeQueue.js): the screen changes at once and the database write
# follows. A note submitted and the page closed in the same moment was gone after a reload — the
# write had not finished, and nothing kept it. On a phone that is the app swiped away right after a
# tap. The page now keeps a copy of the state when it is hidden or closed with a write still
# running, and the next start takes it (src/data/unsavedStateJournal.js).
#
# How long a real write takes depends on the device, so each test holds the queue with a write that
# never finishes, through the queue's own `enqueueWrite`: every save after it is then still pending
# when the page closes, on any machine.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_session_with_one_exercise(page, local_server):
    """The same real-UI open as tests/e2e/test_gym_note_kept_on_record.py."""
    page.goto(local_server)
    page.wait_for_selector(".session-card", timeout=10000)
    page.locator(".session-card").first.click()
    page.wait_for_timeout(700)
    page.evaluate(
        """async () => {
            const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            ctrl.openSessionFromHistory({
                id: 'close-test-log', clientId: store.getState().clients[0].id,
                routineName: 'Close Test', date: new Date().toISOString(), duration: 0,
                exercises: [{ id: 'exA', type: 'exercise', name: 'Barbell Row',
                              sets: [{ reps: 10, weight: 40, completed: false }], circuitId: null }],
            });
        }"""
    )
    page.wait_for_timeout(400)
    # The deck opens collapsed and Add Note renders only on the in-focus card; force=True because
    # collapsed cards overlap.
    page.locator(".exercise-deck-card").first.click(force=True)
    page.wait_for_timeout(300)


def _hold_every_write(page):
    page.evaluate(
        """async () => {
            const q = await import(new URL('data/writeQueue.js', document.baseURI).href);
            q.enqueueWrite(() => new Promise(() => {}), 'held-by-test');
        }"""
    )


def _submit_note(page, note):
    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback[open]")
    page.locator(
        '#form-feedback input[name="feedback-tag"][value="Joint Pain / Discomfort"]'
    ).check()
    page.locator("#feedback-custom-note").fill(note)
    page.locator("#form-feedback button[type=submit]").click()
    page.wait_for_selector("#dialog-feedback", state="hidden")


def _review_tags(page):
    """Every waiting review card's stored tag, which carries the typed note."""
    return page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.getState().planUpdates.map((u) => u.tag);
        }"""
    )


def _flush(page):
    page.evaluate(
        "async () => (await import(new URL('data/writeQueue.js', document.baseURI).href)).flushWrites()"
    )


def test_a_note_saved_while_a_write_is_running_survives_closing(page, local_server):
    _open_session_with_one_exercise(page, local_server)
    _hold_every_write(page)
    _submit_note(page, "left knee, third round")

    page.reload()
    page.wait_for_selector(".session-card, #active-session-overlay:not(.hidden)")
    assert any("left knee, third round" in tag for tag in _review_tags(page))


def test_the_recovered_note_is_written_for_good(page, local_server):
    """Taken back once, it is in the database: a second start, with nothing pending, still has it."""
    _open_session_with_one_exercise(page, local_server)
    _hold_every_write(page)
    _submit_note(page, "left knee, third round")
    page.reload()
    page.wait_for_selector(".session-card, #active-session-overlay:not(.hidden)")
    _flush(page)

    page.reload()
    page.wait_for_selector(".session-card, #active-session-overlay:not(.hidden)")
    assert any("left knee, third round" in tag for tag in _review_tags(page))


def test_an_old_copy_never_undoes_a_later_save(page, local_server):
    """The copy is from the moment the page closed. Once the database has caught up, a save made
    after it must not be overwritten by it on the next start."""
    _open_session_with_one_exercise(page, local_server)
    _hold_every_write(page)
    _submit_note(page, "first note")
    page.reload()
    page.wait_for_selector(".session-card, #active-session-overlay:not(.hidden)")
    _flush(page)

    _open_session_with_one_exercise(page, local_server)
    _submit_note(page, "second note")
    _flush(page)
    page.reload()
    page.wait_for_selector(".session-card, #active-session-overlay:not(.hidden)")

    tags = _review_tags(page)
    assert any("first note" in tag for tag in tags)
    assert any("second note" in tag for tag in tags)
