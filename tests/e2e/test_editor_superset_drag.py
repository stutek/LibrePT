# tests/e2e/test_editor_superset_drag.py
# Regression: dragging a card (esp. a newly added superset) in the inline clipboard editor must
# reorder cleanly. The reorder relocates the dragged <li> in the DOM live; doing so drops any
# pointer capture on the handle, so the drag is driven from document-level pointer listeners and
# is always finalized (rebuildFromDom + commit + re-render). A regression here left the DOM half-
# moved with orphaned/duplicated "+ Exercise/+ Superset/+ Rest" insert bars.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_session(page, local_server):
    page.goto(local_server)
    card_sel = ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


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


def _enter_editor_with_new_superset(page, local_server):
    _open_session(page, local_server)
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)
    # Add a new superset via the last top-level insert bar's "+ Superset" button.
    page.evaluate(
        """() => {
          const bars = [...document.querySelectorAll('.editor-list > li.editor-insert')];
          bars[bars.length - 1].querySelector('.ins-ss').click();
        }"""
    )
    page.wait_for_timeout(300)


def _drag_circuit(page, from_last=True, dy=-600):
    sel = ".editor-list > li.editor-circuit"
    handle = (page.locator(sel).last if from_last else page.locator(sel).first).locator(
        ".editor-circuit-head .editor-reorder"
    )
    handle.scroll_into_view_if_needed()
    page.wait_for_timeout(100)
    box = handle.bounding_box()
    assert box and box["width"] > 0, f"handle not laid out: {box}"
    cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(cx, cy)
    page.mouse.down()
    page.wait_for_timeout(30)
    steps = 6
    for i in range(1, steps + 1):
        page.mouse.move(cx, cy + dy * i / steps, steps=3)
        page.wait_for_timeout(30)
    page.mouse.up()
    page.wait_for_timeout(400)


def test_dragging_new_superset_keeps_editor_well_formed(page, local_server):
    _enter_editor_with_new_superset(page, local_server)
    before = _top_level_seq(page)
    _assert_well_formed(before)

    _drag_circuit(
        page, from_last=True, dy=-600
    )  # drag the new superset decisively upward

    after = _top_level_seq(page)
    # Edit mode stays open and the structure is still clean (the reported bug left it corrupted).
    assert page.locator(".clipboard-editor").count() == 1, (
        "drag wrongly exited edit mode"
    )
    _assert_well_formed(after)
    # Same number of units before/after — nothing lost or duplicated.
    assert after.count("BAR") == before.count("BAR"), (
        f"unit count changed: {before} -> {after}"
    )
    assert sorted(after) == sorted(before), (
        f"units changed identity: {before} -> {after}"
    )


def test_dragging_reorders_the_circuit(page, local_server):
    _enter_editor_with_new_superset(page, local_server)
    circuits_before = [u for u in _top_level_seq(page) if u.startswith("CIRCUIT")]
    new_id = circuits_before[-1]

    _drag_circuit(page, from_last=True, dy=-600)  # move the last circuit toward the top

    circuits_after = [u for u in _top_level_seq(page) if u.startswith("CIRCUIT")]
    assert set(circuits_after) == set(circuits_before), (
        "a circuit was lost/duplicated by the drag"
    )
    assert circuits_after.index(new_id) < circuits_before.index(new_id), (
        f"drag did not move the circuit up: {circuits_before} -> {circuits_after}"
    )
