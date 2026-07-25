# tests/e2e/test_editor_row_catalog_swap.py
# In the inline plan editor every exercise row carries a 📖 catalog button next to its name combobox:
# the combobox only serves a PT who already knows the movement's name, so the button opens the
# filtered taxonomy picker for THAT row and swaps its movement in place (same slot id, same sets and
# logs), then returns to the editor with the row called out. Friction rules under test: the picker
# opens pre-filtered on the row's muscle group with the caret already in the search box, half-typed
# text carries across as the query, and Enter takes the top match (no scroll, no aimed tap).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_editor(page, local_server):
    page.goto(local_server)
    card = ".booking-card.booking-live, .booking-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card)
    page.locator(card).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)


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
    page.wait_for_timeout(200)

    # The caret starts in the search box, so a named target is type-then-Enter.
    assert page.evaluate(
        "() => document.activeElement.classList.contains('picker-search')"
    ), "the picker must open focused on search"
    # The movement already on the row is not offered as a swap target.
    assert before["name"] not in page.locator("#catalog-picker-mount").inner_text()

    chosen = page.locator("#catalog-picker-mount .picker-item").first
    chosen_name = chosen.locator(".picker-item-name").inner_text().strip()
    chosen.click()
    page.wait_for_timeout(300)

    assert page.locator("#dialog-catalog-picker[open]").count() == 0
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
    page.wait_for_timeout(200)

    # Search across the whole taxonomy, not just the pre-selected muscle group.
    page.click(
        "#catalog-picker-mount .picker-chips[data-axis=muscle] .chip[data-value=All]"
    )
    search = page.locator("#catalog-picker-mount .picker-search")
    search.fill("press")
    page.wait_for_timeout(150)
    matches = page.locator("#catalog-picker-mount .picker-item")
    assert matches.count() > 0
    top = matches.first.locator(".picker-item-name").inner_text().strip()
    assert all(
        "press" in name.lower()
        for name in matches.locator(".picker-item-name").all_inner_texts()
    ), "the search filters the list by name"

    search.press("Enter")
    page.wait_for_timeout(300)
    assert page.locator("#dialog-catalog-picker[open]").count() == 0
    after = _first_row_state(page)
    assert after["name"] == top
    assert after["name"] != before["name"]
