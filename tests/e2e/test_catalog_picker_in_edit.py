# tests/e2e/test_catalog_picker_in_edit.py
# TODO §8.5 — the plan edit view (inline clipboard editor) has an "Add from catalog" button that opens
# the reusable filtered taxonomy picker; tapping a movement injects it into the plan (with defaults,
# adjustable inline) and returns to the editor. Fixtures (page, local_server) come from conftest.


def _open_editor(page, local_server):
    page.goto(local_server)
    card = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"
    page.wait_for_selector(card)
    page.locator(card).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(300)
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor")
    page.wait_for_timeout(200)


def test_catalog_picker_adds_exercise_and_returns_to_editor(page, local_server):
    _open_editor(page, local_server)
    before = page.locator(".editor-row").count()

    page.click(".editor-catalog-btn")
    page.wait_for_selector("#dialog-catalog-picker[open]")
    assert page.locator("#catalog-picker-mount .picker-item").count() > 0, (
        "the catalog picker lists movements"
    )

    page.locator("#catalog-picker-mount .picker-item").first.click()
    page.wait_for_timeout(300)

    assert page.locator("#dialog-catalog-picker[open]").count() == 0, (
        "the picker closes after a selection"
    )
    assert page.locator(".clipboard-editor").is_visible(), (
        "and returns to the plan editor"
    )
    assert page.locator(".editor-row").count() == before + 1, (
        "the chosen movement is injected into the plan"
    )
