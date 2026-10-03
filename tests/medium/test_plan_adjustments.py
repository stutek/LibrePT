# tests/medium/test_plan_adjustments.py
# The Pending Review list (modules/plans/planAdjustments.js), its own first-class view/route: it
# renders every unresolved signal as a card with a count badge, shows what the trainer typed with
# it, and resolves a card in one tap without changing any plan. The app sets no training targets:
# an "Apply Program Adjustment" dialog that proposed a load and wrote it into the routine was
# removed (ruled 2026-10-03, Simon); the trainer sets an exercise's parameters when building a plan.
#
# Mounted as a single view via _harness.py's view_stub.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import load_with_stub, view_stub

pytestmark = pytest.mark.clean_start

STUB = view_stub(
    imports="""
import {
  renderAdjustmentsViewShell,
  renderPendingPlanAdjustmentsComponent,
} from './modules/plans/planAdjustments.js';
import { escapeHTML } from './modules/common/utils.js';
import { resolveNote } from './data/trainingRecords.js';
import { DEFAULT_CLIENTS, DEFAULT_PLAN_UPDATES, DEFAULT_ROUTINES } from './data/index.js';
import { toDomainState } from './data/schemaShapes.js';
""",
    view_id="adjustments",
    body="""
// The seed and the fixtures below are written in the old shape; the app reads them converted.
const state = toDomainState({
  lang: 'en',
  clients: structuredClone(DEFAULT_CLIENTS),
  routines: structuredClone(DEFAULT_ROUTINES),
  planUpdates: structuredClone(DEFAULT_PLAN_UPDATES),
  exercises: [],
  sessions: [],
  history: [],
});
window.__state = state;

renderAdjustmentsViewShell();

function urlFor(name, params = {}) {
  return `/${name}/${params.routineId ?? ''}`;
}

function renderDeck() {
  renderPendingPlanAdjustmentsComponent(
    document.getElementById('dashboard-adjustments-list'),
    document.getElementById('badge-adjustments-count'),
    {
      state, t, escapeHTML, navigateToPath: noop, urlFor,
      // What app.js does: resolve, save, draw again.
      onResolve: (id) => { resolveNote(state, id); renderDeck(); },
    },
  );
}

renderDeck();
""",
)


def _cards(page):
    return page.locator("#dashboard-adjustments-list .adjustment-card")


# What the plan holds, one JSON string per routine row: resolving must leave every row as it was.
ROUTINE_ROWS = """() => window.__state.routines.flatMap((r) =>
  r.exercises.map((e) => JSON.stringify({ routine: r.id, ...e })))"""


def test_pending_adjustments_deck_renders_seeded_cards(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-adjustments.active")

    # Three seeded plan updates start unresolved (src/data/planUpdates.js).
    assert page.locator("#badge-adjustments-count").inner_text().strip() == "3"
    assert _cards(page).count() == 3
    assert "Jane Doe" in _cards(page).first.inner_text()


def test_one_tap_resolves_a_card_and_changes_no_plan(page, local_server):
    """The app sets no targets: resolving says the trainer has dealt with the signal, and no
    routine row moves."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#view-adjustments.active")
    before = page.evaluate(ROUTINE_ROWS)

    card = _cards(page).first
    card.scroll_into_view_if_needed()
    card.locator(".btn-resolve-alert").click()

    assert page.locator("#badge-adjustments-count").inner_text().strip() == "2"
    assert _cards(page).count() == 2
    assert page.evaluate(ROUTINE_ROWS) == before
    assert page.locator("#dialog-apply-adjustment").count() == 0, "a dialog still opens"


# A floor-built session: its exercise is in no routine, and the history holds the session the
# signal was given in, under the same id as the review entry, with the trainer's remark.
NO_ROUTINE_STUB = STUB.replace(
    "  planUpdates: structuredClone(DEFAULT_PLAN_UPDATES),\n  exercises: [],\n  sessions: [],\n  history: [],",
    """  planUpdates: [{ id: 'u9', clientId: 'c1a9f0e2', clientName: 'Jane Doe',
    date: '2026-09-27T08:00:00.000Z', exerciseName: 'Floor Squat',
    tag: 'Too Easy - Increase Load - knees stayed out', resolved: false }],
  exercises: [],
  sessions: [],
  history: [{ id: 'h9', clientId: 'c1a9f0e2', date: '2026-09-27T08:00:00.000Z',
    exercises: [{ id: 'exF', name: 'Floor Squat', sets: [
      { reps: 10, weight: 40, completed: true }, { reps: 10, weight: 40, completed: true },
      { reps: 10, weight: 40, completed: true }] }],
    feedback: [{ id: 'u9', exerciseName: 'Floor Squat', tag: 'Too Easy - Increase Load',
      note: 'knees stayed out' }] }],""",
)


def test_the_remark_typed_on_the_floor_is_on_the_card(page, local_server):
    """It was shown only in the dialog resolving opened, which is gone."""
    load_with_stub(page, local_server, NO_ROUTINE_STUB)
    page.wait_for_selector("#view-adjustments.active")

    assert _cards(page).first.locator(".adjustment-remark").inner_text() == "knees stayed out"


def test_a_signal_from_a_session_without_a_routine_has_no_pencil(page, local_server):
    """The pencil opens the routine that holds the exercise; with none it opened nothing."""
    load_with_stub(page, local_server, NO_ROUTINE_STUB)
    page.wait_for_selector("#view-adjustments.active")

    card = _cards(page).first
    assert card.locator(".btn-edit-plan-alert").count() == 0, "a pencil that opens nothing"
    card.locator(".btn-resolve-alert").click()
    assert _cards(page).count() == 0


def test_an_old_record_claiming_a_recording_draws_none(page, local_server):
    """Records written by the removed mock recorder carry `hasVoiceNote: true`. There was never a
    recording, so the card may show neither a file name nor a play button."""
    old = NO_ROUTINE_STUB.replace(
        "knees stayed out', resolved: false }],",
        "knees stayed out', resolved: false, hasVoiceNote: true }],",
    )
    assert old != NO_ROUTINE_STUB
    load_with_stub(page, local_server, old)
    page.wait_for_selector("#view-adjustments.active")

    card = _cards(page).first
    assert "voice_memo" not in card.inner_text()
    assert card.locator(".fa-circle-play").count() == 0


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
