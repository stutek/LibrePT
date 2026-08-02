#!/usr/bin/env python3
"""
Local dev server that mirrors the GitHub Pages deployment.

The live demo is a *project* site served from a sub-path (stutek.github.io/LibrePT/), not a
domain root. Serving src/ at "/" locally (plain `python -m http.server`) hides exactly the
base-path bugs that only surface under the sub-path — which is how the CSS once broke on Pages
while "working" locally. This server removes that gap: it serves the app under the same
/LibrePT/ sub-path, so local dev and the test suite exercise the real production base path.

Behaviour (BASE = "/LibrePT"):
  GET /                         -> 302 redirect to /LibrePT/
  GET /LibrePT/ (or index.html) -> src/index.html with <base href="/"> rewritten to /LibrePT/
                                   (the same rewrite deploy.yml applies when publishing dist/)
  GET /LibrePT/<file>           -> the matching file from src/
  GET /LibrePT/<route> (no file, a clean-URL navigation)
                                -> the index.html shell (SPA fallback), so a deep-link refresh
                                   boots the app, which resolves the route client-side or shows
                                   the in-app not-found view.

Run:  python3 -m deploy.local_http_server [--port 8081]   (or: python3 deploy/local_http_server.py)
Then open http://localhost:8081/  (it redirects to /LibrePT/).
"""

import argparse
import hashlib
import threading
import io
import json
import os
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

# This file lives in deploy/, so the repo root (which holds src/) is one level up.
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(REPO_ROOT, "src")
BASE = "/LibrePT"  # mirror the GitHub Pages project sub-path (the repo name)

INTEGRITY_CATALOG_NAME = "integrity.json"

# Per-request access logging is off by default (see log_message); --verbose brings it back.
VERBOSE = False


def served_bytes(abs_path, rel):
    """The exact bytes this server sends for `rel` — raw file bytes, except index.html, which is
    rewritten to the sub-path <base> just like _send_index_shell serves it. The service worker hashes
    what it downloads, so the catalog must hash what is served, not the raw on-disk file."""
    with open(abs_path, "rb") as f:
        data = f.read()
    if rel == "index.html":
        data = data.replace(
            b'<base href="/">', ('<base href="%s/">' % BASE).encode("ascii")
        )
    return data


def source_fingerprint():
    """A stat-only fingerprint of src/: (path, mtime_ns, size) for every file, no reads.

    This is what lets the catalog be cached without ever going stale on a live edit — touching a
    file changes its mtime or size, which changes the fingerprint, which rebuilds the catalog.
    """
    entries = []
    for root, _dirs, names in os.walk(SRC_DIR):
        for name in sorted(names):
            abs_path = os.path.join(root, name)
            stat = os.stat(abs_path)
            entries.append((abs_path, stat.st_mtime_ns, stat.st_size))
    return tuple(sorted(entries))


_catalog_cache = {}
_catalog_lock = threading.Lock()


def build_dev_integrity_catalog(corrupt=False):
    """A live SHA-256 integrity catalog for the app served out of src/, so the service worker
    verifies its precache in local dev exactly as it will in production — no silently-skipped check.
    `corrupt` (a test-only toggle) flips one hash to drive the mismatch path. Mirrors the shape of
    build.generate_integrity_catalog.

    CACHED on the source fingerprint, because computing it reads and hashes every served file —
    ~21ms of CPU that Python holds the GIL for, blocking every other request in this threaded
    server. Every service-worker install asks for it, so under a parallel test run (one browser per
    core) that cost is paid dozens of times over and serialises the whole suite behind it. A live
    edit still rebuilds it: the fingerprint is exactly what changes when a file does.
    """
    fingerprint = source_fingerprint()
    with _catalog_lock:
        cached = _catalog_cache.get(corrupt)
        if cached and cached[0] == fingerprint:
            return cached[1]

    files = {}
    for root, _dirs, names in os.walk(SRC_DIR):
        for name in names:
            abs_path = os.path.join(root, name)
            rel = os.path.relpath(abs_path, SRC_DIR).replace(os.sep, "/")
            files[rel] = hashlib.sha256(served_bytes(abs_path, rel)).hexdigest()
    if corrupt and "app.js" in files:
        files["app.js"] = (
            "0" * 64
        )  # force a deliberate mismatch for the failure-path e2e test
    catalog = {"algorithm": "SHA-256", "files": dict(sorted(files.items()))}
    with _catalog_lock:
        _catalog_cache[corrupt] = (fingerprint, catalog)
    return catalog


