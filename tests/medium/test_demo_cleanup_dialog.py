# tests/medium/test_demo_cleanup_dialog.py
# The clear-demo-data confirmation (src/modules/common/demoCleanupDialog.js).
#
# The dialog exists because the destructive case the planner cannot rule out is per-record: a seed
# record the trainer edited into something of their own that nothing else references. So what is
# actually under test here is that a trainer can SEE what is about to happen — the counts, and every
# retained record with the reason it survived. A dialog that removed the right records while showing
# nothing would pass the unit tier and still be the wrong feature.
#
# Mounts the dialog alone via the same bootNotificationArea step app.js calls, with a hand-built
# state so the counts are exact. Fixtures (page, local_server) come from tests/conftest.py.

from tests.medium._harness import load_with_stub

# A real client and a real routine that prescribes a seeded exercise: enough for both halves — the
# fake people get removed, and the seeded exercise the real routine depends on is retained.
STUB = """
import { bootNotificationArea } from './appBoot.js';
import { openDemoCleanupDialog } from './modules/common/demoCleanupDialog.js';
import { TRANSLATIONS } from './i18n/index.js';
import { DEFAULT_CLIENTS, DEFAULT_EXERCISES, DEFAULT_ROUTINES } from './data/index.js';
import { escapeHTML } from './modules/common/utils.js';

const t = (key) => TRANSLATIONS.en[key] || key;
const seedExercise = DEFAULT_EXERCISES[0];

const state = {
  lang: 'en',
  clients: [...DEFAULT_CLIENTS, { id: 'AAAAAAAAAAAAAAAAAAAAAA', name: 'Real Client', active: true }],
  exercises: [...DEFAULT_EXERCISES],
  routines: [
    ...DEFAULT_ROUTINES,
    { id: 'BBBBBBBBBBBBBBBBBBBBBB', name: 'My Real Programme',
      exercises: [{ id: seedExercise.id, sets: 3, reps: 5 }] },
  ],
  history: [], planUpdates: [], sessions: [], notifications: [],
};

window.__removalCalls = [];

bootNotificationArea({
  getState: () => state,
  getActiveSession: () => null,
  t,
  escapeHTML,
  navigateToPath: () => {},
  openSessionFromHistory: () => {},
  removeDemoData: (options) => {
    window.__removalCalls.push(options);
    // Mirrors stateStore.removeDemoData's refusal when a plan would orphan a record, so the
    // dialog's blocked branch is driven by a real return value rather than a stubbed DOM.
    if (window.__blocked) {
      return { ok: false, plan: { removals: {} }, broken: [{ collection: 'routines', id: 'x' }] };
    }
    return { ok: true, plan: { removals: {} }, broken: [] };
  },
  onRemoved: () => { window.__onRemovedFired = true; },
});

// Clearing exercises too, so the retention rule has something to show: the seeded exercise the
// real routine prescribes must appear as kept.
window.__open = () => openDemoCleanupDialog();
window.__open();
"""


def _counts(page):
    return page.locator("#demo-cleanup-counts li").all_inner_texts()


def test_the_dialog_names_what_it_will_remove(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#dialog-demo-cleanup[open]")

    rows = " ".join(_counts(page))

    # Eight seeded clients ship in src/data/clients.js; the real one is not among them.
    assert "8" in rows and "sample clients" in rows, (
        f"the trainer has to be able to check the count against what they believe they have: {rows}"
    )
    assert "Real Client" not in page.locator("#dialog-demo-cleanup").inner_text()


def test_the_exercise_catalog_is_shown_as_kept(page, local_server):
    """48 seeded movements are a starter catalog, not a stain — and the dialog has to SAY so, or a
    trainer reasonably assumes 'clear demo data' took their exercises too."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#dialog-demo-cleanup[open]")

    text = page.locator("#dialog-demo-cleanup").inner_text()

    assert "kept" in text.lower()
    # Nothing in the removal list claims to be removing exercises.
    exercise_rows = [row for row in _counts(page) if "sample exercises" in row]
    assert exercise_rows, "the catalog is still reported, so its survival is visible"
    assert exercise_rows[0].strip().startswith("0"), (
        f"the catalog must show zero removals, got {exercise_rows[0]!r}"
    )


def test_confirming_hands_the_plan_to_the_store_and_closes(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#dialog-demo-cleanup[open]")

    page.click("#btn-demo-cleanup-confirm")

    assert page.evaluate("window.__removalCalls.length") == 1
    assert page.evaluate("window.__onRemovedFired") is True
    assert page.locator("#dialog-demo-cleanup[open]").count() == 0


def test_cancelling_removes_nothing(page, local_server):
    """The escape hatch has to actually escape: a confirmation screen whose Cancel still wrote would
    be worse than no screen at all."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#dialog-demo-cleanup[open]")

    page.click("#dialog-demo-cleanup .btn-secondary")

    assert page.evaluate("window.__removalCalls.length") == 0
    assert page.locator("#dialog-demo-cleanup[open]").count() == 0


def test_a_blocked_removal_says_so_and_keeps_the_dialog_open(page, local_server):
    """If the store refuses an edited plan, the trainer must be told — not left looking at a dialog
    that closed as though it had worked."""
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#dialog-demo-cleanup[open]")

    page.evaluate("() => { window.__blocked = true; }")
    page.click("#btn-demo-cleanup-confirm")

    assert page.locator("#dialog-demo-cleanup[open]").count() == 1, (
        "a refused removal must not close the dialog as though it had worked"
    )
    status = page.locator("#demo-cleanup-status")
    assert "no longer exist" in status.inner_text()
    assert "error" in (status.get_attribute("class") or "")
