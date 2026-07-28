# tests/unit/test_theme_palette_parity.py
# midnight.css seeds the palette on :root (the global default), so any theme that does NOT redefine a
# palette variable silently inherits midnight's value. That leak once gave the daylight (emerald)
# theme midnight's indigo --secondary, rendering a violet circuit accent in the plan editor. Guard
# against the whole class: every theme must define the core palette vars itself. Uses src_dir.

import re

# Palette vars each theme must set on its own so nothing bleeds through midnight's :root default.
# A hover/light companion is part of its base var's own family, not a separate concern — the
# original list caught a theme missing --secondary entirely but not one that redefined --secondary
# while leaving --secondary-hover to inherit a now-mismatched shade from :root, which is exactly
# what daylight did (fixed alongside this test in the same commit).
CORE_PALETTE_VARS = (
    "--primary",
    "--primary-hover",
    "--primary-light",
    "--secondary",
    "--secondary-hover",
    "--secondary-light",
    "--danger",
    "--danger-hover",
    "--danger-light",
    "--success",
    "--success-hover",
    "--warning",
    "--temporal-past",
    "--temporal-future",
    "--bg-color",
    "--text-main",
)


def _theme_files(src_dir):
    return sorted((src_dir / "modules" / "themes").glob("*.css"))


def _defined_vars(path):
    text = path.read_text(encoding="utf-8")
    return set(re.findall(r"(--[a-z0-9-]+)\s*:", text))


def test_themes_present(src_dir):
    files = _theme_files(src_dir)
    assert {f.stem for f in files} >= {
        "midnight",
        "daylight",
        "red",
        "blossom",
        "nebula",
    }


def test_every_theme_defines_the_core_palette(src_dir):
    for f in _theme_files(src_dir):
        defined = _defined_vars(f)
        missing = [v for v in CORE_PALETTE_VARS if v not in defined]
        assert not missing, (
            f"theme '{f.stem}' does not define {missing}; it would inherit midnight's :root default"
        )


def test_themes_define_the_same_variable_set(src_dir):
    """CORE_PALETTE_VARS is a fixed, hand-maintained list — it only catches a gap once someone
    remembers to add the var's name to it (twice already: --secondary's hover/light companions,
    then --warning/--temporal-*). This test needs no maintenance: whichever theme was extended
    most recently defines the reference set, and any other theme missing one of those vars — or
    defining a var none of the others have, a typo'd name masquerading as a new one — fails
    immediately, without anyone having to notice and update a list by hand."""
    files = _theme_files(src_dir)
    per_theme = {f.stem: _defined_vars(f) for f in files}
    union = set().union(*per_theme.values())
    for name, defined in per_theme.items():
        missing = sorted(union - defined)
        assert not missing, (
            f"theme '{name}' is missing {missing}, defined by at least one other theme — "
            "either add it here too or confirm it's genuinely meant to be theme-specific "
            "and drop it from this parity check's expectations"
        )
