# tests/unit/test_integrity_catalog.py
# The build writes a SHA-256 integrity catalog (dist/integrity.json) that the service worker verifies
# on precache, so a corrupted download or a version-skewed file can never be cached (README
# "Architectural Invariants"). These checks pin the generator's output shape, its completeness against
# the SW's shell-asset list, and that sw.js actually wires the verification.

import hashlib
import json
import re
import shutil

from build import INTEGRITY_CATALOG_NAME, generate_integrity_catalog


def _shell_assets(sw_text):
    """The same-origin "./..." entries of the sw.js ASSETS array (the precached app shell)."""
    block = sw_text[sw_text.index("const ASSETS = [") :]
    block = block[: block.index("];")]
    return re.findall(r'"(\./[^"]*)"', block)


def _catalog_key(asset):
    """Mirror sw.js integrityKeyFor: strip "./"; the shell root "./" is served as index.html."""
    key = asset[2:]
    return "index.html" if key == "" else key


def test_generate_integrity_catalog_hashes_every_file(tmp_path):
    (tmp_path / "app.js").write_text("console.log('hi');", encoding="utf-8")
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "x.css").write_text("body{}", encoding="utf-8")

    returned = generate_integrity_catalog(str(tmp_path))
    catalog = json.loads(
        (tmp_path / INTEGRITY_CATALOG_NAME).read_text(encoding="utf-8")
    )

    assert catalog["algorithm"] == "SHA-256"
    assert returned == catalog["files"]
    # Nested paths are POSIX-keyed (the path the SW fetches under), never OS-native backslashes.
    assert "sub/x.css" in catalog["files"]
    # Hashes are the real SHA-256 of the bytes.
    for rel in ("app.js", "sub/x.css"):
        expected = hashlib.sha256((tmp_path / rel).read_bytes()).hexdigest()
        assert catalog["files"][rel] == expected
    # The catalog cannot hash itself.
    assert INTEGRITY_CATALOG_NAME not in catalog["files"]


def test_catalog_covers_every_shell_asset(tmp_path, src_dir):
    """Completeness: every asset the SW precaches must have a catalogued hash, or the verified install
    would reject a legitimately-shipped file. Ties the catalog to sw.js's ASSETS list."""
    bundle = tmp_path / "dist"
    shutil.copytree(src_dir, bundle)
    files = generate_integrity_catalog(str(bundle))

    sw = (src_dir / "sw.js").read_text(encoding="utf-8")
    missing = [a for a in _shell_assets(sw) if _catalog_key(a) not in files]
    assert not missing, f"integrity catalog is missing shell assets: {missing}"


def test_service_worker_wires_integrity_verification(src_dir):
    sw = (src_dir / "sw.js").read_text(encoding="utf-8")
    assert "integrity.json" in sw, "sw.js must load the build-time integrity catalog"
    assert 'digest("SHA-256"' in sw, "sw.js must hash precached assets with SHA-256"
    assert "Integrity mismatch" in sw, "sw.js must abort the install on a hash mismatch"
