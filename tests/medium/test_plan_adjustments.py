# tests/medium/test_plan_adjustments.py
# The pending plan-adjustments deck and the Apply-Adjustment wizard (modules/plans/planAdjustments.js),
# its own first-class view/route since TODO 4.8: the view renders the seeded unresolved feedback as
# cards with a count badge, the wizard opens pre-filled from a card, and "Apply & Resolve" resolves
# the item and updates the count. Closes the UC2 (feedback -> adjustment) loop under test.
#
# Mounted as a single view via _harness.py's view_stub. The resolve button navigates to the
# `adjustment.apply` route rather than opening the wizard directly, so the stub's fake
# navigateToPath opens it the way that route's enter() does — the alternative, calling the wizard
# from the test, would stop exercising the button's own wiring.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import {
  renderAdjustmentsViewShell,
  renderApplyAdjustmentDialog,
  renderPendingPlanAdjustmentsComponent,
  openAdjustmentWizardComponent,
} from './modules/plans/planAdjustments.js';
import { escapeHTML } from './modules/common/utils.js';
import { DEFAULT_CLIENTS, DEFAULT_PLAN_UPDATES, DEFAULT_ROUTINES } from './data/index.js';
""",
    view_id="adjustments",
    body="""
const state = {
  lang: 'en',
  clients: structuredClone(DEFAULT_CLIENTS),
  routines: structuredClone(DEFAULT_ROUTINES),
  planUpdates: structuredClone(DEFAULT_PLAN_UPDATES),
  exercises: [],
  sessions: [],
  history: [],
};

renderAdjustmentsViewShell();
renderApplyAdjustmentDialog();

function renderDeck() {
  renderPendingPlanAdjustmentsComponent(
    document.getElementById('dashboard-adjustments-list'),
    document.getElementById('badge-adjustments-count'),
    { state, t, escapeHTML, navigateToPath, urlFor },
  );
}

function urlFor(name, params = {}) {
  return `/${name}/${params.updateId ?? params.routineId ?? ''}`;
}

// Stands in for the router: the only route these tests reach is adjustment.apply, which opens the
// wizard for one update. Anything else is a navigation this tier does not model.
function navigateToPath(path) {
  const updateId = path.startsWith('/adjustment.apply/') ? path.split('/')[2] : null;
  if (!updateId) return;
  openAdjustmentWizardComponent(updateId, {
    state,
    t,
    escapeHTML,
    saveToLocalStorage: noop,
    renderRoutinesList: noop,
    renderPendingPlanAdjustments: renderDeck,
  });
}

renderDeck();
""",
)


def _cards(page):
    return page.locator("#dashboard-adjustments-list .adjustment-card")


def test_pending_adjustments_deck_renders_seeded_cards(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-adjustments.active")

    # Three seeded plan updates start unresolved (src/data/planUpdates.js).
    assert page.locator("#badge-adjustments-count").inner_text().strip() == "3"
    assert _cards(page).count() == 3
    assert "Jane Doe" in _cards(page).first.inner_text()


def test_apply_adjustment_wizard_opens_prefilled(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-adjustments.active")

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
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-adjustments.active")

    card = _cards(page).first
    card.scroll_into_view_if_needed()
    card.locator(".btn-resolve-alert").click()
    page.wait_for_selector("#dialog-apply-adjustment[open]")

    page.locator("#form-apply-adjustment button[type=submit]").click()
    page.wait_for_selector("#dialog-apply-adjustment", state="hidden")

    # The resolved item leaves the deck and the badge decrements.
    assert page.locator("#badge-adjustments-count").inner_text().strip() == "2"
    assert _cards(page).count() == 2
