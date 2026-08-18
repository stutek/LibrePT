# tests/conftest.py — shared pytest fixtures for the whole suite.
# Fixtures live here so both the e2e (browser) tests and the unit (static) tests can use them
# without duplicating setup. Applies to every test under tests/ (including subfolders).

from datetime import datetime, timezone

import hashlib
import re
import json
import sys
import socket
import time
import subprocess
import urllib.request
from pathlib import Path

import pytest

from deploy.local_http_server import DEV_SERVER_BASE_PATH, DEV_SERVER_PORT
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

# tests/conftest.py -> parents[1] is the repo root; the runtime app lives in src/.
REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = REPO_ROOT / "src"


def schema_constant(name):
    r"""A `<name> = <number>` constant, straight out of src/data/migrationSteps.js.

    Shared rather than redefined per test file. Four copies of this parser existed, each with a
    `\d+` pattern, which truncated any non-integer version and would silently pass an assertion
    against a version the app never had. One definition, one pattern that accepts a number or the
    literal "P", and `%g` at the call site when a numeric value has to match rendered text.
    """
    source = (SRC_DIR / "data" / "migrationSteps.js").read_text(encoding="utf-8")
    match = re.search(rf'{name} = "?([\w.]+)"?', source)
    assert match, f"{name} is not declared in migrationSteps.js"
    raw = match.group(1)
    # A version is a number OR the literal "P" — the preview schema is deliberately not a number,
    # so this has to hand back whichever it found rather than coercing.
    try:
        return float(raw)
    except ValueError:
        return raw


def current_schema_version():
    """CURRENT_SCHEMA_VERSION — what a migrated database must end up stamped at."""
    return schema_constant("CURRENT_SCHEMA_VERSION")


def baseline_schema_version():
    """BASELINE_SCHEMA_VERSION — the floor a pre-release database re-enters the chain at."""
    return schema_constant("BASELINE_SCHEMA_VERSION")


@pytest.fixture
def src_dir():
    """Path to the runtime app root (src/), so unit tests don't depend on the CWD."""
    return SRC_DIR


# Script that pre-accepts the first-run Terms & disclaimer modal (10.2) before the app boots,
# so the one-time mandatory agreement doesn't overlay the UI a browser test is driving. Runs in
# a fresh document via add_init_script, i.e. before app.js reads the flag.
ACCEPT_TERMS_SCRIPT = "window.localStorage.setItem('librept_terms_accepted', '1');"

# Generous, because this runs on the very first interaction after a cold navigation, when parallel
# xdist workers are all compiling the app's ~89 ES modules at once — the same contention the
# `page.goto` budget below is raised for.
SPLASH_DISMISS_TIMEOUT_MS = 20000

# The PRE-EMPTIVE X tap is an opportunity, not a wait, and must not borrow the budget above.
# `#splash-dismiss` is static markup in index.html, visible from the first paint, so when it is
# offered at all it is actionable in milliseconds. The one case where it is NOT offered is the one
# that matters: on an empty database the language step withdraws it (splashScreen.js sets `hidden`)
# until a language is answered — so with the full 20s budget, every `clean_start` navigation sat in
# a swallowed timeout waiting for a control the app is deliberately not showing.
#
# Measured 2026-08-07: 20.85s for a single-navigation clean_start test in isolation, ~1.2s of which
# was real work; ~350s across the e2e suite, more than half its total call time, spread over 17
# tests that all clocked in at a suspiciously identical ~21.2s. Falling through fast costs nothing —
# the state machine below already handles the language branch, and the second tap after the answer
# still carries the full budget, which is where an X is genuinely expected.
SPLASH_EARLY_TAP_TIMEOUT_MS = 1500


@pytest.fixture(autouse=True)
def accept_first_run_terms(request):
    """Auto-accept the first-run Terms modal for browser tests that use the shared `page`
    fixture. Tests that exercise the first-run agreement itself build their own context (via the
    `browser` fixture) and deliberately skip this so the modal appears. Unit tests never request
    `page`, so this never starts a browser for them."""
    if "page" in request.fixturenames:
        request.getfixturevalue("page").add_init_script(ACCEPT_TERMS_SCRIPT)
    yield


