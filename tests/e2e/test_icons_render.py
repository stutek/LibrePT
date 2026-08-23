# tests/e2e/test_icons_render.py
# Every icon the app asks for actually DRAWS, and draws the shape it drew before (TODO §12.6).
#
# `agent_tools/icon_coverage.py` compares NAMES from Stage 1, which is the right cheap check and
# structurally cannot see this: after subsetting, a correct class with a declared rule can point at a
# glyph that is no longer in the font. The browser draws nothing, and every name-level check stays
# green. That is not a diagnostic to run by hand when someone remembers — it is a claim the build
# has to hold, so it lives here.
#
# The rendering itself is agent_tools/glyph_render.py, shared rather than reimplemented: the same
# code records the baseline (a deliberate, committed act when the font is regenerated) and checks it
# here, so the two can never disagree about what "the same shape" means.
#
# A SHAPE comparison, not a pixel one. Re-encoding a font legitimately moves antialiasing — measured
# at 3-17 cells of 256 when the faces were subset — while a wrong glyph moved 114. The tolerance sits
# between the two, in the tool, with those numbers written down beside it.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

from agent_tools.glyph_render import (
    BASELINE,
    GRID,
    TOLERANCE,
    SIGNATURE_JS,
    GLYPH_PX,
    icons_to_render,
)


def _signatures(page, local_server):
    """Draw every used icon on the real app page and reduce each to its 16×16 grid."""
    page.goto(local_server)
    page.wait_for_function("() => document.fonts.status === 'loaded'", timeout=20_000)
    return page.evaluate(
        SIGNATURE_JS, {"names": icons_to_render(), "px": GLYPH_PX, "grid": GRID}
    )


def test_no_icon_the_app_uses_draws_nothing(page, local_server):
    """The failure a subset introduces: a class that is right, a rule that exists, and a glyph that
    is not in the font. It renders as an invisible gap — no error, no console warning."""
    signatures = _signatures(page, local_server)

    blank = sorted(
        name for name, signature in signatures.items() if "1" not in signature
    )
    assert not blank, f"these icons drew nothing at all: {', '.join(blank)}"


def test_every_icon_still_draws_the_shape_it_drew_before(page, local_server):
    """The other half: the wrong glyph is also something. A codepoint mapped to another outline —
    which is what merging two icon faces did — renders perfectly happily and looks like an X in a
    box."""
    signatures = _signatures(page, local_server)
    recorded = json.loads(BASELINE.read_text(encoding="utf-8"))

    changed = {}
    for name, signature in signatures.items():
        was = recorded.get(name)
        if was is None:
            continue  # an icon added since the baseline; the blank check above still covers it
        apart = sum(1 for old, new in zip(was, signature) if old != new)
        if apart > TOLERANCE or len(was) != len(signature):
            changed[name] = apart

    assert not changed, (
        "these icons draw a different shape than the recorded baseline "
        f"(cells of {GRID * GRID} differing): {changed}\n"
        "If the font was deliberately regenerated, re-record with:\n"
        "  python -m agent_tools.glyph_render --baseline"
    )


def test_the_baseline_covers_every_icon_the_app_uses(page, local_server):
    """A baseline that has quietly stopped covering the newest icons is a check that reports green
    about a smaller and smaller part of the app."""
    recorded = json.loads(BASELINE.read_text(encoding="utf-8"))

    missing = sorted(set(icons_to_render()) - set(recorded))
    assert not missing, (
        f"no recorded render for: {', '.join(missing)} — run "
        "`python -m agent_tools.glyph_render --baseline`"
    )
