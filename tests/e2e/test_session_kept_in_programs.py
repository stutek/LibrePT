# tests/e2e/test_session_kept_in_programs.py
# A session in progress is stored as its participants' programs, and nowhere else. What the trainer
# logged in it is therefore still there after they open another session and come back, and after a
# reload. Before, the session lived in one storage slot: opening a second session overwrote it, and
# what was logged in the first was gone.
#
# The work is logged the way a trainer logs it on the gym floor: the in-focus card's Too Easy, which
# also ticks the exercise's sets (domain/feedbackTags.js).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

SESSION_A = "Group Strength & Conditioning"
SESSION_B = (
    '.session-card[data-session-id="s04f2e3d"]'  # Morning Conditioning, seeded tomorrow
)

WHAT_IS_LOGGED = """async () => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    const session = live.getActiveSession();
    if (!session) return null;
    const clientState = session.clientRoutines[session.activeClientId];
    const ticked = Object.values(clientState.logs).flat().filter((set) => set.completed).length;
    return {
        id: session.id,
        started: Boolean(session.started),
        ticked,
        tooEasy: (session.feedback || []).some((entry) => entry.tag.startsWith('Too Easy')),
    };
}"""


def _open_a(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(".session-card", has_text=SESSION_A).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)


def _too_easy_on_the_first_card(page):
    # The deck opens collapsed and the card's actions render only in focus; force=True because
    # collapsed cards overlap.
    page.locator(".exercise-deck-card").first.click(force=True)
    page.wait_for_selector(".exercise-deck-card .deck-action-easy")
    page.locator(".exercise-deck-card .deck-action-easy").first.click()
    page.wait_for_timeout(200)


def _flush(page):
    page.evaluate(
        """async () => {
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await queue.flushWrites();
        }"""
    )


def test_what_was_logged_is_there_after_opening_another_session(page, local_server):
    _open_a(page, local_server)
    _too_easy_on_the_first_card(page)
    logged = page.evaluate(WHAT_IS_LOGGED)
    assert logged["ticked"] > 0 and logged["tooEasy"], logged

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(SESSION_B).click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    assert page.evaluate(WHAT_IS_LOGGED)["id"] != logged["id"], "session B did not open"

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(".session-card", has_text=SESSION_A).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    back = page.evaluate(WHAT_IS_LOGGED)
    assert back["id"] == logged["id"]
    assert back["ticked"] == logged["ticked"], "the sets ticked in session A are gone"
    assert back["tooEasy"], "the signal given in session A is gone"


def test_a_started_session_and_its_sets_survive_a_reload(page, local_server):
    _open_a(page, local_server)
    page.click("#btn-start-session")
    # The seeded session starts an hour ago, so Start offers to move the schedule; keep it.
    page.wait_for_selector("#dialog-session-start-time[open]")
    page.click("#btn-session-start-time-keep")
    page.wait_for_selector("#dialog-session-start-time[open]", state="detached")
    _too_easy_on_the_first_card(page)
    logged = page.evaluate(WHAT_IS_LOGGED)
    assert logged["started"] and logged["ticked"] > 0, logged
    _flush(page)

    page.reload()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)
    back = page.evaluate(WHAT_IS_LOGGED)
    assert back["started"], "the reload lost Start"
    assert back["ticked"] == logged["ticked"], "the reload lost the ticked sets"
    assert back["tooEasy"], "the reload lost the signal"
    assert page.locator("#btn-start-session").is_visible() is False


def test_a_started_session_is_on_the_bar_after_a_reload_on_the_board(
    page, local_server
):
    _open_a(page, local_server)
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open]")
    page.click("#btn-session-start-time-keep")
    page.wait_for_selector("#dialog-session-start-time[open]", state="detached")
    _flush(page)

    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.wait_for_selector("#clipboard-bar:not(.hidden)", state="attached")
    assert page.evaluate(WHAT_IS_LOGGED)["started"] is True


