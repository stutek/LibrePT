# tests/e2e/test_gym_note_kept_on_record.py
# A note taken mid-session can be kept on the CLIENT's record; one that is not kept waits on the
# review screen, where the trainer reads it at the desk.
#
# Why that matters: a twinge a client mentions between rounds changes how they are programmed for
# months, but logged as an alert it waits on the Pending Review screen and is resolved away within
# the week. Ticking one box while the modal is already open puts it in the text every future plan is
# written against.
#
# It needs the whole app: the real #dialog-feedback form writing to the real client record, and the
# record then read back by a different surface (the client focus panel) — two components and the
# store between them, which is the seam a component test cannot hold. The append RULE itself is
# pinned without a browser in tests/unit_js/domain/gymNotes.test.mjs.
#
# Note on style: each test inlines its own literal `page.evaluate` body — the app ships
# `script-src 'self'` with no `unsafe-eval`, so a helper building one via `new Function` is refused
# by the page's own CSP, correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_session_with_one_exercise(page, local_server, log_id="keep-on-record-log"):
    """The same real-UI open as test_feedback_modal_exclusivity.py: the modal is being driven, so
    the session it hangs off has to be a real one."""
    page.goto(local_server)
    page.wait_for_selector(".session-card", timeout=10000)
    page.locator(".session-card").first.click()
    page.wait_for_timeout(700)
    page.evaluate(
        """async (logId) => {
            const ctrl = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const clientId = store.getState().clients[0].id;
            ctrl.openSessionFromHistory({
                id: logId, clientId, routineName: 'Keep On Record Test',
                date: new Date().toISOString(), duration: 0,
                exercises: [{ id: 'exA', type: 'exercise', name: 'Barbell Row',
                              sets: [{ reps: 10, weight: 40, completed: false }], circuitId: null }],
            });
        }""",
        log_id,
    )
    page.wait_for_timeout(400)
    # The deck opens fully collapsed and the Feedback button only renders on the in-focus card.
    # force=True: collapsed cards overlap, so a sibling can intercept the pointer.
    page.locator(".exercise-deck-card:not(.past-session)").first.click(force=True)
    page.wait_for_timeout(300)


def _submit_note(page, note, keep):
    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback[open]")
    page.locator(
        '#form-feedback input[name="feedback-tag"][value="Joint Pain / Discomfort"]'
    ).check()
    page.locator("#feedback-custom-note").fill(note)
    if keep:
        page.locator("#feedback-keep-on-record").check()
    page.locator("#form-feedback button[type=submit]").click()
    page.wait_for_timeout(300)


def _client_notes(page):
    return page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.getState().clients[0].notes || '';
        }"""
    )


def test_a_kept_note_lands_on_the_person_and_not_only_on_the_session(
    page, local_server
):
    _open_session_with_one_exercise(page, local_server)
    before = _client_notes(page)

    _submit_note(page, "left knee clicks on the last rep", keep=True)

    notes = _client_notes(page)
    assert "left knee clicks on the last rep" in notes
    assert "Barbell Row" in notes
    # What the trainer wrote themselves is never replaced by what the gym added.
    assert before.strip() in notes


def test_a_kept_note_is_written_in_the_trainers_language(page, local_server):
    # The client's notes read "Too Hard - Reduce Load" on a Slovenian screen: the stored tag is an
    # English identifier, and it went into the notes as it was stored. The notes are what the
    # trainer reads before the next session, so they get the words the review screen shows. The
    # suite runs in English, where those words ("Joint pain or discomfort") still differ from the
    # identifier ("Joint Pain / Discomfort").
    _open_session_with_one_exercise(page, local_server)

    _submit_note(page, "left knee clicks", keep=True)

    last_line = _client_notes(page).splitlines()[-1]
    assert last_line.endswith(
        "Barbell Row: Joint pain or discomfort - left knee clicks"
    ), last_line


def test_the_default_leaves_the_record_alone(page, local_server):
    """Most signals are about today's load. A record that collects everything is one nobody reads,
    so keeping is a decision the trainer makes per note."""
    _open_session_with_one_exercise(page, local_server, log_id="keep-on-record-log-2")
    before = _client_notes(page)

    _submit_note(page, "felt heavy today", keep=False)

    assert _client_notes(page) == before


def test_the_kept_note_is_waiting_when_the_next_plan_is_shaped(page, local_server):
    """The payoff this feature is built around: it comes back against the right person, in the panel the
    trainer reads while editing their plan — not on a screen they have to think to visit."""
    _open_session_with_one_exercise(page, local_server, log_id="keep-on-record-log-3")
    _submit_note(page, "left knee clicks on the last rep", keep=True)

    page.click("#btn-session-menu")
    page.wait_for_selector("#session-menu:not(.hidden)")
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")

    notes = page.locator("#client-focus-notes")
    assert "left knee clicks on the last rep" in notes.inner_text()


def test_a_note_not_kept_waits_on_the_review_screen(page, local_server):
    """The other half of the default: a note not kept on the record becomes a card on the review
    screen, and the sentence is there when the trainer opens it at the desk — after a reload too,
    because a phone on the gym floor gets closed between the two."""
    _open_session_with_one_exercise(page, local_server, log_id="keep-on-record-log-4")
    name = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.getState().clients[0].name;
        }"""
    )
    _submit_note(page, "left knee clicks on the last rep", keep=False)
    # Saving is write-behind (src/data/writeQueue.js): the note is on the phone once the queued
    # write has landed, and not before.
    page.evaluate(
        "async () => (await import(new URL('data/writeQueue.js', document.baseURI).href)).flushWrites()"
    )

    page.goto(local_server + "adjustments")
    page.reload()
    page.wait_for_selector("#view-adjustments.active")
    card = page.locator(
        "#dashboard-adjustments-list .adjustment-card", has_text="Barbell Row"
    )
    assert card.count() == 1
    assert name in card.inner_text()
    assert "Joint pain or discomfort" in card.inner_text()

    card.locator(".btn-resolve-alert").click()
    page.wait_for_selector("#dialog-apply-adjustment[open]")
    assert (
        "left knee clicks on the last rep"
        in page.locator("#adjust-details").inner_text()
    )
