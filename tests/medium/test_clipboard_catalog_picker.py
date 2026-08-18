# tests/medium/test_clipboard_catalog_picker.py
# The taxonomy picker as reached from the inline plan editor, in both of its modes: the editor's own
# "Add from catalog" button (appends a movement) and a ROW's 📖 button (swaps that row's movement in
# place, keeping the slot id, its authored sets and its logs). The combobox on a row only serves a
# PT who already knows the movement's name; the picker is for everyone else, so its friction rules
# are the subject here — it opens pre-filtered on the row's muscle group with the caret already in
# the search box, half-typed text carries across as the query, and Enter takes the top match.
#
# Migrated from tests/e2e/test_editor_row_catalog_swap.py and tests/e2e/test_catalog_picker_in_edit.py.
# The picker dialog is rendered by the same bootActiveSession step production uses, and it lists
# state.exercises — the real seeded taxonomy, so a count or a category asserted here stays true to
# what the app ships.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

from tests.medium._harness import (
    open_plan_editor,
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

# Real entries from the seeded taxonomy (src/data/exercises.js): the row's movement must resolve to
# a catalog category, or the picker has no muscle group to pre-filter on and nothing to exclude.
SEEDED_MOVEMENT = "Barbell Bench Press"


def _open_editor(page, local_server):
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(
                exercises=[
                    exercise_item("exA", SEEDED_MOVEMENT),
                    exercise_item("exB", "Bent-Over Barbell Row"),
                ]
            )
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    open_plan_editor(page)
    page.wait_for_selector(".clipboard-editor")


def _first_row_state(page):
    return page.evaluate(
        """() => {
             const row = document.querySelector('.editor-row');
             return {
               key: row.dataset.rowkey,
               name: row.querySelector('.editor-row-name').value,
               sets: row.querySelector('.editor-f-sets')?.value ?? null,
             };
           }"""
    )


def test_every_exercise_row_offers_the_catalog(page, local_server):
    _open_editor(page, local_server)
    rows = page.locator(".editor-row").count()
    assert rows > 0
    assert page.locator(".editor-row .editor-row-catalog").count() == rows


def test_row_catalog_swaps_the_movement_in_place(page, local_server):
    _open_editor(page, local_server)
    before = _first_row_state(page)
    row_count = page.locator(".editor-row").count()

    page.locator(".editor-row .editor-row-catalog").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]")

    # The caret starts in the search box, so a named target is type-then-Enter.
    assert page.evaluate(
        "() => document.activeElement.classList.contains('picker-search')"
    ), "the picker must open focused on search"
    # The movement already on the row is not offered as a swap target.
    assert before["name"] not in page.locator("#catalog-picker-mount").inner_text()

    chosen = page.locator("#catalog-picker-mount .picker-item").first
    chosen_name = chosen.locator(".picker-item-name").inner_text().strip()
    chosen.click()
    page.wait_for_selector("#dialog-catalog-picker[open]", state="detached")

    after = _first_row_state(page)
    assert after["name"] == chosen_name, "the row now holds the chosen movement"
    assert after["key"] == before["key"], "swapped in place — the row does not move"
    assert after["sets"] == before["sets"], "the slot keeps its authored set count"
    assert page.locator(".editor-row").count() == row_count, "a swap adds no row"
    # Called out as swapped, so the trainer sees which row changed. This row keeps its label: it
    # takes no focus and reads as an ordinary filled row, so the tint alone would not say what
    # happened (a blank row inserted from the clipboard holds the caret instead and needs no tag).
    added = page.locator(".editor-row-added")
    assert added.count() == 1
    assert added.first.get_attribute("data-rowkey") == before["key"]
    assert (
        added.locator(".editor-added-badge").inner_text().strip().lower() == "swapped"
    )


def test_filter_rows_are_labelled_by_axis(page, local_server):
    """Two unlabelled chip rows read as one wall of options, and 'All' appears in both."""
    _open_editor(page, local_server)
    page.locator(".editor-row .editor-row-catalog").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]")

    labels = page.locator("#catalog-picker-mount .picker-chips-label").all_inner_texts()
    assert [label.strip().lower() for label in labels] == ["muscle", "equipment"]


def test_search_narrows_and_enter_takes_the_top_match(page, local_server):
    _open_editor(page, local_server)
    before = _first_row_state(page)

    page.locator(".editor-row .editor-row-catalog").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]")

    # Search across the whole taxonomy, not just the pre-selected muscle group.
    page.click(
        "#catalog-picker-mount .picker-chips[data-axis=muscle] .chip[data-value=All]"
    )
    search = page.locator("#catalog-picker-mount .picker-search")
    search.fill("press")
    page.wait_for_function(
        """() => {
             const names = [...document.querySelectorAll('#catalog-picker-mount .picker-item-name')];
             return names.length > 0 && names.every((n) => n.innerText.toLowerCase().includes('press'));
           }"""
    )
    top = (
        page.locator("#catalog-picker-mount .picker-item")
        .first.locator(".picker-item-name")
        .inner_text()
        .strip()
    )

    search.press("Enter")
    page.wait_for_selector("#dialog-catalog-picker[open]", state="detached")
    after = _first_row_state(page)
    assert after["name"] == top
    assert after["name"] != before["name"]


def test_editor_catalog_button_adds_a_movement_and_returns(page, local_server):
    """The editor-level button APPENDS rather than swapping — same picker, different landing."""
    _open_editor(page, local_server)
    before = page.locator(".editor-row").count()

    page.click(".editor-catalog-btn")
    page.wait_for_selector("#dialog-catalog-picker[open]")
    assert page.locator("#catalog-picker-mount .picker-item").count() > 0, (
        "the catalog picker lists movements"
    )

    page.locator("#catalog-picker-mount .picker-item").first.click()
    page.wait_for_selector("#dialog-catalog-picker[open]", state="detached")

    assert page.locator(".clipboard-editor").is_visible(), (
        "and returns to the plan editor"
    )
    assert page.locator(".editor-row").count() == before + 1, (
        "the chosen movement is injected into the plan"
    )
