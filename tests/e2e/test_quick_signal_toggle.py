# tests/e2e/test_quick_signal_toggle.py
# The Too Easy / Too Hard quick-signal buttons are toggles, not one-way stamps (TODO §8.7): a
# second tap on the SAME signal undoes it, so a mis-tap on the gym floor doesn't need a trip to
# the feedback modal to correct. The two are also mutually exclusive — tapping the OPPOSITE signal
# swaps it rather than stacking both, which is what actually corrects a mistype (tapping the wrong
# one first, then the right one, without having to untap the wrong one in between).
# logQuickSignal/hasQuickSignal are exercised directly through activeSessionController.js, going
# through the real openSessionFromHistory path so the scenario is a genuine session rather than a
# hand-built shortcut.
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


def test_second_tap_undoes_the_first(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const m = await import(url);
            const store = await import(stateUrl);
            const state = store.getState();
            const clientId = state.clients[0].id;
            const tag = 'Too Easy - Increase Load';

            m.openSessionFromHistory({
                id: 'toggle-test-log',
                clientId,
                routineName: 'Toggle Test',
                date: new Date().toISOString(),
                duration: 0,
                exercises: [
                    { id: 'ex1', type: 'exercise', name: 'Toggle Test Exercise',
                      sets: [{ reps: 10, weight: 20, completed: false }], circuitId: null },
                ],
            });

            const before = m.hasQuickSignal(clientId, 'Toggle Test Exercise', tag);
            m.logQuickSignal(tag);
            const afterFirstTap = m.hasQuickSignal(clientId, 'Toggle Test Exercise', tag);
            const planUpdatesAfterFirst = state.planUpdates.filter((u) => u.exerciseName === 'Toggle Test Exercise').length;
            m.logQuickSignal(tag);
            const afterSecondTap = m.hasQuickSignal(clientId, 'Toggle Test Exercise', tag);
            const planUpdatesAfterSecond = state.planUpdates.filter((u) => u.exerciseName === 'Toggle Test Exercise').length;

            return { before, afterFirstTap, planUpdatesAfterFirst, afterSecondTap, planUpdatesAfterSecond };
        }"""
    )
    assert r["before"] is False
    assert r["afterFirstTap"] is True
    assert r["planUpdatesAfterFirst"] == 1
    # The second tap must undo BOTH the live-session feedback flag and the pending-adjustments
    # queue entry — leaving either behind would show a phantom item in plan review.
    assert r["afterSecondTap"] is False
    assert r["planUpdatesAfterSecond"] == 0


def test_tapping_one_signal_alone_does_not_activate_the_other(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const m = await import(url);
            const store = await import(stateUrl);
            const state = store.getState();
            const clientId = state.clients[0].id;
            const easy = 'Too Easy - Increase Load';
            const hard = 'Too Hard - Reduce Load';

            m.openSessionFromHistory({
                id: 'toggle-test-log-2',
                clientId,
                routineName: 'Toggle Test 2',
                date: new Date().toISOString(),
                duration: 0,
                exercises: [
                    { id: 'ex2', type: 'exercise', name: 'Independent Toggle Exercise',
                      sets: [{ reps: 10, weight: 20, completed: false }], circuitId: null },
                ],
            });

            m.logQuickSignal(easy);
            return {
                easyActive: m.hasQuickSignal(clientId, 'Independent Toggle Exercise', easy),
                hardActive: m.hasQuickSignal(clientId, 'Independent Toggle Exercise', hard),
            };
        }"""
    )
    assert r["easyActive"] is True
    assert r["hardActive"] is False


def test_tapping_the_opposite_signal_swaps_it(page, local_server):
    """Mistype correction: the PT taps the wrong button, then the right one — no untap step in
    between. Too Easy and Too Hard are mutually exclusive, so the second tap must replace the
    first, not stack both active at once."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const m = await import(url);
            const store = await import(stateUrl);
            const state = store.getState();
            const clientId = state.clients[0].id;
            const easy = 'Too Easy - Increase Load';
            const hard = 'Too Hard - Reduce Load';
            const exerciseName = 'Swap Test Exercise';

            m.openSessionFromHistory({
                id: 'toggle-test-log-swap',
                clientId,
                routineName: 'Swap Test',
                date: new Date().toISOString(),
                duration: 0,
                exercises: [
                    { id: 'ex-swap', type: 'exercise', name: exerciseName,
                      sets: [{ reps: 10, weight: 20, completed: false }], circuitId: null },
                ],
            });

            // Mistype: tap Easy, then correct by tapping Hard — one motion, no untap in between.
            m.logQuickSignal(easy);
            m.logQuickSignal(hard);
            const afterSwap = {
                easyActive: m.hasQuickSignal(clientId, exerciseName, easy),
                hardActive: m.hasQuickSignal(clientId, exerciseName, hard),
                planUpdateCount: state.planUpdates.filter((u) => u.exerciseName === exerciseName).length,
            };

            // And the reverse direction: Hard -> Easy swaps back, not stacks a third entry.
            m.logQuickSignal(easy);
            const afterSwapBack = {
                easyActive: m.hasQuickSignal(clientId, exerciseName, easy),
                hardActive: m.hasQuickSignal(clientId, exerciseName, hard),
                planUpdateCount: state.planUpdates.filter((u) => u.exerciseName === exerciseName).length,
            };

            return { afterSwap, afterSwapBack };
        }"""
    )
    assert r["afterSwap"]["easyActive"] is False
    assert r["afterSwap"]["hardActive"] is True
    assert r["afterSwap"]["planUpdateCount"] == 1, (
        "the mistyped entry must be removed, not just shadowed"
    )

    assert r["afterSwapBack"]["easyActive"] is True
    assert r["afterSwapBack"]["hardActive"] is False
    assert r["afterSwapBack"]["planUpdateCount"] == 1


