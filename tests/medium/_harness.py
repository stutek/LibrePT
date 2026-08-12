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

import json


def load_with_stub(page, local_server, stub_js_body):
    """Navigate to `local_server` with app.js replaced by `stub_js_body` (literal ES module
    source, relative imports resolve the same as the real app.js since it's served from the same
    path). Must be called before `page.goto`."""

    def handle(route):
        route.fulfill(body=stub_js_body, content_type="application/javascript")

    page.route("**/app.js", handle)
    # Deliberately NOT the wrapped page.goto: conftest's dismiss_splash clicks the splash's X after
    # every navigation, and the listener behind that X is wired by the real app.js — which this
    # tier replaces with a stub. The click would hang on a dead button until the timeout.
    navigate = getattr(page, "goto_without_splash_dismiss", page.goto)
    navigate(local_server)
    # The cold-start splash is static markup in index.html, and the real app.js is what takes it
    # down (appBoot.bootSplashScreen, the last step of init()). With that app.js stubbed, nothing
    # would ever dismiss it and a fixed, full-screen overlay would sit on top of the one component
    # under test, swallowing every click. It is not part of any single component's contract —
    # tests/e2e/test_splash_screen.py is what covers it — so this tier drops it.
    page.evaluate("() => document.getElementById('app-splash')?.remove()")


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
# driveSyncUi.js) that always boot together in production and share the #backup-btn click wiring:
# backupRestore.js owns the listener, and asks driveSyncUi's handleHeaderCloudTap() first, which
# takes the tap when a sync is possible (TODO §3.11). One shared stub here rather than three
# near-identical copies, so a real change to any of these boot steps' deps shape breaks this ONE
# place, not three silently-drifting ones.
HEADER_STUB = """
import { bootHeader, bootBackupRestore, bootDriveSyncUi } from './appBoot.js';
import { renderHeaderShell, renderSyncBadge } from './modules/common/applicationHeader.js';
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
  renderSessions: noop,
  t,
});
// renderSyncBadge is the real one — a sync starting or failing has to repaint the header cloud,
// and passing a noop here would make the glyph untestable for the exact transitions that matter.
// The notification feed is not mounted in this stub, so its repaint is the one genuine stand-in.
bootDriveSyncUi({ t, renderSyncBadge, renderNotificationArea: noop });
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
  renderClipboardBar: noop,
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


# ---------------------------------------------------------------------------------------------
# The live clipboard (active session).
#
# Half of what remained in tests/e2e/ was one flow — the gym-floor clipboard — and it was stuck
# there for a structural reason rather than a good one: `activeSession`'s shape is implicit. It is
# built in two places inside activeSessionController (startWorkoutSession and the
# openSessionFromHistory path) and consumed in a dozen modules, but written down nowhere, so the
# only reliable way to obtain a valid one was to drive the real flow. This fixture writes that
# contract down, derived from both construction sites:
#
#   activeSession = {
#     id, started, startTime, duration,     // lifecycle — `started` gates the timer and "live" state
#     participants: [clientId],             // iterated, so never undefined
#     activeClientId,                       // which participant's plan is on screen
#     clientRoutines: { [clientId]: clientState },
#     feedback: [],                         // quick signals / modal submissions land here
#     sourceSession,                        // the scheduled session this came from, or null
#   }
#   clientState = {
#     routineId, routineName, activeExerciseIndex,
#     deckAllCollapsed,                     // true on a fresh open: the deck renders NO card in
#                                           // focus until the trainer taps one
#     exercises: [item...],                 // typed items — exercise | rest — in program order
#     logs: { [exerciseId]: [set...] },
#   }
#
# Keeping this in the harness rather than in one test means a change to the real shape breaks one
# place, and the next person reading it learns the contract instead of re-deriving it.
def active_session_fixture(
    client_id="c1a9f0e2", client_name="Jane Doe", exercises=None, **overrides
):
    """A valid activeSession as JS source, for injection via setActiveSession()."""
    items = (
        exercises
        if exercises is not None
        else [
            {
                "id": "x1",
                "name": "Barbell Bench Press",
                "setsTargetCount": 3,
                "repsTarget": 5,
                "weightTarget": 60,
                "loadUnit": "kg",
                "modality": "strength",
                "metric": "reps",
            }
        ]
    )
    session = {
        "id": "s1",
        "started": True,
        "startTime": None,  # replaced with Date.now() below — JSON cannot carry it
        "duration": 0,
        "participants": [client_id],
        "activeClientId": client_id,
        "feedback": [],
        "sourceSession": None,
        "clientRoutines": {
            client_id: {
                "routineId": "r1",
                "routineName": "Upper Body",
                "clientName": client_name,
                "activeExerciseIndex": 0,
                "deckAllCollapsed": False,
                "exercises": items,
                "logs": {},
            }
        },
    }
    session.update(overrides)
    return json.dumps(session).replace('"startTime": null', '"startTime": Date.now()')


def exercise_item(item_id, name, circuit_id=None, **overrides):
    """One `type: 'exercise'` plan item in the shape a session rebuilt from history carries —
    a `sets` array rather than the setsTargetCount/repsTarget authoring fields, because that is what
    the deck and the inline editor actually read once a session is live."""
    item = {
        "id": item_id,
        "type": "exercise",
        "name": name,
        "sets": [{"reps": 10, "weight": 20, "completed": False}],
        "circuitId": circuit_id,
    }
    item.update(overrides)
    return item


def rest_item(item_id, seconds=45, circuit_id=None):
    """One first-class rest — a plan item in its own right, not a property of the exercise before
    it (TODO §8.6), which is why it is focusable and reorderable like any other row."""
    return {"id": item_id, "type": "rest", "rest": seconds, "circuitId": circuit_id}


def clipboard_stub(session_js, extra_imports="", extra_body=""):
    """Mount the live clipboard with an INJECTED session, no router and no session lifecycle.

    `bootActiveSession` is the exact step app.js's `setupActiveSession()` calls, so the overlay
    shell, the deck, the inline plan editor and every listener the ⋯ session menu hangs off are all
    wired the way production wires them — an interaction test taps the same button the trainer does.
    `setActiveSession` is likewise the controller's own public setter, the one the real flow assigns
    through, so this is the production render path fed a known session, not a parallel one.

    Route helpers return real strings rather than noop: sessionFocusPath builds a focus URL and
    calls string methods on what urlFor returns, so a `() => undefined` fake fails deep inside
    rendering with an error that names neither.

    Use for tests asserting what the clipboard RENDERS or how it responds to a tap. Tests about the
    session LIFECYCLE — start, finish, recover from cache, persist to history — belong in
    tests/e2e/, where that lifecycle is the subject rather than the setup, as do the ones asserting
    a focus or edit-mode URL survives a reload (there is no router here to write one).
    """
    return view_stub(
        imports="""
