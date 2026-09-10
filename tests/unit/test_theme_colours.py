# tests/unit/test_theme_colours.py
# A theme's own colours may only be written in that theme (TODO §42.7).
#
# Reported 2026-09-10: "nebula tema vizualno premalo loči pretekle kartice od aktivne seje", and then
# "midnight tema: past kartice so obdržale nebula barvo ob preklopu na midnight". One cause behind
# both. The deck's stylesheet painted past cards in `rgba(139, 92, 246, …)` — which is `#8b5cf6`
# written out, which is nebula's `--primary`. So the colour followed the app into every theme (in
# midnight it painted nebula's violet over an emerald palette) and, in nebula itself, it painted the
# accent: the session being RUN and a session from July wore the same colour.
#
# The fix is a token, and this is the check that keeps it one: no component stylesheet may spell out
# a value that a theme defines.
#
# **A RATCHET, not a gate that can be passed** — the same shape as agent_tools/ui_strings.py, and for
# the same reason. There are 21 of these already, spread across a dozen files, and each is a small
# judgement about which token a colour should have been. A check that failed on all of them is a
# check nobody could run, so this one fails when the number goes UP. The sweep is TODO §42.7; bring
# BASELINE down with it.
#
# Pure text analysis, no browser — Stage 1. Uses the src_dir fixture (tests/conftest.py).

import re

# The tokens worth guarding: the ones a theme redefines to BE that theme. A component that hardcodes
# any of them stops following the trainer's choice, silently, in every other theme.
GUARDED = (
    "--primary",
    "--primary-hover",
    "--temporal-past",
    "--temporal-future",
    "--danger",
)

HEX = re.compile(r"#([0-9a-fA-F]{6})\b")
DECLARATION = re.compile(r"^\s*(--[a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;", re.MULTILINE)


def _theme_files(src_dir):
    return [
        *sorted((src_dir / "modules" / "themes").glob("*.css")),
        src_dir / "index.css",
    ]


def _component_files(src_dir):
    themes = {path.resolve() for path in _theme_files(src_dir)}
    return [
        path for path in sorted(src_dir.rglob("*.css")) if path.resolve() not in themes
    ]


def _guarded_values(src_dir):
    """{'#8b5cf6': ['nebula.css --primary', …]} — every colour a theme claims for itself."""
    claimed = {}
    for path in _theme_files(src_dir):
        for token, value in DECLARATION.findall(path.read_text(encoding="utf-8")):
            if token in GUARDED:
                claimed.setdefault(value.lower(), []).append(f"{path.name} {token}")
    return claimed


def _as_rgb_literals(hex_value):
    """The same colour as a component would more likely write it: rgb()/rgba() with any alpha."""
    r, g, b = (int(hex_value[i : i + 2], 16) for i in (1, 3, 5))
    return re.compile(rf"rgba?\(\s*{r}\s*,\s*{g}\s*,\s*{b}\s*[,)]")


# The count on the day the ratchet was fitted, after the past-card fix that produced it.
BASELINE = 21


def _findings(src_dir):
    claimed = _guarded_values(src_dir)
    assert claimed, "no theme tokens found — the guard would pass by finding nothing"

    findings = []
    for path in _component_files(src_dir):
        text = path.read_text(encoding="utf-8")
        # Comments explain the history of exactly these colours, and naming one is not painting with
        # it. Stripped before the scan so a fix cannot be undone by its own explanation.
        code = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
        for value, owners in claimed.items():
            if HEX.search(code) and value in code.lower():
                findings.append(f"{path.name}: {value} is {', '.join(owners)}")
            elif _as_rgb_literals(value).search(code):
                findings.append(
                    f"{path.name}: rgb form of {value} is {', '.join(owners)}"
                )

    return sorted(set(findings))


def test_no_new_component_hardcodes_a_theme_colour(src_dir):
    findings = _findings(src_dir)

    assert len(findings) <= BASELINE, (
        "a component stylesheet hardcodes a colour a theme owns, so it stops following the "
        f"trainer's theme ({len(findings)}, up from {BASELINE}):\n  "
        + "\n  ".join(findings)
    )


def test_the_baseline_comes_down_with_the_sweep(src_dir):
    """Otherwise the ratchet stops holding anything: a file cleaned up leaves room for a new one."""
    findings = _findings(src_dir)

    assert len(findings) >= BASELINE, (
        f"good — {len(findings)} left, below the baseline of {BASELINE}. Set BASELINE = "
        f"{len(findings)} in this file (TODO §42.7)."
    )
