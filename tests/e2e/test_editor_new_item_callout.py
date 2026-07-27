# tests/e2e/test_editor_new_item_callout.py
# Adding a plan item from the live clipboard flips the deck into the inline editor — and a freshly
# inserted row used to look exactly like every other row (an empty name field somewhere down the
# list). The just-added item must therefore be called out: highlighted (.editor-row-added) and
# pre-focused, so the trainer can type the movement straight away. A row that lands blank and holding
# the caret carries NO badge — the caret is the announcement, and a tag next to it is noise; the
# label is reserved for rows the catalog filled in, which take no focus (see
# test_editor_row_catalog_swap.py). The call-out is one-shot: the next insert moves it, it never
# lingers on a row already dealt with.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _open_live_session(page, local_server):
    page.goto(local_server)
    card_sel = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card_sel)
    page.locator(card_sel).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)


def _focused_row_class(page):
    """Classes of the editor row that currently holds the caret ('' when focus is elsewhere)."""
    return page.evaluate(
        """() => {
             const li = document.activeElement?.closest?.('.editor-row, .editor-rest-row');
             return li ? li.className : '';
           }"""
    )


def test_deck_add_exercise_calls_out_the_new_row(page, local_server):
    _open_live_session(page, local_server)

    # The live deck's fast-adjust bar under the in-focus card: "+ Exercise" inserts and jumps to edit.
    page.locator(".fast-adjust-bar .fast-adj-ex").first.click()
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(300)

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
    _open_live_session(page, local_server)

    page.locator(".fast-adjust-bar .fast-adj-rest").first.click()
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(300)

    added = page.locator(".editor-rest-row.editor-row-added")
    assert added.count() == 1
    assert added.locator(".editor-added-badge").count() == 0
    assert page.evaluate(
        "() => document.activeElement.classList.contains('editor-rest-secs')"
    )


def test_call_out_moves_to_the_latest_insert_and_never_lingers(page, local_server):
    _open_live_session(page, local_server)

    page.locator(".fast-adjust-bar .fast-adj-ex").first.click()
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(300)
    first_added_key = page.locator(".editor-row-added").first.get_attribute(
        "data-rowkey"
    )

    # Insert a rest from the editor's own last insert bar: the call-out must follow it.
    page.evaluate(
        """() => {
             const bars = [...document.querySelectorAll('.editor-list > li.editor-insert')];
             bars[bars.length - 1].querySelector('.ins-rest').click();
           }"""
    )
    page.wait_for_timeout(300)

    added = page.locator(".editor-row-added")
    assert added.count() == 1, "the previous row must lose the call-out"
    assert "editor-rest-row" in (added.first.get_attribute("class") or "")
    assert added.first.get_attribute("data-rowkey") != first_added_key

    # A re-render triggered by something OTHER than an insert leaves NO row marked, so a stale
    # highlight can never outlive the moment it describes.
    page.locator(".editor-rest-row.editor-row-added .editor-rest-remove").click()
    page.wait_for_timeout(300)
    assert page.locator(".editor-row-added").count() == 0
