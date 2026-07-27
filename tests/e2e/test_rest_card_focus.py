# tests/e2e/test_rest_card_focus.py
# Rests are first-class, focusable plan items (TODO §8.6): a collapsed standalone rest card's only
# allowed action is bringing itself into focus, exactly like a collapsed exercise or circuit card —
# starting its timer is only reachable from the focused state, via RestDeckCard's Start action.
# Also covers the routing/focus-model changes that made this possible: a rest is deep-linkable
# (focusType=rest), and completeCircuitRound lands focus on a following rest instead of skipping it.
#
# Note on style: each test inlines its own literal `page.evaluate` body rather than sharing a helper
# that builds one from a string. The app ships `script-src 'self'` with no `unsafe-eval`, so a
# `new Function(...)` helper is refused by the page's own CSP — correctly.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_session_with_items(page, local_server, exercises, log_id="rest-focus-log"):
    """Open a live session whose plan is exactly `exercises`, via the real openSessionFromHistory
    path (not a hand-built shortcut), so the scenario is a genuine session."""
    page.goto(local_server)
    page.wait_for_timeout(300)
    client_id = page.evaluate(
        """async (args) => {
            const ctrlUrl = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const ctrl = await import(ctrlUrl);
            const store = await import(stateUrl);
            const state = store.getState();
            const clientId = state.clients[0].id;
            ctrl.openSessionFromHistory({
                id: args.logId,
                clientId,
                routineName: 'Rest Focus Test',
                date: new Date().toISOString(),
                duration: 0,
                exercises: args.exercises,
            });
            ctrl.renderActiveGroupBoard?.();
            return clientId;
        }""",
        {"logId": log_id, "exercises": exercises},
    )
    page.wait_for_timeout(300)
    return client_id


def _plan():
    return [
        {
            "id": "exA",
            "type": "exercise",
            "name": "Exercise A",
            "sets": [{"reps": 10, "weight": 20, "completed": False}],
            "circuitId": None,
        },
        {"id": "restX", "type": "rest", "rest": 45, "circuitId": None},
        {
            "id": "exB",
            "type": "exercise",
            "name": "Exercise B",
            "sets": [{"reps": 10, "weight": 20, "completed": False}],
            "circuitId": None,
        },
    ]


def test_tapping_a_collapsed_rest_focuses_it_without_starting_the_timer(
    page, local_server
):
    _open_session_with_items(page, local_server, _plan())

    # The rest card starts collapsed (focus is on exercise A, index 0).
    result = page.evaluate(
        """() => {
            const card = document.querySelector('.exercise-deck-card.rest-card');
            const wasCollapsed = card && !card.classList.contains('in-focus');
            card?.click();
            return { found: !!card, wasCollapsed };
        }"""
    )
    assert result["found"], "no standalone rest card rendered"
    assert result["wasCollapsed"], "rest card should not start in focus"
    page.wait_for_timeout(300)

    # Focus moved to the rest card; no timer was started by that tap.
    after = page.evaluate(
        """() => {
            const card = document.querySelector('.exercise-deck-card.rest-card');
            return {
                inFocus: card?.classList.contains('in-focus'),
                timerCards: document.querySelectorAll('#clipboard-timer-stack .timer-card').length,
            };
        }"""
    )
    assert after["inFocus"] is True, (
        "tapping the collapsed rest card should bring it into focus"
    )
    assert after["timerCards"] == 0, "focusing a rest must not start its timer"


def test_starting_the_now_focused_rest_starts_its_timer(page, local_server):
    client_id = _open_session_with_items(page, local_server, _plan())

    page.evaluate(
        "() => document.querySelector('.exercise-deck-card.rest-card')?.click()"
    )
    page.wait_for_timeout(300)

    page.evaluate(
        "() => document.querySelector('.exercise-deck-card.rest-card.in-focus .rest-card-start')?.click()"
    )
    page.wait_for_timeout(300)

    timer = page.evaluate(
        """(clientId) => {
            const card = document.querySelector(`#clipboard-timer-stack .timer-card[data-client="${clientId}"]`);
            return card ? card.textContent : null;
        }""",
        client_id,
    )
    assert timer is not None, (
        "Start action on the focused rest card must start its timer"
    )


def test_rest_focus_is_deep_linkable_and_survives_reload(page, local_server):
    _open_session_with_items(page, local_server, _plan())

    page.evaluate(
        "() => document.querySelector('.exercise-deck-card.rest-card')?.click()"
    )
    page.wait_for_timeout(300)

    path = page.evaluate("() => location.pathname")
    assert "/rest/" in path, (
        f"a focused rest should carry a rest focusType segment: {path}"
    )

    page.reload()
    page.wait_for_timeout(500)
    restored = page.evaluate(
        "() => document.querySelector('.exercise-deck-card.rest-card')?.classList.contains('in-focus')"
    )
    assert restored is True, (
        "reloading a rest-focused URL must restore focus to that rest"
    )


def test_completing_a_circuit_round_lands_on_a_following_rest(page, local_server):
    """completeCircuitRound must land focus on whatever comes right after the circuit — a rest
    included — rather than skipping past it (TODO §8.6: the skip was one of the removed exceptions)."""
    _open_session_with_items(
        page,
        local_server,
        [
            {
                "id": "exC",
                "type": "exercise",
                "name": "Circuit Exercise",
                "circuitId": "c1",
                "circuitTitle": "Test Circuit",
                "circuitSeries": 1,
                "sets": [{"reps": 10, "weight": 20, "completed": False}],
            },
            {"id": "restAfterCircuit", "type": "rest", "rest": 60, "circuitId": None},
        ],
        log_id="circuit-round-log",
    )

    page.evaluate(
        """async () => {
            const url = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const m = await import(url);
            m.completeCircuitRound('c1');
        }"""
    )
    page.wait_for_timeout(300)

    focused = page.evaluate(
        """() => {
            const card = document.querySelector('.exercise-deck-card.rest-card');
            return card?.classList.contains('in-focus');
        }"""
    )
    assert focused is True, (
        "focus should land on the rest right after the finished circuit"
    )
