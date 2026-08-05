# tests/medium/test_clipboard_rest_focus.py
# Rests are first-class, focusable plan items (TODO §8.6): a collapsed standalone rest card's only
# allowed action is bringing itself into focus, exactly like a collapsed exercise or circuit card —
# starting its timer is only reachable from the focused state, via RestDeckCard's Start action. Also
# covers the focus-model change that made this possible: completeCircuitRound lands focus on a
# following rest instead of skipping past it (the skip was one of the removed exceptions).
#
# Migrated from tests/e2e/test_rest_card_focus.py; its deep-link test stays there, because the URL a
# focused rest writes needs a real router to write it.
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
    rest_item,
)

CLIENT_ID = "c1a9f0e2"

COMPLETE_CIRCUIT_ROUND = """
import { completeCircuitRound } from './controllers/activeSessionController.js';
"""


def _mount(page, local_server, plan, extra_imports="", extra_body=""):
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=plan),
            extra_imports=extra_imports,
            extra_body=extra_body,
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_selector(".exercise-deck-card.rest-card")


def _plan():
    return [
        exercise_item("exA", "Exercise A"),
        rest_item("restX", 45),
        exercise_item("exB", "Exercise B"),
    ]


def test_tapping_a_collapsed_rest_focuses_it_without_starting_the_timer(
    page, local_server
):
    _mount(page, local_server, _plan())

    # The rest card starts collapsed (focus is on exercise A, index 0).
    result = page.evaluate(
        """() => {
            const card = document.querySelector('.exercise-deck-card.rest-card');
            const wasCollapsed = !card.classList.contains('in-focus');
            card.click();
            return { wasCollapsed };
        }"""
    )
    assert result["wasCollapsed"], "rest card should not start in focus"

    page.wait_for_selector(".exercise-deck-card.rest-card.in-focus")
    assert page.locator("#clipboard-timer-stack .timer-card").count() == 0, (
        "focusing a rest must not start its timer"
    )


def test_starting_the_now_focused_rest_starts_its_timer(page, local_server):
    _mount(page, local_server, _plan())

    # A DOM click, not a synthesized pointer one: collapsed cards overlap by margin-bottom:-24px, so
    # the card physically above the rest sits over its click point and would swallow the event —
    # even with force=True, which skips the actionability check but still dispatches at coordinates.
    page.evaluate(
        "() => document.querySelector('.exercise-deck-card.rest-card').click()"
    )
    page.wait_for_selector(".exercise-deck-card.rest-card.in-focus")

    page.locator(".exercise-deck-card.rest-card.in-focus .rest-card-start").click()
    timer = page.locator(
        f'#clipboard-timer-stack .timer-card[data-client="{CLIENT_ID}"]'
    )
    timer.wait_for()
    assert timer.inner_text().strip(), (
        "Start on the focused rest card must start a labelled timer"
    )


def test_completing_a_circuit_round_lands_on_a_following_rest(page, local_server):
    """completeCircuitRound must land focus on whatever comes right after the circuit — a rest
    included — rather than skipping past it."""
    _mount(
        page,
        local_server,
        [
            exercise_item(
                "exC",
                "Circuit Exercise",
                circuit_id="c1",
                circuitTitle="Test Circuit",
                circuitSeries=1,
            ),
            rest_item("restAfterCircuit", 60),
        ],
        extra_imports=COMPLETE_CIRCUIT_ROUND,
        extra_body="window.__completeCircuitRound = completeCircuitRound;\n",
    )

    page.evaluate("() => window.__completeCircuitRound('c1')")
    page.wait_for_selector(".exercise-deck-card.rest-card.in-focus")
