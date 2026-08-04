# tests/medium/_harness.py — shared helper for medium-tier component tests.
# A medium test intercepts the real app.js request and serves a stub module the test writes
# inline (same "each test inlines its own literal JS body" style tests/e2e/ already uses) that
# calls ONE bootXyz(deps) step from src/appBoot.js — the exact function app.js's real init() calls
# — with test-supplied fakes. index.html's real markup still loads unchanged, so the component
# under test wires against the same DOM ids production does; only the boot path (router,
# IndexedDB, service worker, demo-data seed) is skipped, not the markup or the component logic.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.
#
# Two gotchas found converting the first two components, worth knowing before writing another:
#   1. Fake `t` with the REAL translation dict (`TRANSLATIONS.en[key] || key`), never an identity
#      function `(key) => key`. The app's own `t()` only falls back to the raw key when a
#      translation is genuinely MISSING; an identity fake makes every lookup look "missing" and
#      silently breaks any assertion on translated text (a label becomes the key, not the word).
#   2. Import ONLY the specific pure render function you need (e.g. `renderBuildStamp`) rather
#      than pulling in a whole boot step for one side effect — `bootAppLifecycle` also registers
#      the service worker, resizes the viewport, and starts Drive-sync polling, none of which a
#      component test wants running.


def load_with_stub(page, local_server, stub_js_body):
    """Navigate to `local_server` with app.js replaced by `stub_js_body` (literal ES module
    source, relative imports resolve the same as the real app.js since it's served from the same
    path). Must be called before `page.goto`."""

    def handle(route):
        route.fulfill(body=stub_js_body, content_type="application/javascript")

    page.route("**/app.js", handle)
    page.goto(local_server)


# Shared by every test that needs the real header shell + its two route-backed dialogs (Sync &
# Backup, Drive sync card) — three separate components (applicationHeader.js, backupRestore.js,
# driveSyncUi.js) that always boot together in production and share the #backup-btn click wiring
# (backupRestore.js's own listener opens the dialog; driveSyncUi's is a second listener on the
# same button). One shared stub here rather than three near-identical copies, so a real change to
# any of these boot steps' deps shape breaks this ONE place, not three silently-drifting ones.
HEADER_STUB = """
import { bootHeader, bootBackupRestore, bootDriveSyncUi } from './appBoot.js';
import { renderHeaderShell } from './modules/common/applicationHeader.js';
import { prepareBackupDialog } from './modules/common/backupRestore.js';
import { applyStaticDOMMappings } from './i18n/domMappings.js';
import { TRANSLATIONS } from './i18n/index.js';

const t = (key) => TRANSLATIONS.en[key] || key;
const noop = () => {};
const state = {
  lang: 'en', clients: [], routines: [], exercises: [], history: [], planUpdates: [], sessions: [],
};
// The real app.js's applyTranslations() also re-renders the sessions title bar and notification
// area for the new language, on top of this — irrelevant here since neither is mounted, but the
// static DOM-mapping pass itself (menu/label text) is real, not a hand-duplicated stand-in.
function applyTranslations(lang) {
  applyStaticDOMMappings(TRANSLATIONS[lang]);
}

// No real router: a route-backed dialog (build info, backup, about, terms) normally opens because
// the router's route.enter() calls the component's own "prepare, then show" pair. This fake just
// does that same pairing directly, keyed on what urlFor() named the route.
function navigateToPath(path) {
  if (path.includes('backup')) {
    prepareBackupDialog();
    document.getElementById('dialog-backup').showModal();
  } else if (path.includes('about')) {
    document.getElementById('dialog-about').showModal();
  } else if (path.includes('terms')) {
    document.getElementById('dialog-terms').showModal();
  }
}
function urlFor(name) {
  return '/' + name;
}

renderHeaderShell();
bootBackupRestore({
  getState: () => state,
  navigateToPath,
  urlFor,
  setState: noop,
  saveToLocalStorage: noop,
  renderClientsList: noop,
  renderRoutinesList: noop,
  renderExercisesList: noop,
  renderGlobalHistory: noop,
  populateDropdownSelectors: noop,
  t,
});
bootDriveSyncUi({ t });
bootHeader({
  getState: () => state,
  t,
  saveToLocalStorage: noop,
  applyTranslations,
  navigateToPath,
  urlFor,
  renderClientsList: noop,
  renderRoutinesList: noop,
  renderExercisesList: noop,
  renderGlobalHistory: noop,
  renderPendingPlanAdjustments: noop,
  renderSessions: noop,
  populateDropdownSelectors: noop,
  getActiveSession: () => null,
  renderActiveGroupBoard: noop,
  renderActiveSessionBarLabels: noop,
});
"""