WHAT_IS_STORED = """async (programId) => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = s.getState();
    const program = (state.clientPrograms || []).find((p) => p.id === programId);
    return {
        status: program ? program.status : null,
        attended: (state.sessionAttendance || []).filter((a) => a.programId === programId).length,
        notes: (state.exerciseNotes || []).filter((n) => n.programId === programId).length,
    };
}"""


def test_a_participant_with_only_a_too_hard_signal_keeps_the_training(page, local_server):
    """On a clipboard holding two sessions, one client logs sets and a client of the other session
    only gets Too Hard, which deliberately ticks no set. Finishing kept the first client's training
    and deleted the second's program as a session where nothing was performed, with no attendance
    and with the Too Hard signal stored against it."""
    _open_a(page, local_server)
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open]")
    page.click("#btn-session-start-time-keep")
    page.wait_for_selector("#dialog-session-start-time[open]", state="detached")
    _too_easy_on_the_first_card(page)

    # A client of the other session on the merged clipboard.
    page.locator(".client-tab-participant", has_text="Return-to-Play Rehab").first.click()
    page.wait_for_timeout(300)
    page.locator(".exercise-deck-card").first.click(force=True)
    page.wait_for_selector(".exercise-deck-card .deck-action-hard")
    page.locator(".exercise-deck-card .deck-action-hard").first.click()
    page.wait_for_timeout(200)
    # The second client's program in this session, by the id the session gave it.
    program_id = page.evaluate(
        """async () => {
            const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
            const session = live.getActiveSession();
            return session.programIds[session.activeClientId];
        }"""
    )
    assert page.evaluate(WHAT_IS_STORED, program_id)["notes"] == 1

    page.locator("#btn-finish-session").click()
    question = page.locator("#dialog-app-question[open]")
    if question.count():
        page.click("#app-question-confirm")
    page.wait_for_selector("#active-session-overlay", state="hidden")
    _flush(page)

    stored = page.evaluate(WHAT_IS_STORED, program_id)
    assert stored == {"status": "done", "attended": 1, "notes": 1}, stored


PROGRAM_OF_ACTIVE_CLIENT = """async () => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    const session = live.getActiveSession();
    return session.programIds[session.activeClientId];
}"""


def _too_hard_on_the_first_card(page):
    page.locator(".exercise-deck-card").first.click(force=True)
    page.wait_for_selector(".exercise-deck-card .deck-action-hard")
    page.locator(".exercise-deck-card .deck-action-hard").first.click()
    page.wait_for_timeout(200)


def test_finishing_a_group_on_one_members_tab_keeps_every_member(page, local_server):
    """Two members of one group session; the first only gets Too Hard, the second Too Easy, and the
    trainer finishes on the second member's tab. Only the second member's training was recorded."""
    _open_a(page, local_server)
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open]")
    page.click("#btn-session-start-time-keep")
    page.wait_for_selector("#dialog-session-start-time[open]", state="detached")
    # The seeded group arrives with sets already ticked; start from none, as a new session does.
    page.evaluate(
        """async () => {
            const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
            const session = live.getActiveSession();
            for (const clientState of Object.values(session.clientRoutines)) {
                for (const set of Object.values(clientState.logs || {}).flat()) set.completed = false;
            }
        }"""
    )
    members = page.locator(".client-tab-participant", has_text=SESSION_A)

    members.nth(0).click()
    page.wait_for_timeout(300)
    _too_hard_on_the_first_card(page)
    first = page.evaluate(PROGRAM_OF_ACTIVE_CLIENT)
    members.nth(1).click()
    page.wait_for_timeout(300)
    _too_easy_on_the_first_card(page)
    second = page.evaluate(PROGRAM_OF_ACTIVE_CLIENT)
    assert first != second

    page.locator("#btn-finish-session").click()
    if page.locator("#dialog-app-question[open]").count():
        page.click("#app-question-confirm")
    page.wait_for_selector("#active-session-overlay", state="hidden")
    _flush(page)

    for program_id in (first, second):
        stored = page.evaluate(WHAT_IS_STORED, program_id)
        assert stored == {"status": "done", "attended": 1, "notes": 1}, (program_id, stored)
