# tests/e2e/test_quick_signal_toggle.py
# The Too Easy / Too Hard quick-signal buttons are toggles, not one-way stamps (TODO — collapsed
# card review): a second tap on the SAME signal undoes it, so a mis-tap on the gym floor doesn't
# need a trip to the feedback modal to correct. logQuickSignal/hasQuickSignal are exercised
# directly through activeSessionController.js, going through the real openSessionFromHistory path
# so the scenario is a genuine session rather than a hand-built shortcut.
#
# Note on style: each test inlines its own literal `page.evaluate` body rather than sharing a helper
# that builds one from a string. The app ships `script-src 'self'` with no `unsafe-eval`, so a
# `new Function(...)` helper is refused by the page's own CSP — correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


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


def test_easy_and_hard_toggle_independently(page, local_server):
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
