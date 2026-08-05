# tests/conftest.py — shared pytest fixtures for the whole suite.
# Fixtures live here so both the e2e (browser) tests and the unit (static) tests can use them
# without duplicating setup. Applies to every test under tests/ (including subfolders).

import hashlib
import json
import sys
import socket
import time
import subprocess
import urllib.request
from pathlib import Path

import pytest

# tests/conftest.py -> parents[1] is the repo root; the runtime app lives in src/.
REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = REPO_ROOT / "src"


@pytest.fixture
def src_dir():
    """Path to the runtime app root (src/), so unit tests don't depend on the CWD."""
    return SRC_DIR


# Script that pre-accepts the first-run Terms & disclaimer modal (10.2) before the app boots,
# so the one-time mandatory agreement doesn't overlay the UI a browser test is driving. Runs in
# a fresh document via add_init_script, i.e. before app.js reads the flag.
ACCEPT_TERMS_SCRIPT = "window.localStorage.setItem('librept_terms_accepted', '1');"


@pytest.fixture(autouse=True)
def accept_first_run_terms(request):
    """Auto-accept the first-run Terms modal for browser tests that use the shared `page`
    fixture. Tests that exercise the first-run agreement itself build their own context (via the
    `browser` fixture) and deliberately skip this so the modal appears. Unit tests never request
    `page`, so this never starts a browser for them."""
    if "page" in request.fixturenames:
        request.getfixturevalue("page").add_init_script(ACCEPT_TERMS_SCRIPT)
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
        "The dev server on :8081 is running a DIFFERENT revision of "
        "deploy/local_http_server.py than the working tree (or is too old to report one).\n"
        "    Its behaviour — listen backlog, headers, SPA fallback — is therefore not what this "
        "checkout says it is, and any result from this run is untrustworthy.\n"
        "    Restart it:  pkill -f local_http_server && "
        ".venv/bin/python -m deploy.local_http_server --port 8081"
    )


@pytest.fixture(scope="session")
def local_server():
    """Serve the app on :8081 via deploy/local_http_server.py, which mounts src/ under the
    /LibrePT/ sub-path just like GitHub Pages (base rewrite + SPA fallback). Browser tests
    therefore run against the real production base path. Only started when an e2e test requests
    it; reuses a running server.

    The server is intentionally left running after the test session ends. With -n auto,
    each xdist worker has its own session teardown, so terminating the process in teardown
    would kill the server while other workers still have live browser connections (causing
    ERR_CONNECTION_REFUSED). Leaving it running also matches AGENT_RULES.md §C: the user,
    not the agent, is responsible for stopping the dev server.
    """
    if not is_port_open(8081):
        subprocess.Popen(
            [
                sys.executable,
                str(REPO_ROOT / "deploy" / "local_http_server.py"),
                "--port",
                "8081",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        # Poll until the port accepts connections (up to 10 s) instead of a
        # blind sleep — parallel workers with -n auto race to connect and the
        # server was sometimes not ready in time with a fixed 1.5 s delay.
        deadline = time.monotonic() + 10
        while not is_port_open(8081):
            if time.monotonic() >= deadline:
                raise RuntimeError("Local server did not start within 10 s")
            time.sleep(0.1)

    base_url = "http://localhost:8081/LibrePT/"
    # Whether we just started it or reused one that was already up, prove it is THIS revision
    # before a single test runs — see assert_server_is_current for what a stale one costs.
    assert_server_is_current(base_url)
    yield base_url
    # Server is deliberately NOT terminated here — see docstring above.
