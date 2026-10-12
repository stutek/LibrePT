# tests/e2e/test_absent_participant.py
# A client who did not come can have no logged exercises (Simon, 2026-10-12). The trainer marks
# them absent from the session menu; their tab says so, their deck is replaced by a notice, the mark
# survives a reload, and finishing keeps their program as a plan, records them as not there, and
# records nothing they were logged for before the mark.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

SESSION_A = "Group Strength & Conditioning"

ACTIVE = """async () => {
    const live = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
    const session = live.getActiveSession();
    return { clientId: session.activeClientId, programId: session.programIds[session.activeClientId] };
}"""

STORED = """async ({ clientId, programId }) => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = s.getState();
    const program = (state.clientPrograms || []).find((p) => p.id === programId);
    return {
        status: program ? program.status : null,
        scheduled: Boolean(program && program.sessionId),
        ticked: (program?.exercises || []).flatMap((item) => item.sets || [])
            .filter((set) => set.completed).length,
        notes: (state.exerciseNotes || []).filter((n) => n.clientId === clientId).length,
        attendance: (state.sessionAttendance || [])
            .filter((row) => row.clientId === clientId)
            .map((row) => [row.status, row.consumesQuota]),
    };
}"""


def _flush(page):
    page.evaluate(
        """async () => {
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            await queue.flushWrites();
        }"""
    )


def _open_and_start(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.locator(".session-card", has_text=SESSION_A).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open]")
    page.click("#btn-session-start-time-keep")
    page.wait_for_selector("#dialog-session-start-time[open]", state="detached")


def _too_easy_on_the_first_card(page):
    page.locator(".exercise-deck-card").first.click(force=True)
    page.wait_for_selector(".exercise-deck-card .deck-action-easy")
    page.locator(".exercise-deck-card .deck-action-easy").first.click()
    page.wait_for_timeout(200)


def _menu_absence_row(page):
    page.click("#btn-session-menu")
    row = page.locator("#btn-mark-absent")
    row.wait_for(state="visible")
    return row


def test_an_absent_client_is_marked_kept_after_a_reload_and_not_recorded_as_trained(
    page, local_server
):
    _open_and_start(page, local_server)
    members = page.locator(".client-tab-participant", has_text=SESSION_A)
    members.nth(0).click()
    page.wait_for_timeout(300)
    absent = page.evaluate(ACTIVE)
    notes_before = page.evaluate(STORED, absent)["notes"]
    # Logged for them before the trainer noticed they are not here: none of it may stay.
    _too_easy_on_the_first_card(page)
    assert page.evaluate(STORED, absent)["notes"] == notes_before + 1

    row = _menu_absence_row(page)
    assert row.inner_text().strip().startswith("Not here today:"), row.inner_text()
    row.click()
    # Something was logged for them, so the app asks before deleting it.
    page.wait_for_selector("#dialog-app-question[open]")
    assert "deletes them" in page.locator("#dialog-app-question").inner_text()
    page.click("#app-question-confirm")
    page.wait_for_selector(".clipboard-absent-notice")
    assert page.locator(".exercise-deck-card").count() == 0
    tab = page.locator(".client-tab-participant.client-tab-absent")
    assert tab.count() == 1
    assert "not here" in tab.inner_text()
    _flush(page)

    page.reload()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)
    page.wait_for_selector(".client-tab-participant.client-tab-absent")

    members.nth(1).click()
    page.wait_for_timeout(300)
    _too_easy_on_the_first_card(page)
    present = page.evaluate(ACTIVE)

    page.locator("#btn-finish-session").click()
    if page.locator("#dialog-app-question[open]").count():
        page.click("#app-question-confirm")
    page.wait_for_selector("#active-session-overlay", state="hidden")
    _flush(page)

    assert page.evaluate(STORED, absent) == {
        "status": "planned",
        "scheduled": False,
        "ticked": 0,
        "notes": notes_before,
        "attendance": [["noShow", False]],
    }
    stored = page.evaluate(STORED, present)
    assert stored["status"] == "done" and stored["attendance"] == [
        ["attended", True]
    ], stored


def test_a_client_marked_absent_by_mistake_is_back_with_one_tap(page, local_server):
    _open_and_start(page, local_server)
    _menu_absence_row(page).click()
    # The seeded session arrives with sets ticked, so the app may ask before deleting them.
    page.wait_for_timeout(300)
    if page.locator("#dialog-app-question[open]").count():
        page.click("#app-question-confirm")
    page.wait_for_selector(".clipboard-absent-notice")

    page.locator(".clipboard-absent-notice button", has_text="Here after all").click()
    page.wait_for_selector(".exercise-deck-card")
    assert page.locator(".client-tab-absent").count() == 0
    assert page.locator(".clipboard-absent-notice").count() == 0
    assert _menu_absence_row(page).inner_text().strip().startswith("Not here today:")