# Security headers mirrored onto every response so the OWASP ZAP baseline scan (build check)
# audits the app the way a hardened host would serve it. The CSP matches the index.html
# <meta> policy plus the directives a meta tag cannot express as a header (frame-ancestors)
# or that do not inherit from default-src (base-uri / form-action / object-src) — otherwise
# ZAP flags "CSP: Failure to Define Directive with No Fallback". microphone is intentionally
# left at its browser default so in-clipboard voice notes keep working.
SECURITY_HEADERS = {
    "Content-Security-Policy": (
        "default-src 'self'; "
        # accounts.google.com serves Google Identity Services' token-client script, loaded lazily
        # only when a trainer taps Connect Google Drive (TODO §1.5/§3.3) — never on boot, so the
        # normal offline-first path never touches it.
        "script-src 'self' https://accounts.google.com; "
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        # Fonts are vendored locally ('self'); only Font Awesome's webfonts still come from cdnjs.
        "font-src 'self' https://cdnjs.cloudflare.com; "
        "img-src 'self' data:; "
        # connect-src governs fetch()/XHR — including the service worker precaching the Font Awesome
        # CDN. Without it, connect falls back to default-src 'self' and the SW's cache.addAll is
        # blocked, which (being atomic) fails the whole precache and breaks offline caching.
        # googleapis.com/oauth2.googleapis.com/accounts.google.com are the Drive appDataFolder sync
        # target and its token endpoints (TODO §1.5) — same lazy, connect-only-when-used story.
        "connect-src 'self' https://cdnjs.cloudflare.com https://www.googleapis.com https://oauth2.googleapis.com https://accounts.google.com; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "object-src 'none'"
    ),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": (
        "geolocation=(), camera=(), payment=(), usb=(), "
        "magnetometer=(), gyroscope=(), accelerometer=()"
    ),
    "Cross-Origin-Opener-Policy": "same-origin",
}


class SubPathHandler(SimpleHTTPRequestHandler):
    # HTTP/1.1 for KEEP-ALIVE. The default (HTTP/1.0) closes the connection after every response, so
    # one page load of this app opens ~89 TCP connections and spawns ~89 server threads — and a
    # parallel test run does that once per browser, per test. Every response below sets
    # Content-Length, which is what makes persistent connections safe here.
    protocol_version = "HTTP/1.1"

    # TCP_NODELAY. Without it, the handler's unbuffered header write and body write leave the kernel
    # waiting on Nagle + the peer's delayed ACK — a flat ~40ms stall on EVERY request. Measured at
    # 3.8s to serve one page load's 89 assets; with it, ~0.1s. That stall is what made page.goto
    # time out once a parallel suite ran a browser per core.
    disable_nagle_algorithm = True
    # Suppress the Python/http.server version leak (ZAP "Server Leaks Version Information").
    server_version = "LibrePT-dev"
    sys_version = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SRC_DIR, **kwargs)

    def log_message(self, fmt, *args):
        """Silence the per-request access log. It is a formatted, lock-contended write to stderr on
        every asset — noise in normal use, and measurable contention when a parallel suite is
        pulling thousands of files. Errors still surface: log_error is untouched."""
        if VERBOSE:
            super().log_message(fmt, *args)

    def end_headers(self):
        # Inject the hardening headers just before the header block closes, so they land on
        # every response — the 302 root redirect, the SPA shell, static assets, and 404s alike.
        for name, value in SECURITY_HEADERS.items():
            self.send_header(name, value)
        super().end_headers()

    def translate_path(self, path):
        # Strip the /LibrePT prefix, then let the base class map the remainder under src/.
        p = urlsplit(path).path
        if p == BASE:
            p = "/"
        elif p.startswith(BASE + "/"):
            p = p[len(BASE) :]
        return super().translate_path(p)

    def send_head(self):
        raw = urlsplit(self.path).path

        # The domain root belongs to the sub-path app.
        if raw in ("", "/"):
            self.send_response(HTTPStatus.FOUND)
            self.send_header("Location", BASE + "/")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        # Nothing is served outside the sub-path.
        if raw != BASE and not raw.startswith(BASE + "/"):
            self.send_error(HTTPStatus.NOT_FOUND, "App is served under %s/" % BASE)
            return None

        rel = raw[len(BASE) :].lstrip("/")

        # The integrity catalog is computed live from src/ (mirrors the build-time dist/integrity.json)
        # so the service worker verifies its precache in dev exactly as in production — never skipped.
        if rel == INTEGRITY_CATALOG_NAME:
            return self._send_integrity_catalog()

        is_navigation = (
            os.path.splitext(rel)[1] == ""
        )  # a clean-URL route has no extension

        # App root, an explicit index request, or a client-side route with no backing file:
        # serve the base-rewritten shell (this is the SPA fallback / "error page").
        if rel in ("", "index.html") or (
            is_navigation and not os.path.isfile(self.translate_path(self.path))
        ):
            return self._send_index_shell()

        return super().send_head()

    def _send_integrity_catalog(self):
        # A test-only cookie flips one hash so the failure-path e2e can drive the mismatch overlay.
        corrupt = "corrupt_integrity=1" in (self.headers.get("Cookie") or "")
        body = json.dumps(build_dev_integrity_catalog(corrupt=corrupt)).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)

    def _send_index_shell(self):
        try:
            with open(os.path.join(SRC_DIR, "index.html"), "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return None
        body = body.replace(
            b'<base href="/">', ('<base href="%s/">' % BASE).encode("ascii")
        )
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return io.BytesIO(body)


def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--port", type=int, default=8081, help="port to listen on (default: 8081)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="log every request (off by default — it is contended noise under a parallel test run)",
    )
    args = parser.parse_args()

    global VERBOSE
    VERBOSE = bool(getattr(args, "verbose", False))
    ThreadingHTTPServer.allow_reuse_address = True
    server = ThreadingHTTPServer(("", args.port), SubPathHandler)
    print(
        "LibrePT dev server: http://localhost:%d%s/  (root redirects here)"
        % (args.port, BASE)
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
