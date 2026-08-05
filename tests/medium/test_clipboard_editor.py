# tests/medium/test_clipboard_editor.py
# The inline plan editor's own behaviour, with the plan handed to it directly: which insert-bar
# options a gap offers, how a freshly inserted row is called out, and that dragging a circuit
# reorders it without corrupting the list. Every one of these is the editor reacting to a tap or a
# drag against a plan the test chose — no navigation, no persistence, no session lifecycle — so the
# clipboard is mounted directly instead of being reached through a dashboard card.
#
# Migrated from tests/e2e/test_editor_insert_bar_rest_adjacency.py,
# tests/e2e/test_editor_new_item_callout.py and tests/e2e/test_editor_circuit_drag.py.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
    rest_item,
)


def _mount(page, local_server, plan, edit_mode=True):
    """Mount the clipboard on `plan`, optionally already flipped into the editor.

    Edit mode is entered through the title bar's ✎ button rather than by calling
    enterClipboardEditMode() — the button is what a trainer taps, and it is wired by the same
    bootActiveSession step production uses."""
    load_with_stub(
        page, local_server, clipboard_stub(active_session_fixture(exercises=plan))
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    if edit_mode:
        page.click("#btn-edit-plan")
        page.wait_for_selector(".clipboard-editor")


# --- insert bar: +Rest is the only conditional option -------------------------------------------
# Back-to-back rests are two waits with nothing between them, never a real plan shape, so +Rest
# hides in any gap where inserting one would land it next to an existing rest. +Exercise and
# +Circuit never create that shape and so stay available everywhere.


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
    _mount(
        page,
        local_server,
        [
            exercise_item("exA", "Exercise A"),
            rest_item("restX", 60),
            exercise_item("exB", "Exercise B"),
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
    _mount(
        page, local_server, [rest_item("restX", 60), exercise_item("exA", "Exercise A")]
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
    _mount(page, local_server, [exercise_item("exA", "Exercise A")])
    assert _insert_bar_has_rest_button(page, 0) is True
    assert _insert_bar_has_rest_button(page, 1) is True


# --- the just-inserted row must be called out ---------------------------------------------------
# A freshly inserted row used to look exactly like every other one (an empty name field somewhere
# down the list). It is now highlighted and pre-focused so the movement can be typed straight away.
# A row that lands blank and holding the caret carries NO badge — the caret is the announcement, and
# a tag next to it is noise. The call-out is one-shot: the next insert moves it, and a re-render
# from anything else clears it, so a stale highlight can never outlive the moment it describes.


def _focused_row_class(page):
    """Classes of the editor row that currently holds the caret ('' when focus is elsewhere)."""
    return page.evaluate(
        """() => {
             const li = document.activeElement?.closest?.('.editor-row, .editor-rest-row');
             return li ? li.className : '';
           }"""
    )


def _click_last_insert_bar(page, option):
    page.evaluate(
        """(option) => {
             const bars = [...document.querySelectorAll('.editor-list > li.editor-insert')];
             bars[bars.length - 1].querySelector(option).click();
           }""",
        option,
    )


def test_deck_add_exercise_calls_out_the_new_row(page, local_server):
    # The live deck's fast-adjust bar under the in-focus card: "+ Exercise" inserts and jumps to
    # edit mode, so this one starts on the deck rather than in the editor.
    _mount(page, local_server, [exercise_item("exA", "Exercise A")], edit_mode=False)
    page.wait_for_selector(".fast-adjust-bar")

    page.locator(".fast-adjust-bar .fast-adj-ex").first.click()
    page.wait_for_selector(".clipboard-editor")

    added = page.locator(".editor-row-added")
    assert added.count() == 1, "exactly one row may be marked as just-added"
    assert added.locator(".editor-added-badge").count() == 0, (
        "a focused blank row needs no badge on top of the caret"
    )
    # Pre-focused on the name field, so the movement can be typed without hunting for the row.
    assert "editor-row-added" in _focused_row_class(page)
    assert page.evaluate(
        "() => document.activeElement.classList.contains('editor-row-name')"
    )


def test_deck_add_rest_calls_out_the_new_rest_row(page, local_server):
    _mount(page, local_server, [exercise_item("exA", "Exercise A")], edit_mode=False)
    page.wait_for_selector(".fast-adjust-bar")

    page.locator(".fast-adjust-bar .fast-adj-rest").first.click()
    page.wait_for_selector(".clipboard-editor")

    added = page.locator(".editor-rest-row.editor-row-added")
    assert added.count() == 1
    assert added.locator(".editor-added-badge").count() == 0
    assert page.evaluate(
        "() => document.activeElement.classList.contains('editor-rest-secs')"
    )


def test_call_out_moves_to_the_latest_insert_and_never_lingers(page, local_server):
    _mount(page, local_server, [exercise_item("exA", "Exercise A")], edit_mode=False)
    page.wait_for_selector(".fast-adjust-bar")

    page.locator(".fast-adjust-bar .fast-adj-ex").first.click()
    page.wait_for_selector(".clipboard-editor")
    first_added_key = page.locator(".editor-row-added").first.get_attribute(
        "data-rowkey"
    )

    # Insert a rest from the editor's own last insert bar: the call-out must follow it.
    _click_last_insert_bar(page, ".ins-rest")
    page.wait_for_selector(".editor-rest-row.editor-row-added")

    added = page.locator(".editor-row-added")
    assert added.count() == 1, "the previous row must lose the call-out"
    assert added.first.get_attribute("data-rowkey") != first_added_key

    # A re-render triggered by something OTHER than an insert leaves NO row marked, so a stale
    # highlight can never outlive the moment it describes.
    page.locator(".editor-rest-row.editor-row-added .editor-rest-remove").click()
    page.wait_for_function(
        "() => document.querySelectorAll('.editor-row-added').length === 0"
    )


# --- dragging a circuit ---------------------------------------------------------------------
# The reorder relocates the dragged <li> in the DOM live, which drops any pointer capture on the
# handle — so the drag runs off document-level listeners and is always finalized (rebuildFromDom +
# commit + re-render). A regression here left the DOM half-moved with orphaned/duplicated insert
# bars, which is why the assertions check list well-formedness and not just the final order.


def _circuit_plan():
    return [
        exercise_item("exA", "Exercise A"),
        exercise_item(
            "exC1",
            "Circuit Move",
            circuit_id="c1",
            circuitTitle="First Circuit",
            circuitSeries=3,
        ),
        exercise_item("exB", "Exercise B"),
    ]


def _top_level_seq(page):
    """The top-level editor units as a compact list: 'BAR' / 'CIRCUIT:<id>' / 'ROW' / 'REST'."""
    return page.evaluate(
        """() => [...document.querySelectorAll('.editor-list > li')].map(li =>
             li.classList.contains('editor-insert') ? 'BAR'
             : li.classList.contains('editor-circuit') ? 'CIRCUIT:' + li.dataset.circuit
             : li.classList.contains('editor-row') ? 'ROW'
             : li.classList.contains('editor-rest-row') ? 'REST'
             : 'other')"""
    )


def _assert_well_formed(seq):
    # A clean render alternates BAR / unit / BAR — never two adjacent insert bars.
    adjacent = [(a, b) for a, b in zip(seq, seq[1:]) if a == "BAR" and b == "BAR"]
    assert not adjacent, f"orphaned/duplicate adjacent insert bars: {seq}"
    assert seq and seq[0] == "BAR" and seq[-1] == "BAR", (
        f"list must be bar-bounded: {seq}"
    )


def _mount_with_new_circuit(page, local_server):
    """A plan that already has one circuit, plus a second added through the editor's own +Circuit —
    the newly added one is what the reported bug corrupted when dragged."""
    _mount(page, local_server, _circuit_plan())
    _click_last_insert_bar(page, ".ins-circuit")
    page.wait_for_function(
        "() => document.querySelectorAll('.editor-list > li.editor-circuit').length === 2"
    )


def _drag_circuit(page, dy=-600):
    handle = page.locator(".editor-list > li.editor-circuit").last.locator(
        ".editor-circuit-head .editor-reorder"
    )
    handle.scroll_into_view_if_needed()
    box = handle.bounding_box()
    assert box and box["width"] > 0, f"handle not laid out: {box}"
    cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(cx, cy)
    page.mouse.down()
    page.wait_for_timeout(30)
    steps = 6
    for step in range(1, steps + 1):
        page.mouse.move(cx, cy + dy * step / steps, steps=3)
        page.wait_for_timeout(30)
    page.mouse.up()
    page.wait_for_timeout(400)


def test_dragging_new_circuit_keeps_editor_well_formed(page, local_server):
    _mount_with_new_circuit(page, local_server)
    before = _top_level_seq(page)
    _assert_well_formed(before)

    _drag_circuit(page, dy=-600)

    after = _top_level_seq(page)
    assert page.locator(".clipboard-editor").count() == 1, (
        "drag wrongly exited edit mode"
    )
    _assert_well_formed(after)
    # Same units before/after — nothing lost or duplicated.
    assert after.count("BAR") == before.count("BAR"), (
        f"unit count changed: {before} -> {after}"
    )
    assert sorted(after) == sorted(before), (
        f"units changed identity: {before} -> {after}"
    )


def test_dragging_reorders_the_circuit(page, local_server):
    _mount_with_new_circuit(page, local_server)
    circuits_before = [u for u in _top_level_seq(page) if u.startswith("CIRCUIT")]
    new_id = circuits_before[-1]

    _drag_circuit(page, dy=-600)

    circuits_after = [u for u in _top_level_seq(page) if u.startswith("CIRCUIT")]
    assert set(circuits_after) == set(circuits_before), (
        "a circuit was lost/duplicated by the drag"
    )
    assert circuits_after.index(new_id) < circuits_before.index(new_id), (
        f"drag did not move the circuit up: {circuits_before} -> {circuits_after}"
    )
