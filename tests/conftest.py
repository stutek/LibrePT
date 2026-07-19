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


def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


@pytest.fixture(scope="session")
def local_server():
    """Serve the app on :8081 via deploy/local_http_server.py, which mounts src/ under the
    /LibrePT/ sub-path just like GitHub Pages (base rewrite + SPA fallback). Browser tests
    therefore run against the real production base path. Only started when an e2e test requests
    it; reuses a running server."""
    proc = None
    if not is_port_open(8081):
        proc = subprocess.Popen(
            [
                sys.executable,
                str(REPO_ROOT / "deploy" / "local_http_server.py"),
                "--port",
                "8081",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(1.5)  # give it a moment to bind
    yield "http://localhost:8081/LibrePT/"
    if proc:
        proc.terminate()
        proc.wait()
