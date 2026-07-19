# tests/unit/test_project_layout.py
# Static checks that the runtime app has the files/assets it needs, after the move to src/
# and the split of the seed data into src/data/. Uses the src_dir fixture (tests/conftest.py).

import json


def test_runtime_files_present(src_dir):
    for name in ("index.html", "app.js", "index.css", "manifest.json", "sw.js"):
        assert (src_dir / name).exists(), f"missing runtime file: src/{name}"
    assert (src_dir.parent / "LICENSE").exists()


def test_manifest_icons_exist(src_dir):
    """Every icon the PWA manifest advertises must ship, or installation renders a blank tile."""
    manifest = json.loads((src_dir / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["icons"], "manifest.json declares no icons"
    for icon in manifest["icons"]:
        # icon['src'] is relative to the manifest, which lives in src/
        assert (src_dir / icon["src"]).exists(), (
            f"manifest.json references missing icon: {icon['src']}"
        )


def test_seed_data_exports(src_dir):
    """The seed data is split per entity under src/data/, re-exported by the barrel."""
    data = src_dir / "data"
    expected = {
        "exercises.js": "DEFAULT_EXERCISES",
        "clients.js": "DEFAULT_CLIENTS",
        "routines.js": "DEFAULT_ROUTINES",
        "history.js": "DEFAULT_HISTORY",
        "planUpdates.js": "DEFAULT_PLAN_UPDATES",
        "sessions.js": "DEFAULT_SESSIONS",
    }
    for filename, export in expected.items():
        content = (data / filename).read_text(encoding="utf-8")
        assert f"export const {export}" in content, (
            f"src/data/{filename} should export {export}"
        )
    barrel = (data / "index.js").read_text(encoding="utf-8")
    for export in expected.values():
        assert export in barrel, f"src/data/index.js should re-export {export}"
