# tests/unit/test_theme_palette_parity.py
# midnight.css seeds the palette on :root (the global default), so any theme that does NOT redefine a
# palette variable silently inherits midnight's value. That leak once gave the daylight (emerald)
# theme midnight's indigo --secondary, rendering a violet superset accent in the plan editor. Guard
# against the whole class: every theme must define the core palette vars itself. Uses src_dir.

import re

# Palette vars each theme must set on its own so nothing bleeds through midnight's :root default.
CORE_PALETTE_VARS = ("--primary", "--secondary", "--bg-color", "--text-main")


def _theme_files(src_dir):
    return sorted((src_dir / "themes").glob("*.css"))


def _defined_vars(path):
    text = path.read_text(encoding="utf-8")
    return set(re.findall(r"(--[a-z0-9-]+)\s*:", text))


def test_themes_present(src_dir):
    files = _theme_files(src_dir)
    assert {f.stem for f in files} >= {"midnight", "daylight", "red", "blossom", "nebula"}


def test_every_theme_defines_the_core_palette(src_dir):
    for f in _theme_files(src_dir):
        defined = _defined_vars(f)
        missing = [v for v in CORE_PALETTE_VARS if v not in defined]
        assert not missing, (
            f"theme '{f.stem}' does not define {missing}; it would inherit midnight's :root default"
        )