def test_swap_never_touches_a_noted_opposite_signal(page, local_server):
    """The opposite-tag removal is bounded by the same isPlainQuickSignal rule as the same-tag
    toggle: a noted/voice-memo'd entry on the opposite tag must survive being swapped away from."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const m = await import(url);
            const store = await import(stateUrl);
            const state = store.getState();
            const clientId = state.clients[0].id;
            const easy = 'Too Easy - Increase Load';
            const hard = 'Too Hard - Reduce Load';
            const exerciseName = 'Noted Swap Exercise';

            m.openSessionFromHistory({
                id: 'toggle-test-log-noted-swap',
                clientId,
                routineName: 'Noted Swap Test',
                date: new Date().toISOString(),
                duration: 0,
                exercises: [
                    { id: 'ex-noted-swap', type: 'exercise', name: exerciseName,
                      sets: [{ reps: 10, weight: 20, completed: false }], circuitId: null },
                ],
            });

            m.logQuickSignal(hard);
            const session = m.getActiveSession();
            const hardEntry = session.feedback.find((f) => f.exerciseName === exerciseName);
            hardEntry.note = 'Client flagged shoulder discomfort';

            // Tap Easy: Hard is noted, so it must NOT be removed — Easy is added alongside it.
            m.logQuickSignal(easy);

            return {
                easyActive: m.hasQuickSignal(clientId, exerciseName, easy),
                hardNoteSurvived: session.feedback.some(
                    (f) => f.exerciseName === exerciseName && f.note === 'Client flagged shoulder discomfort'
                ),
            };
        }"""
    )
    assert r["easyActive"] is True
    assert r["hardNoteSurvived"] is True


def test_toggle_never_removes_a_note_or_voice_memo(page, local_server):
    """The toggle only removes the exact untouched quick-signal it would itself have created —
    a typed note or a voice memo on the same tag must survive a re-tap of the plain button."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const m = await import(url);
            const store = await import(stateUrl);
            const state = store.getState();
            const clientId = state.clients[0].id;
            const tag = 'Too Easy - Increase Load';

            m.openSessionFromHistory({
                id: 'toggle-test-log-3',
                clientId,
                routineName: 'Toggle Test 3',
                date: new Date().toISOString(),
                duration: 0,
                exercises: [
                    { id: 'ex3', type: 'exercise', name: 'Noted Exercise',
                      sets: [{ reps: 10, weight: 20, completed: false }], circuitId: null },
                ],
            });

            // Log the plain quick-signal, then hand-annotate it as feedbackModal.js would —
            // giving it a note is what makes it no longer a "plain" quick-signal, the exact
            // distinction isPlainQuickSignal() draws.
            m.logQuickSignal(tag);
            const session = m.getActiveSession();
            const entry = session.feedback.find((f) => f.exerciseName === 'Noted Exercise');
            entry.note = 'Client mentioned knee discomfort';

            const activeBefore = m.hasQuickSignal(clientId, 'Noted Exercise', tag);
            const countBefore = session.feedback.filter((f) => f.exerciseName === 'Noted Exercise').length;
            // A re-tap of the PLAIN button: the noted entry doesn't count as "active" (that is
            // the point of isPlainQuickSignal), so this logs a FRESH plain signal rather than
            // trying to remove the noted one.
            m.logQuickSignal(tag);
            const activeAfter = m.hasQuickSignal(clientId, 'Noted Exercise', tag);
            const countAfter = session.feedback.filter((f) => f.exerciseName === 'Noted Exercise').length;
            const feedbackSurvived = session.feedback.some(
                (f) => f.exerciseName === 'Noted Exercise' && f.note === 'Client mentioned knee discomfort'
            );

            return { activeBefore, activeAfter, countBefore, countAfter, feedbackSurvived };
        }"""
    )
    # hasQuickSignal is false before the re-tap: isPlainQuickSignal() excludes the noted entry by
    # design, so the button itself would render un-pressed even though feedback was logged.
    assert r["activeBefore"] is False
    assert r["countBefore"] == 1
    # The re-tap logs a NEW plain signal alongside the noted one — it does not touch it.
    assert r["activeAfter"] is True
    assert r["countAfter"] == 2
    assert r["feedbackSurvived"] is True


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
