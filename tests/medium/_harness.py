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


def view_stub(imports, view_id, body):
    """Build a stub that mounts ONE view: its shell markup, activated, then `body`.

    A view needs three things the header/dialog components do not, which is why they could not use
    HEADER_STUB and stayed in tests/e2e/ through the first pass:

      1. its shell markup injected into `#main-content` (each view module owns its own `<section>`;
         `index.html` holds only the empty canvas), via the module's own `renderXViewShell()`;
      2. that section marked `.active` — the single thing `routerController.switchView` does that
         matters here, reproduced directly so no router has to be booted;
      3. its render function called with a state, since nothing seeds one.

    `imports` is the literal import block, `view_id` the section's id WITHOUT the `view-` prefix,
    and `body` the mount code. The demo dataset comes from `src/data/index.js` — the same seed the
    real app uses — so counts asserted here ("eight seeded clients") stay true to production rather
    than to a fixture that could drift away from it.
    """
    return f"""
{imports}
import {{ TRANSLATIONS }} from './i18n/index.js';

const t = (key) => TRANSLATIONS.en[key] || key;
const noop = () => {{}};

// switchView() also clears nav highlighting and resolves a main tab; a single mounted view has
// neither, so activating the section is the whole of what it does that this tier can observe.
function activateView(id) {{
  for (const view of document.querySelectorAll('.app-view')) view.classList.remove('active');
  document.getElementById(`view-${{id}}`)?.classList.add('active');
}}

{body}
activateView('{view_id}');
"""


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


# The sessions dashboard: the timeline of day-grouped session cards. Its own shell is
# `renderClientsViewShell` (the dashboard IS #view-clients), and the timeline module must be
# initialised before renderSessions, because renderSessions calls into it for the title bar and
# day grouping. Shared because two files mount exactly this and nothing else.
SESSIONS_STUB = view_stub(
    imports="""
import {
  renderClientsViewShell,
  renderSessions,
} from './modules/sessionList/sessionsView.js';
import { initSessionTimeline } from './modules/sessionList/sessionTimeline.js';
import { DEFAULT_SESSIONS, DEFAULT_CLIENTS, DEFAULT_ROUTINES } from './data/index.js';
""",
    view_id="clients",
    body="""
const state = {
  lang: 'en',
  sessions: structuredClone(DEFAULT_SESSIONS),
  clients: structuredClone(DEFAULT_CLIENTS),
  routines: structuredClone(DEFAULT_ROUTINES),
  exercises: [],
  history: [],
  planUpdates: [],
  notifications: [],
};

renderClientsViewShell();
initSessionTimeline({
  getState: () => state,
  t,
  activeRouteName: () => 'sessions',
  pushRoute: noop,
  urlFor: (name) => `/${name}`,
});
renderSessions({
  state,
  t,
  getActiveSession: () => null,
  launchClipboardDirectly: noop,
  saveToLocalStorage: noop,
  rerenderSessions: noop,
  navigateToPath: noop,
  urlFor: (name) => `/${name}`,
  focusSessionsColumn: noop,
});
""",
)
