# tests/e2e/test_feedback_modal_exclusivity.py
# Too Easy / Too Hard are mutually exclusive, and the Notes modal must honour that rule even though
# it does not go through logQuickSignal: it offers the SAME two tags as its own radio choices
# (default-checked to Too Easy) and writes activeSession.feedback directly, so a quick-tapped signal
# and a modal submission are two separate write paths onto one exclusive pair.
#
# This is the seam between two components — the clipboard deck and #dialog-feedback — driven through
# the real form, which is why it needs the whole app rather than a single mounted component. The
# toggle/exclusivity RULES themselves (second tap undoes, opposite tap swaps, a noted entry is never
# removed) moved to tests/medium/test_clipboard_quick_signals.py.
#
# Note on style: each test inlines its own literal `page.evaluate` body rather than sharing a helper
# that builds one from a string. The app ships `script-src 'self'` with no `unsafe-eval`, so a
# `new Function(...)` helper is refused by the page's own CSP — correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_session_with_one_exercise(page, local_server, log_id="feedback-modal-log"):
    """Real UI session (not a pure-function shortcut) — needed for the modal tests below, which
    drive the actual #dialog-feedback form rather than calling logQuickSignal directly."""
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
                id: logId, clientId, routineName: 'Feedback Modal Test',
                date: new Date().toISOString(), duration: 0,
                exercises: [{ id: 'exA', type: 'exercise', name: 'Barbell Row',
                              sets: [{ reps: 10, weight: 40, completed: false }], circuitId: null }],
            });
        }""",
        log_id,
    )
    page.wait_for_timeout(400)
    # openSessionFromHistory navigates to /session/.../client/... (no exercise segment), so the
    # router does NOT clear deckAllCollapsed — the deck starts fully collapsed. The quick-signal
    # buttons (.deck-action-hard/easy) only render on the in-focus card, so bring it into focus
    # first. force=True: collapsed cards use margin-bottom:-24px overlap so the first non-past
    # card may sit behind a stacked card that physically intercepts the pointer — force bypasses it.
    page.locator(".exercise-deck-card:not(.past-session)").first.click(force=True)
    page.wait_for_timeout(300)


def test_modal_submission_of_opposite_tag_clears_the_quick_tapped_signal(
    page, local_server
):
    """Found 2026-07-27: the Notes modal offers the SAME Too Easy / Too Hard tags as its own radio
    choices (default-checked to Too Easy) and writes activeSession.feedback directly, bypassing
    logQuickSignal's mutual-exclusion entirely. Quick-tap Too Hard, then submit the modal with its
    default (Too Easy) selection and no custom text — the stale Too Hard entry must be cleared, not
    left active alongside the new one."""
    _open_session_with_one_exercise(page, local_server)

    page.locator(".deck-action-hard").click()
    page.wait_for_timeout(300)

    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback[open]")
    # Leave the default radio (Too Easy - Increase Load) and the custom-note field empty.
    page.locator("#form-feedback button[type=submit]").click()
    page.wait_for_timeout(300)

    # Force a re-render (any subsequent interaction would do this in real use) to make sure the
    # fix holds once fresh state is actually read, not just whatever the DOM happened to show.
    page.evaluate(
        """async () => {
            const m = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
            m.renderActiveGroupBoard();
        }"""
    )
    page.wait_for_timeout(300)

    state = page.evaluate(
        """async () => {
            const m = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
            const session = m.getActiveSession();
            return {
                feedback: session.feedback.filter((f) => f.exerciseName === 'Barbell Row'),
                easyActive: document.querySelector('.deck-action-easy')?.classList.contains('active'),
                hardActive: document.querySelector('.deck-action-hard')?.classList.contains('active'),
            };
        }"""
    )
    assert len(state["feedback"]) == 1, (
        f"the stale quick-tapped entry must be removed, not left alongside the modal's: {state['feedback']}"
    )
    assert state["feedback"][0]["tag"] == "Too Easy - Increase Load"
    assert state["easyActive"] is True
    assert state["hardActive"] is False


def test_modal_submission_the_other_direction_also_clears(page, local_server):
    """Same bug, opposite direction: quick-tap Too Easy, then submit the modal with Too Hard
    explicitly selected — the stale Too Easy entry must clear."""
    _open_session_with_one_exercise(page, local_server, log_id="feedback-modal-log-2")

    page.locator(".deck-action-easy").click()
    page.wait_for_timeout(300)

    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback[open]")
    page.locator(
        '#form-feedback input[name="feedback-tag"][value="Too Hard - Reduce Load"]'
    ).check()
    page.locator("#form-feedback button[type=submit]").click()
    page.wait_for_timeout(300)

    page.evaluate(
        """async () => {
            const m = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
            m.renderActiveGroupBoard();
        }"""
    )
    page.wait_for_timeout(300)

    state = page.evaluate(
        """async () => {
            const m = await import(new URL('controllers/activeSessionController.js', document.baseURI).href);
            const session = m.getActiveSession();
            return {
                feedback: session.feedback.filter((f) => f.exerciseName === 'Barbell Row'),
                easyActive: document.querySelector('.deck-action-easy')?.classList.contains('active'),
                hardActive: document.querySelector('.deck-action-hard')?.classList.contains('active'),
            };
        }"""
    )
    assert len(state["feedback"]) == 1, state["feedback"]
    assert state["feedback"][0]["tag"] == "Too Hard - Reduce Load"
    assert state["easyActive"] is False
    assert state["hardActive"] is True