@pytest.fixture(autouse=True)
def dismiss_splash(request):
    """Click the splash's dismiss X after every browser-test navigation, so the cold-start splash's
    5s hold (and, on an empty database, its blocking onboarding panel) is not paid on each of the
    ~100 `page.goto` calls in the suite.

    It drives the REAL control a user has, rather than the `?splash=off` deep-link parameter this
    first used. Two reasons that is better: the suite then exercises the production path instead of
    a bypass, and appending a query parameter to every navigation changed what the app's own URLs
    looked like — which broke assertions about the route the router had landed on. The X costs
    ~384ms per navigation over that parameter (measured 2026-08-07: 869ms vs 486ms from goto
    returning to the splash being hidden) — ~5s of a 177s stage across the workers, which is not
    worth either property.

    Seeding `librept_splash_held` instead is not an option: it zeroes the hold, but the language
    step and the onboarding panel are gated on the database being empty rather than on the hold, so
    a seeded session still sits behind a blocking panel (measured the same day — it never hides).

    Wrapping `page.goto` rather than editing every call site: getting past the splash is a property
    of the app under test, not of any one test, and a wrapper cannot drift the way ~100 hand-edited
    call sites would. Tests marked `keep_splash` are left alone — they are the ones testing it."""
    if "page" not in request.fixturenames or "keep_splash" in request.keywords:
        yield
        return
    page = request.getfixturevalue("page")
    navigate = page.goto

    def click_dismiss_if_present(timeout=SPLASH_DISMISS_TIMEOUT_MS):
        """Best-effort: the splash may already be on its way out, or be holding its X back behind
        the language step, leaving no X to hit."""
        try:
            page.locator("#splash-dismiss").click(timeout=timeout)
        except PlaywrightTimeoutError:
            pass

    def goto_and_dismiss_splash(url, **kwargs):
        response = navigate(url, **kwargs)
        splash = page.locator("#app-splash")
        # Absent only if a test navigated somewhere that is not the app shell.
        if not splash.count():
            return response

        # Click FIRST, then wait — never sample the splash's state the moment goto returns.
        # `page.goto` resolves on `load`, while app.js is still compiling its ~89 modules, so at
        # that instant the splash has not yet decided what it is going to be. Asking
        # `#app-splash-language.is_visible()` there answers "not yet", not "not ever" — and losing
        # that race stranded the suite behind an unanswered language step, because an early X tap
        # is deliberately NOT honoured when a language choice is due (splashScreen.js: the app must
        # not come up in a language nobody picked). Seen 2026-08-07 under xdist contention.
        #
        # Clicking first is safe in every case: pre-boot the tap is captured by theme-boot.js and
        # honoured once the app is ready, and post-boot it dismisses outright. Short budget on
        # purpose (SPLASH_EARLY_TAP_TIMEOUT_MS): this tap is worth taking if there is an X, and
        # worth abandoning immediately if there is not.
        click_dismiss_if_present(SPLASH_EARLY_TAP_TIMEOUT_MS)

        # Now wait for the splash to actually commit to something: gone/going, or holding the
        # language step up. Both branches resolve fast — the early tap short-circuits the 5s hold
        # everywhere it is allowed to.
        page.wait_for_function(
            """() => {
                const splash = document.getElementById('app-splash');
                if (!splash || splash.hidden || splash.classList.contains('is-dismissing')) {
                    return true;
                }
                const language = document.getElementById('app-splash-language');
                return Boolean(language && !language.hidden);
            }""",
            timeout=SPLASH_DISMISS_TIMEOUT_MS,
        )

        # The language step has no X of its own — it has to be answered before there is anything
        # to dismiss. English, since that is what every assertion in the suite is written against.
        language_step = page.locator("#app-splash-language")
        if language_step.count() and language_step.is_visible():
            page.locator("[data-splash-lang='en']").click(
                timeout=SPLASH_DISMISS_TIMEOUT_MS
            )
            # Answering it restores the X and starts the hold; this second tap cancels that hold
            # (the first one was consumed by the language gate).
            click_dismiss_if_present()

        splash.wait_for(state="hidden", timeout=SPLASH_DISMISS_TIMEOUT_MS)
        return response

    # Exposed for tests/medium/, whose harness replaces app.js with a stub: nothing there wires the
    # dismiss listener, so clicking the X would sit waiting on a button that does nothing. That tier
    # deletes the splash element outright instead (see tests/medium/_harness.py).
    page.goto_without_splash_dismiss = navigate
    page.goto = goto_and_dismiss_splash
    yield


