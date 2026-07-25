# tests/unit/test_dev_integrity_server.py
# The local dev server computes the SHA-256 integrity catalog live from src/, so the service worker's
# verified precache runs in local dev + e2e exactly as in production (never silently skipped). These
# checks pin that the dev catalog hashes the *served* bytes (index.html carries the sub-path <base>
# rewrite), covers every shell asset, and honours the test-only corrupt toggle.

import hashlib
import os
import re

from deploy.local_http_server import (
    BASE,
    SRC_DIR,
    build_dev_integrity_catalog,
)


def _shell_assets(sw_text):
    block = sw_text[sw_text.index("const ASSETS = [") :]
    block = block[: block.index("];")]
    return re.findall(r'"(\./[^"]*)"', block)


def _catalog_key(asset):
    key = asset[2:]
    return "index.html" if key == "" else key


def test_dev_catalog_hashes_the_served_index_shell():
    """index.html is served with <base href="/"> rewritten to the sub-path; the catalog must hash that
    served form (what the SW downloads), not the raw on-disk file — else every load would false-fail."""
    catalog = build_dev_integrity_catalog()["files"]
    raw = (SRC_DIR and open(os.path.join(SRC_DIR, "index.html"), "rb").read()) or b""
    rewritten = raw.replace(
        b'<base href="/">', ('<base href="%s/">' % BASE).encode("ascii")
    )

    assert catalog["index.html"] == hashlib.sha256(rewritten).hexdigest()
    assert catalog["index.html"] != hashlib.sha256(raw).hexdigest()


def test_dev_catalog_covers_every_shell_asset():
    files = build_dev_integrity_catalog()["files"]
    sw = open(os.path.join(SRC_DIR, "sw.js"), encoding="utf-8").read()
    missing = [a for a in _shell_assets(sw) if _catalog_key(a) not in files]
    assert not missing, f"dev integrity catalog is missing shell assets: {missing}"


def test_dev_catalog_corrupt_toggle_flips_one_hash():
    good = build_dev_integrity_catalog()["files"]["app.js"]
    bad = build_dev_integrity_catalog(corrupt=True)["files"]["app.js"]
    assert good != bad and bad == "0" * 64
