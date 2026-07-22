# tests/conftest.py — shared pytest fixtures for the whole suite.
# Fixtures live here so both the e2e (browser) tests and the unit (static) tests can use them
# without duplicating setup. Applies to every test under tests/ (including subfolders).

import sys
import socket
import time
import subprocess
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
    yield "http://localhost:8081/LibrePT/"
    # Server is deliberately NOT terminated here — see docstring above.