# Playwright's default `page.goto()` budget is 30s. Under contention on the shared local dev server
# (parallel xdist workers' browser contexts each opening ~6 connections to fetch one page's ~89
# assets, worse when the host has other load) that 30s can be spent waiting in the kernel's
# connection queue alone, before the app or Chromium has done anything wrong — seen 2026-08-04,
# unrelated tests failing `Page.goto: Timeout 30000ms` in batches while the box was loaded.
#
# Raised for NAVIGATION ONLY. Action and `expect()` timeouts stay at 30s on purpose: "the page took
# a while to connect" is a latency fact about a contended dev box, but "an element was not
# actionable for 30 seconds" is a claim about the app, and inflating that would launder a real bug
# into a pass (AGENT_RULES §2.A.3 — never forgive a failure you have not root-caused).
NAVIGATION_TIMEOUT_MS = 60000


@pytest.fixture(autouse=True)
def raise_navigation_timeout(request):
    """Apply NAVIGATION_TIMEOUT_MS to the shared `page` fixture.

    Tests that build their OWN context (via the `browser` fixture) are NOT covered here — there is
    no hook to reach a context the test creates itself — so they call
    `page.set_default_navigation_timeout(NAVIGATION_TIMEOUT_MS)` explicitly, the same way they
    already opt into the demo-data seed by hand. That gap is not theoretical: it is why
    test_first_run_terms.py still reported a 30000ms (not 60000ms) navigation timeout on the run
    that first shipped this fixture.
    """
    if "page" in request.fixturenames:
        request.getfixturevalue("page").set_default_navigation_timeout(
            NAVIGATION_TIMEOUT_MS
        )
    yield


# Init script that opts a browser context into the demo dataset. The app no longer autoloads demo
# data — it boots to a clean, empty slate — and the dataset is populated only via the
# ?init=demo_data_load deep-link param (see src/helper/shareLink.js). This rewrites the URL to
# carry that param before app.js reads it, so a test sees the populated demo state exactly as a
# promo deep-link visitor would. Idempotent, and a no-op once the param is already present.
SEED_DEMO_DATA_SCRIPT = """
(() => {
  try {
    const u = new URL(window.location.href);
    if (u.searchParams.get('init') !== 'demo_data_load') {
      u.searchParams.set('init', 'demo_data_load');
      window.history.replaceState(null, '', u);
    }
  } catch (e) {}
})();
"""


@pytest.fixture
def demo_data_script():
    """The SEED_DEMO_DATA_SCRIPT string, for tests that build their OWN context (via `browser`)
    and need the demo dataset — they add it to their context manually, the way they already opt
    into the Terms auto-accept."""
    return SEED_DEMO_DATA_SCRIPT


# A fixed instant every browser test sees as "now". Chosen deliberately: a WEDNESDAY late morning, so the
# demo seed's day buckets ("today", "tomorrow") are unambiguous and no seeded session sits near midnight
# where a slot could cross a date boundary under a test's feet.
#
# A datetime, not a number: Playwright's `set_fixed_time` takes SECONDS when given a number, and passing
# milliseconds put the app in the year 58,600 — where every date rendered as nonsense and the failure
# looked like an unrelated broken feature. A tz-aware datetime cannot be misread that way.
FROZEN_NOW = datetime(2026, 8, 19, 9, 0, 0, tzinfo=timezone.utc)


