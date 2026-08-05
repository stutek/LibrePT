# tests/e2e/test_rest_card_focus.py
# What remains of the first-class-rest coverage (TODO §8.6) that genuinely needs the whole app: a
# focused rest is deep-linkable (focusType=rest) and that focus survives a reload. Writing the URL
# needs the real router, and restoring from it needs the real boot to read it back — neither exists
# in tests/medium/. The focus MODEL itself (tapping a collapsed rest focuses without starting its
# timer, Start on the focused card starts it, completeCircuitRound lands on a following rest) moved
# to tests/medium/test_clipboard_rest_focus.py.
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
