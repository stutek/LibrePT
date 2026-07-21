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
import io
import os
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

# This file lives in deploy/, so the repo root (which holds src/) is one level up.
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(REPO_ROOT, "src")
BASE = "/LibrePT"  # mirror the GitHub Pages project sub-path (the repo name)


class SubPathHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SRC_DIR, **kwargs)

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
    args = parser.parse_args()

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