def wait_for_stored_record(page, collection, matches, timeout=10_000):
    """Block until a record the app just wrote is DURABLE in IndexedDB.

    Saves are enqueued (src/data/writeQueue.js), so a test that writes and then does a full page load —
    a reload, or a `goto` — re-reads the store before the write has flushed and sees nothing. It wins
    that race alone and loses it under a parallel run, which is the worst way for a test to fail: it
    looks like the feature is broken. Written after hitting it twice on 2026-08-18 (the signup round
    trip, then the RSVP ingestion). Waiting for the stored row is also the assertion those tests actually
    want — "it survived", not "the page re-rendered".

    `matches` is a plain dict of field → value, compared with `===`. Deliberately NOT a JS expression:
    the first draft built a predicate with `new Function`, which the app's own CSP forbids
    (`script-src 'self'`) — the same constraint that put the JS unit tests in Node rather than a browser.
    """
    page.wait_for_function(
        """async ([collection, matches]) => {
          const db = await new Promise((resolve) => {
            const request = indexedDB.open('librept');
            request.onsuccess = () => resolve(request.result);
          });
          if (!db.objectStoreNames.contains('schemaP')) return false;
          const rows = await new Promise((resolve) => {
            const request = db
              .transaction('schemaP', 'readonly')
              .objectStore('schemaP')
              .index('byCollection')
              .getAll(collection);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve([]);
          });
          return rows.some((row) =>
            Object.entries(matches).every(([field, value]) => row[field] === value),
          );
        }""",
        arg=[collection, matches],
        timeout=timeout,
    )


def frozen_today_iso():
    """The date every browser test's app believes it is, as `YYYY-MM-DD`.

    Tests used to call `datetime.date.today()` and compare it against a URL the app derived from its own
    clock. That agreed by luck: it was already a midnight race (a test starting at 23:59:59 and asserting
    at 00:00:01 fails), and it broke outright once the app's clock was frozen. One source for "today"
    removes both.
    """
    return frozen_today().strftime("%Y-%m-%d")


def frozen_today():
    """The frozen "today" as a `date`, for tests that need to do arithmetic on it (tomorrow, +3 days)."""
    return FROZEN_NOW.astimezone().date()


def frozen_now():
    """The frozen instant itself, for tests asserting that the app wrote a timestamp "just now"."""
    return FROZEN_NOW


@pytest.fixture(autouse=True)
def freeze_wall_clock(request):
    """Pin `Date.now()` for browser tests, so what the app calls "now" does not depend on when the suite
    happens to run.

    **This exists because CI caught what three local runs did not** (2026-08-18): the demo seed generates
    sessions RELATIVE TO NOW (src/data/sessions.js), so a test typing a literal time collided with a
    seeded session at some hours and not others. The failure surfaced as an unrelated schedule-conflict
    dialog and read as a broken feature. Anything derived from the clock — seeded slots, day buckets,
    overdue labels — is now the same at 03:00 as at 23:00.

    **`set_fixed_time`, NOT `install()`.** Installing a fake clock replaces the timers too, which would
    stop the rest timer, the session clock and the splash hold from advancing at all — tests that measure
    elapsed time would then be asserting against a clock nobody is winding. Fixing only the wall clock
    leaves every timer running for real.

    Opt out with `@pytest.mark.real_clock` for a test whose subject IS the passage of wall-clock time.
    """
    if "page" in request.fixturenames and "real_clock" not in request.keywords:
        page = request.getfixturevalue("page")
        page.clock.set_fixed_time(FROZEN_NOW)
    yield


