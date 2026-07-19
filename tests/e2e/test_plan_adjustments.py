# tests/e2e/test_plan_adjustments.py
# End-to-end coverage of the pending plan-adjustments deck and the Apply-Adjustment wizard
# (components/planAdjustments.js): the dashboard renders the seeded unresolved feedback as cards
# with a count badge, the wizard opens pre-filled from a card, and "Apply & Resolve" resolves the
# item and updates the count. Closes the UC2 (feedback -> adjustment) loop under test.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def _cards(page):
    return page.locator("#dashboard-adjustments-list .adjustment-card")


def test_pending_adjustments_deck_renders_seeded_cards(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # Three seeded plan updates start unresolved (src/data/planUpdates.js).
    assert page.locator("#badge-adjustments-count").inner_text().strip() == "3"
    assert _cards(page).count() == 3
    assert "Jane Doe" in _cards(page).first.inner_text()


def test_apply_adjustment_wizard_opens_prefilled(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    card = _cards(page).first
    card.scroll_into_view_if_needed()
    card.locator(".btn-resolve-alert").click()

    dlg = page.locator("#dialog-apply-adjustment")
    assert dlg.get_attribute("open") is not None
    assert page.locator("#adjust-client-name").inner_text().strip() == "Jane Doe"
    # "Too Easy - Increase Load" splits into the tag head and the detail.
    assert page.locator("#adjust-feedback-tag").inner_text().strip() == "Too Easy"

    # The modify panel is the default; swap is hidden.
    assert "hidden" not in (
        page.locator("#adjust-panel-modify").get_attribute("class") or ""
    )
    assert "hidden" in (page.locator("#adjust-panel-swap").get_attribute("class") or "")

    # A "Too Easy" tag pre-fills a positive target weight (the +2.5 kg smart default).
    assert float(page.locator("#adjust-weight").input_value()) > 0


def test_apply_adjustment_resolves_and_drops_the_count(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    card = _cards(page).first
    card.scroll_into_view_if_needed()
    card.locator(".btn-resolve-alert").click()
    page.wait_for_selector("#dialog-apply-adjustment[open]")

    page.locator("#form-apply-adjustment button[type=submit]").click()
    page.wait_for_selector("#dialog-apply-adjustment", state="hidden")

    # The resolved item leaves the deck and the badge decrements.
    assert page.locator("#badge-adjustments-count").inner_text().strip() == "2"
    assert _cards(page).count() == 2
