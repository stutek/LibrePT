# tests/medium/test_clipboard_quick_signals.py
# The Too Easy / Too Hard quick-signal buttons are toggles, not one-way stamps (TODO §8.7): a second
# tap on the SAME signal undoes it, so a mis-tap on the gym floor doesn't need a trip to the feedback
# modal to correct. The two are also mutually exclusive — tapping the OPPOSITE signal swaps it rather
# than stacking both, which is what actually corrects a mistype (tapping the wrong one first, then
# the right one, without having to untap the wrong one in between). Both rules are bounded by
# isPlainQuickSignal: a noted or voice-memo'd entry is never removed by a button tap.
#
# Migrated from tests/e2e/test_quick_signal_toggle.py. That file's header rejected a "hand-built
# shortcut" in favour of the real openSessionFromHistory path — the rejected shortcut was a session
# object assembled inline by the test, whose shape could drift from the real one silently. The
# harness's active_session_fixture is the written-down contract instead, injected through the
# controller's own setActiveSession, so these assertions run against the same activeSession the real
# path builds. The MODAL tests from that file stay in e2e: they drive the #dialog-feedback form,
# which is a different component's boot step.
#
# Note on style: each test inlines its own literal `page.evaluate` body rather than sharing a helper
# that builds one from a string. The app ships `script-src 'self'` with no `unsafe-eval`, so a
# `new Function(...)` helper is refused by the page's own CSP — correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

CLIENT_ID = "c1a9f0e2"
EASY = "Too Easy - Increase Load"
HARD = "Too Hard - Reduce Load"

# Exposed on window by the stub below, so each test's evaluate body can reach the controller and the
# state it wrote into without re-importing a module URL in every one.
EXPOSE_CONTROLS = """
import {
  getActiveSession,
  hasQuickSignal,
  logQuickSignal,
} from './controllers/activeSessionController.js';
"""


def _mount(page, local_server, exercise_name):
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=[exercise_item("ex1", exercise_name)]),
            extra_imports=EXPOSE_CONTROLS,
            extra_body="""
window.__signals = { getActiveSession, hasQuickSignal, logQuickSignal, state };
""",
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")


def test_second_tap_undoes_the_first(page, local_server):
    _mount(page, local_server, "Toggle Test Exercise")

    result = page.evaluate(
        """(args) => {
            const { getActiveSession, hasQuickSignal, logQuickSignal, state } = window.__signals;
            const { clientId, name, tag } = args;
            const planUpdates = () => state.planUpdates.filter((u) => u.exerciseName === name).length;

            const before = hasQuickSignal(clientId, name, tag);
            logQuickSignal(tag);
            const afterFirstTap = hasQuickSignal(clientId, name, tag);
            const planUpdatesAfterFirst = planUpdates();
            logQuickSignal(tag);
            return {
                before,
                afterFirstTap,
                planUpdatesAfterFirst,
                afterSecondTap: hasQuickSignal(clientId, name, tag),
                planUpdatesAfterSecond: planUpdates(),
            };
        }""",
        {"clientId": CLIENT_ID, "name": "Toggle Test Exercise", "tag": EASY},
    )
    assert result["before"] is False
    assert result["afterFirstTap"] is True
    assert result["planUpdatesAfterFirst"] == 1
    # The second tap must undo BOTH the live-session feedback flag and the pending-adjustments
    # queue entry — leaving either behind would show a phantom item in plan review.
    assert result["afterSecondTap"] is False
    assert result["planUpdatesAfterSecond"] == 0


def test_tapping_one_signal_alone_does_not_activate_the_other(page, local_server):
    _mount(page, local_server, "Independent Toggle Exercise")

    result = page.evaluate(
        """(args) => {
            const { hasQuickSignal, logQuickSignal } = window.__signals;
            const { clientId, name, easy, hard } = args;
            logQuickSignal(easy);
            return {
                easyActive: hasQuickSignal(clientId, name, easy),
                hardActive: hasQuickSignal(clientId, name, hard),
            };
        }""",
        {
            "clientId": CLIENT_ID,
            "name": "Independent Toggle Exercise",
            "easy": EASY,
            "hard": HARD,
        },
    )
    assert result["easyActive"] is True
    assert result["hardActive"] is False