import { bootActiveSession } from './appBoot.js';
import {
  openCatalogPicker,
  setActiveSession,
  renderActiveGroupBoard,
} from './controllers/activeSessionController.js';
import { DEFAULT_CLIENTS, DEFAULT_EXERCISES, DEFAULT_ROUTINES } from './data/index.js';
"""
        + extra_imports,
        view_id="clients",
        body="""
const state = {
  lang: 'en',
  clients: structuredClone(DEFAULT_CLIENTS),
  exercises: structuredClone(DEFAULT_EXERCISES),
  routines: structuredClone(DEFAULT_ROUTINES),
  sessions: [],
  history: [],
  planUpdates: [],
};

// The taxonomy picker is route-backed, and the editor only ever ASKS for its URL — the router's
// route.enter() is what actually opens the dialog (routeTable.js's session.catalog / .slot). With
// no router mounted, navigateToPath must reproduce that one pairing itself, or the editor's 📖
// button navigates into nothing. Same shape as HEADER_STUB's fake, keyed on what urlFor() named.
function navigateToPath(path) {
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === 'session.catalog.slot') {
    openCatalogPicker({ slotId: segments[segments.length - 1] });
  } else if (segments[0] === 'session.catalog') {
    openCatalogPicker({});
  }
}

bootActiveSession({
  state,
  t,
  navigateToPath,
  toRoute: (path) => path || '/',
  replaceRoute: noop,
  resolveRoute: () => ({ name: 'session' }),
  activeRouteName: () => 'session',
  activeRouteIsDialog: () => false,
  urlFor: (name, params = {}) =>
    '/' + name + Object.values(params).map((v) => '/' + v).join(''),
  focusSessionsColumn: noop,
  launchClipboardDirectly: noop,
  newRecordId: () => 'id' + Math.random().toString(36).slice(2),
  renderClipboardBar: noop,
  renderSessions: noop,
  saveToLocalStorage: noop,
});

setActiveSession(__SESSION__);
document.getElementById('active-session-overlay')?.classList.remove('hidden');
renderActiveGroupBoard();
"""
        + extra_body,
    ).replace("__SESSION__", session_js)
