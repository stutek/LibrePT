# tests/medium/test_plan_adjustments.py
# The pending plan-adjustments deck and the Apply-Adjustment wizard (modules/plans/planAdjustments.js),
# its own first-class view/route: the view renders the seeded unresolved feedback as
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
    # The stored key is shown in words from the dictionary; with no note typed, the details say so.
    assert (
        page.locator("#adjust-feedback-tag").inner_text().strip()
        == "Too easy – increase the load"
    )
    assert (
        page.locator("#adjust-details").inner_text().strip() == "No details specified."
    )

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


# A floor-built session: its exercise is in no routine, and the history holds the session the
# signal was given in, under the same id as the review entry.
NO_ROUTINE_STUB = STUB.replace(
    "  planUpdates: structuredClone(DEFAULT_PLAN_UPDATES),\n  exercises: [],\n  sessions: [],\n  history: [],",
    """  planUpdates: [{ id: 'u9', clientId: 'c1a9f0e2', clientName: 'Jane Doe',
    date: '2026-09-27T08:00:00.000Z', exerciseName: 'Floor Squat',
    tag: 'Too Easy - Increase Load', resolved: false }],
  exercises: [],
  sessions: [],
  history: [{ id: 'h9', clientId: 'c1a9f0e2', date: '2026-09-27T08:00:00.000Z',
    exercises: [{ id: 'exF', name: 'Floor Squat', sets: [
      { reps: 10, weight: 40, completed: true }, { reps: 10, weight: 40, completed: true },
      { reps: 10, weight: 40, completed: true }] }],
    feedback: [{ id: 'u9', exerciseName: 'Floor Squat', tag: 'Too Easy - Increase Load' }] }],""",
)


def test_a_signal_from_a_session_without_a_routine(page, local_server):
    """The pencil did nothing for an exercise no routine holds, and the dialog proposed 2.5 kg for a
    squat done at 40 kg, because it added the step to nothing."""
    assert "Floor Squat" in NO_ROUTINE_STUB
    load_with_stub(page, local_server, NO_ROUTINE_STUB)
    page.wait_for_selector("#view-adjustments.active")

    card = _cards(page).first
    assert card.locator(".btn-edit-plan-alert").count() == 0, (
        "a pencil that opens nothing"
    )

    card.locator(".btn-resolve-alert").click()
    assert page.locator("#adjust-weight").input_value() == "42.5"
    assert page.locator("#adjust-reps").input_value() == "10"
    assert page.locator("#adjust-sets").input_value() == "3"


def test_a_slovenian_trainer_reads_the_tag_in_slovenian(page, local_server):
    """The review list printed the stored English key: a trainer who pressed »Prelahko« read
    »Too Easy - Increase Load«. The key stays in the record; only its words are shown."""
    page.add_init_script("globalThis.stubLanguage = 'sl'")
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-adjustments.active")

    badges = page.locator(".adjustment-tag-badge").all_inner_texts()
    assert badges[0] == "Prelahko – povečaj težo"
    assert badges[1] == "Tehnika popušča – pazi na položaj"
    assert not [text for text in badges if "Too Easy" in text or "Form Break" in text]
