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


def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("localhost", port)) == 0


@pytest.fixture(scope="session")
def local_server():
    """Serve the app on :8081 via serve.py, which mounts src/ under the /LibrePT/ sub-path just
    like GitHub Pages (base rewrite + SPA fallback). Browser tests therefore run against the real
    production base path. Only started when an e2e test requests it; reuses a running server."""
    proc = None
    if not is_port_open(8081):
        proc = subprocess.Popen(
            [sys.executable, str(REPO_ROOT / "serve.py"), "--port", "8081"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        time.sleep(1.5)  # give it a moment to bind
    yield "http://localhost:8081/LibrePT/"
    if proc:
        proc.terminate()
        proc.wait()