def test_tapping_the_opposite_signal_swaps_it(page, local_server):
    """Mistype correction: the PT taps the wrong button, then the right one — no untap step in
    between. Too Easy and Too Hard are mutually exclusive, so the second tap must replace the
    first, not stack both active at once."""
    _mount(page, local_server, "Swap Test Exercise")

    result = page.evaluate(
        """(args) => {
            const { hasQuickSignal, logQuickSignal, state } = window.__signals;
            const { clientId, name, easy, hard } = args;
            const snapshot = () => ({
                easyActive: hasQuickSignal(clientId, name, easy),
                hardActive: hasQuickSignal(clientId, name, hard),
                planUpdateCount: state.planUpdates.filter((u) => u.exerciseName === name).length,
            });

            // Mistype: tap Easy, then correct by tapping Hard — one motion, no untap in between.
            logQuickSignal(easy);
            logQuickSignal(hard);
            const afterSwap = snapshot();

            // And the reverse direction: Hard -> Easy swaps back, not stacks a third entry.
            logQuickSignal(easy);
            return { afterSwap, afterSwapBack: snapshot() };
        }""",
        {
            "clientId": CLIENT_ID,
            "name": "Swap Test Exercise",
            "easy": EASY,
            "hard": HARD,
        },
    )
    assert result["afterSwap"]["easyActive"] is False
    assert result["afterSwap"]["hardActive"] is True
    assert result["afterSwap"]["planUpdateCount"] == 1, (
        "the mistyped entry must be removed, not just shadowed"
    )

    assert result["afterSwapBack"]["easyActive"] is True
    assert result["afterSwapBack"]["hardActive"] is False
    assert result["afterSwapBack"]["planUpdateCount"] == 1


def test_swap_never_touches_a_noted_opposite_signal(page, local_server):
    """The opposite-tag removal is bounded by the same isPlainQuickSignal rule as the same-tag
    toggle: a noted/voice-memo'd entry on the opposite tag must survive being swapped away from."""
    _mount(page, local_server, "Noted Swap Exercise")

    result = page.evaluate(
        """(args) => {
            const { getActiveSession, hasQuickSignal, logQuickSignal } = window.__signals;
            const { clientId, name, easy, hard } = args;
            const note = 'Client flagged shoulder discomfort';

            logQuickSignal(hard);
            const session = getActiveSession();
            session.feedback.find((f) => f.exerciseName === name).note = note;

            // Tap Easy: Hard is noted, so it must NOT be removed — Easy is added alongside it.
            logQuickSignal(easy);

            return {
                easyActive: hasQuickSignal(clientId, name, easy),
                hardNoteSurvived: session.feedback.some(
                    (f) => f.exerciseName === name && f.note === note
                ),
            };
        }""",
        {
            "clientId": CLIENT_ID,
            "name": "Noted Swap Exercise",
            "easy": EASY,
            "hard": HARD,
        },
    )
    assert result["easyActive"] is True
    assert result["hardNoteSurvived"] is True


def test_toggle_never_removes_a_note_or_voice_memo(page, local_server):
    """The toggle only removes the exact untouched quick-signal it would itself have created —
    a typed note or a voice memo on the same tag must survive a re-tap of the plain button."""
    _mount(page, local_server, "Noted Exercise")

    result = page.evaluate(
        """(args) => {
            const { getActiveSession, hasQuickSignal, logQuickSignal } = window.__signals;
            const { clientId, name, tag } = args;
            const note = 'Client mentioned knee discomfort';

            // Log the plain quick-signal, then hand-annotate it as feedbackModal.js would — giving
            // it a note is what makes it no longer a "plain" quick-signal, the exact distinction
            // isPlainQuickSignal() draws.
            logQuickSignal(tag);
            const session = getActiveSession();
            session.feedback.find((f) => f.exerciseName === name).note = note;
            const count = () => session.feedback.filter((f) => f.exerciseName === name).length;

            const activeBefore = hasQuickSignal(clientId, name, tag);
            const countBefore = count();
            // A re-tap of the PLAIN button: the noted entry doesn't count as "active" (that is the
            // point of isPlainQuickSignal), so this logs a FRESH plain signal rather than trying to
            // remove the noted one.
            logQuickSignal(tag);
            return {
                activeBefore,
                countBefore,
                activeAfter: hasQuickSignal(clientId, name, tag),
                countAfter: count(),
                feedbackSurvived: session.feedback.some(
                    (f) => f.exerciseName === name && f.note === note
                ),
            };
        }""",
        {"clientId": CLIENT_ID, "name": "Noted Exercise", "tag": EASY},
    )
    # hasQuickSignal is false before the re-tap: isPlainQuickSignal() excludes the noted entry by
    # design, so the button itself would render un-pressed even though feedback was logged.
    assert result["activeBefore"] is False
    assert result["countBefore"] == 1
    # The re-tap logs a NEW plain signal alongside the noted one — it does not touch it.
    assert result["activeAfter"] is True
    assert result["countAfter"] == 2
    assert result["feedbackSurvived"] is True