@pytest.fixture(autouse=True)
def seed_demo_data(request):
    """Populate the demo dataset for browser tests that rely on it. The app boots empty; the demo
    dataset is opt-in via ?init=demo_data_load. This injects that param for every test using the
    shared `page` fixture, EXCEPT those marked `clean_start` — which exercise the empty-boot /
    init-gating behaviour and must control the param themselves. Tests with their own context use
    the `demo_data_script` fixture instead. Unit tests never request `page`, so this is a no-op
    for them."""
    if "page" in request.fixturenames and "clean_start" not in request.keywords:
        request.getfixturevalue("page").add_init_script(SEED_DEMO_DATA_SCRIPT)
    yield


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "clean_start: boot the app to an empty slate (skip the demo-data seed injection)",
    )
    config.addinivalue_line(
        "markers",
        "keep_splash: leave the cold-start splash up (skip the auto-dismiss) — for testing it",
    )
    config.addinivalue_line(
        "markers",
        "real_clock: let the wall clock run (skip the frozen Date.now) — for tests about elapsed time",
    )


def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


SERVER_PATH = REPO_ROOT / "deploy" / "local_http_server.py"


def _source_revision():
    """SHA-256 of the dev server's source as it is on disk right now."""
    return hashlib.sha256(SERVER_PATH.read_bytes()).hexdigest()


def _running_revision(base_url):
    """The revision the already-running server reports, or None if it is too old to report one."""
    try:
        with urllib.request.urlopen(f"{base_url}__server_revision__", timeout=5) as r:
            return json.load(r).get("revision")
    except Exception:
        return None


def assert_server_is_current(base_url):
    """Refuse to test against a dev server running code older than the working tree.

    AGENT_RULES §2.C keeps this server alive across tasks on purpose, so it can outlive edits to
    its own source — and when it does, nothing says so. On 2026-08-04 a server started four days
    earlier was still serving with the default listen backlog of 5, long after the fix raising it
    to 128 had been committed and "verified": every parallel browser run in between had been
    hitting the precise bottleneck that fix removed, and the `Page.goto` timeouts it caused were
    misattributed to CPU load and worker counts across hours of debugging. A gate measurement taken
    against the wrong build is worse than no measurement, because it is trusted.
    """
    if _running_revision(base_url) == _source_revision():
        return
    raise RuntimeError(
        f"The dev server on :{DEV_SERVER_PORT} is running a DIFFERENT revision of "
        "deploy/local_http_server.py than the working tree (or is too old to report one).\n"
        "    Its behaviour — listen backlog, headers, SPA fallback — is therefore not what this "
        "checkout says it is, and any result from this run is untrustworthy.\n"
        "    Restart it:  pkill -f local_http_server && "
        f".venv/bin/python -m deploy.local_http_server --port {DEV_SERVER_PORT}"
    )


@pytest.fixture(scope="session")
def local_server():
    """Serve the app on the declared dev-server port via deploy/local_http_server.py, which mounts src/ under the
    /LibrePT/ sub-path just like GitHub Pages (base rewrite + SPA fallback). Browser tests
    therefore run against the real production base path. Only started when an e2e test requests
    it; reuses a running server.

    The server is intentionally left running after the test session ends. With -n auto,
    each xdist worker has its own session teardown, so terminating the process in teardown
    would kill the server while other workers still have live browser connections (causing
    ERR_CONNECTION_REFUSED). Leaving it running also matches AGENT_RULES.md §C: the user,
    not the agent, is responsible for stopping the dev server.
    """
    if not is_port_open(DEV_SERVER_PORT):
        subprocess.Popen(
            [
                sys.executable,
                str(REPO_ROOT / "deploy" / "local_http_server.py"),
                "--port",
                str(DEV_SERVER_PORT),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        # Poll until the port accepts connections (up to 10 s) instead of a
        # blind sleep — parallel workers with -n auto race to connect and the
        # server was sometimes not ready in time with a fixed 1.5 s delay.
        deadline = time.monotonic() + 10
        while not is_port_open(DEV_SERVER_PORT):
            if time.monotonic() >= deadline:
                raise RuntimeError("Local server did not start within 10 s")
            time.sleep(0.1)

    base_url = f"http://localhost:{DEV_SERVER_PORT}{DEV_SERVER_BASE_PATH}"
    # Whether we just started it or reused one that was already up, prove it is THIS revision
    # before a single test runs — see assert_server_is_current for what a stale one costs.
    assert_server_is_current(base_url)
    yield base_url
    # Server is deliberately NOT terminated here — see docstring above.
