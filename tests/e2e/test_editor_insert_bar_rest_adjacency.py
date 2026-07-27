# tests/e2e/test_editor_insert_bar_rest_adjacency.py
# The +Rest option in the editor's insert bar is hidden wherever inserting one would land it
# directly next to an existing rest — back-to-back rests are two waits with nothing between them,
# never a real plan shape (TODO — collapsed-card review pass). +Exercise and +Circuit stay
# available in every gap; only +Rest is conditional.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_editor_with_items(page, local_server, exercises):
    """Open a live session whose plan is exactly `exercises`, then flip into edit mode."""
    page.goto(local_server)
    page.wait_for_timeout(300)
    page.evaluate(
        """async (exercises) => {
            const ctrlUrl = new URL('controllers/activeSessionController.js', document.baseURI).href;
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const ctrl = await import(ctrlUrl);
            const store = await import(stateUrl);
            const state = store.getState();
            const clientId = state.clients[0].id;
            ctrl.openSessionFromHistory({
                id: 'rest-adjacency-log',
                clientId,
                routineName: 'Rest Adjacency Test',
                date: new Date().toISOString(),
                duration: 0,
                exercises,
            });
            ctrl.enterClipboardEditMode();
        }""",
        exercises,
    )
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(300)


def _insert_bar_has_rest_button(page, index):
    """Whether the Nth top-level insert bar (0-indexed, document order) offers +Rest."""
    return page.evaluate(
        """(index) => {
            const bars = [...document.querySelectorAll('.editor-list > li.editor-insert')];
            return !!bars[index]?.querySelector('.ins-rest');
        }""",
        index,
    )


def test_rest_option_hidden_on_both_sides_of_an_existing_rest(page, local_server):
    # Plan: [exercise A, rest, exercise B] — insert bars land at indices 0,1,2,3 in that order.
    _open_editor_with_items(
        page,
        local_server,
        [
            {
                "id": "exA",
                "type": "exercise",
                "name": "Exercise A",
                "sets": [{"reps": 10, "weight": 20, "completed": False}],
                "circuitId": None,
            },
            {"id": "restX", "type": "rest", "rest": 60, "circuitId": None},
            {
                "id": "exB",
                "type": "exercise",
                "name": "Exercise B",
                "sets": [{"reps": 10, "weight": 20, "completed": False}],
                "circuitId": None,
            },
        ],
    )

    bar_count = page.evaluate(
        "() => document.querySelectorAll('.editor-list > li.editor-insert').length"
    )
    assert bar_count == 4, (
        "one insert bar before, between and after each of the 3 items"
    )

    # Bar 0: before exercise A — not adjacent to the rest, must offer +Rest.
    assert _insert_bar_has_rest_button(page, 0) is True
    # Bar 1: between exercise A and the rest — adjacent to the rest AFTER it, must hide +Rest.
    assert _insert_bar_has_rest_button(page, 1) is False
    # Bar 2: between the rest and exercise B — adjacent to the rest BEFORE it, must hide +Rest.
    assert _insert_bar_has_rest_button(page, 2) is False
    # Bar 3: after exercise B — not adjacent to the rest, must offer +Rest.
    assert _insert_bar_has_rest_button(page, 3) is True


def test_exercise_and_circuit_options_stay_available_next_to_a_rest(page, local_server):
    """Only +Rest is conditional — +Exercise (and +Circuit, at the top level) must still work
    in a gap that hides +Rest, since those never create a back-to-back rest."""
    _open_editor_with_items(
        page,
        local_server,
        [
            {"id": "restX", "type": "rest", "rest": 60, "circuitId": None},
            {
                "id": "exA",
                "type": "exercise",
                "name": "Exercise A",
                "sets": [{"reps": 10, "weight": 20, "completed": False}],
                "circuitId": None,
            },
        ],
    )
    # Bar 0 sits right before the rest at items[0] — +Rest hidden, +Exercise/+Circuit present.
    result = page.evaluate(
        """() => {
            const bar = document.querySelectorAll('.editor-list > li.editor-insert')[0];
            return {
                rest: !!bar.querySelector('.ins-rest'),
                exercise: !!bar.querySelector('.ins-ex'),
                circuit: !!bar.querySelector('.ins-circuit'),
            };
        }"""
    )
    assert result == {"rest": False, "exercise": True, "circuit": True}


def test_rest_option_shown_when_no_rest_is_adjacent(page, local_server):
    _open_editor_with_items(
        page,
        local_server,
        [
            {
                "id": "exA",
                "type": "exercise",
                "name": "Exercise A",
                "sets": [{"reps": 10, "weight": 20, "completed": False}],
                "circuitId": None,
            },
        ],
    )
    assert _insert_bar_has_rest_button(page, 0) is True
    assert _insert_bar_has_rest_button(page, 1) is True
