"""`python -m agent_tools.glyph_render --baseline` — record how every icon the app uses is drawn.

Why this exists: [icon_coverage.py](icon_coverage.py) compares NAMES — every `fa-` class in `src/`
against the classes the stylesheet declares — and that is the right Stage 1 check because it is pure
text and costs nothing. But it cannot see the failure mode a SUBSET font introduces (TODO §12.6): a
correct class, a declared rule, and a glyph that is simply not in the font any more. The browser
draws nothing at all, and every name-level check stays green.

So this renders them. Each used icon is drawn through the SHIPPED stylesheet — its `::before`
content and its resolved font, read off a real element — onto a canvas, then reduced to a 16×16
black-and-white grid. That grid is the signature:

  * **blank detection** — an empty grid is a glyph that did not render, whatever the stylesheet says;
  * **before/after comparison** — `--baseline` records the grids, `--check` re-renders and compares.

**A SHAPE comparison, not a pixel comparison, and that distinction is the whole design.** Re-encoding
a font legitimately moves antialiasing by a fraction of a pixel, so byte-identical screenshots would
fail on every icon for no reason a user could see — measured, on the first attempt at this. What must
never change is which glyph appears: a subset that maps a codepoint to the wrong outline, or to the
notdef box, is a defect that renders perfectly happily and looks like an X in a rectangle. At 16×16
those are different grids and a nudged edge is not.

**The CHECK is a test, not a command anyone has to remember.** What this module owns is the
rendering and the comparison rule; tests/e2e/test_icons_render.py imports both and fails the build
when an icon draws nothing or draws something else. A check that only runs when somebody thinks to
run it is a check that reports on whichever font was current the last time somebody thought of it.

What stays a command is RECORDING the baseline, because that is a deliberate act: the font was
regenerated on purpose, the new render was looked at, and the record is committed with it. `--check`
remains for the same session that regenerates, so the answer arrives before the commit rather than
from the pipeline afterwards.

Usage:
  python -m agent_tools.glyph_render --baseline    # after regenerating the font, on purpose
  python -m agent_tools.glyph_render --check       # the same comparison the e2e suite runs
"""

import argparse
import json
import sys

from agent_tools.icon_coverage import REPO_ROOT, scanned_files, used_icons

BASELINE = REPO_ROOT / "agent_tools" / "glyph_render_baseline.json"

# The grid the glyph is reduced to. Coarse enough that antialiasing cannot move a cell, fine enough
# that two icons never collapse to the same picture — 256 cells for ~50 glyphs.
GRID = 16
# How many of the 256 cells may differ before a glyph counts as a DIFFERENT shape.
#
# Measured while subsetting on 2026-08-22, and the two populations are far apart: re-encoding the
# same outline moved 3-17 cells (hinting dropped, edges land differently), while a genuinely wrong
# glyph — the brand icons, when both faces were merged into one family and the codepoints collided —
# moved 114 and 123. Anything in between is worth failing on and looking at.
TOLERANCE = 32

# Drawn large before it is reduced, so thin strokes survive into the grid.
GLYPH_PX = 96

# Reads the app's OWN stylesheet through a real element: the `::before` content and the font the
# cascade resolved, so a renamed family or a repointed `url()` is part of what this checks rather
# than something it assumes. Returns a 256-character signature per icon, and nothing else — no
# screenshots to store, no image library to depend on.
SIGNATURE_JS = r"""
(options) => {
  const { names, px, grid } = options;
  const probe = document.createElement("i");
  document.body.appendChild(probe);
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const small = document.createElement("canvas");
  small.width = grid;
  small.height = grid;
  const smallCtx = small.getContext("2d", { willReadFrequently: true });

  const signatures = {};
  for (const name of names) {
    // Both prefixes are tried and the one that DRAWS wins. Which face carries an icon is a fact
    // about the font, and asking the page beats keeping a list here that has to be corrected every
    // time a brand icon is added or the faces are merged.
    let signature = "";
    for (const family of ["fa-solid", "fa-brands"]) {
    probe.className = `${family} fa-${name}`;
    const style = getComputedStyle(probe, "::before");
    // The stylesheet stores the codepoint as the ::before content, which is where a class becomes a
    // glyph — read it rather than restating it here.
    const glyph = style.content.replace(/^["']|["']$/g, "");
    const font = `${px}px ${getComputedStyle(probe).fontFamily}`;

    ctx.clearRect(0, 0, px, px);
    ctx.fillStyle = "#000";
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, px / 2, px / 2);

    smallCtx.clearRect(0, 0, grid, grid);
    smallCtx.drawImage(canvas, 0, 0, grid, grid);
    const pixels = smallCtx.getImageData(0, 0, grid, grid).data;
    let drawn = "";
    for (let i = 3; i < pixels.length; i += 4) drawn += pixels[i] > 96 ? "1" : "0";
    if (drawn.includes("1")) {
      signature = drawn;
      break;
    }
    }
    signatures[name] = signature;
  }
  probe.remove();
  return signatures;
};
"""


def icons_to_render():
    """Every icon name the app uses, sorted so the recorded file is stable."""
    return sorted(used_icons(scanned_files()))


def render_signatures(url_base):
    """`{icon: signature}` for every used icon, plus the ones that drew nothing at all."""
    from playwright.sync_api import (
        sync_playwright,
    )  # deferred: only the browser path needs it

    names = icons_to_render()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        # The app's own page, so the font is loaded the way the app loads it.
        page.goto(url_base)
        page.wait_for_function(
            "() => document.fonts.status === 'loaded'", timeout=20000
        )
        signatures = page.evaluate(
            SIGNATURE_JS, {"names": names, "px": GLYPH_PX, "grid": GRID}
        )
        browser.close()

    blank = sorted(name for name, sig in signatures.items() if "1" not in sig)
    return signatures, blank


def _cells_apart(recorded_signature, signature):
    """How many of the 256 cells differ. A signature of another length is wholly different — that is
    a font drawing at a size it was not asked for, not an edge landing elsewhere."""
    if len(recorded_signature) != len(signature):
        return len(signature)
    return sum(1 for was, now in zip(recorded_signature, signature) if was != now)


def _report_against_baseline(signatures):
    """Compare a fresh render with the recorded one, and say which icons changed SHAPE."""
    recorded = json.loads(BASELINE.read_text(encoding="utf-8"))
    # An icon the baseline never saw is NEW, not changed: adding one is ordinary work, and reporting
    # it as a regression would train whoever adds the next icon to ignore this tool. It is still
    # covered — a new glyph that draws nothing is caught by the blank check above.
    added = sorted(set(signatures) - set(recorded))
    apart = {
        name: _cells_apart(recorded[name], signature)
        for name, signature in signatures.items()
        if name in recorded
    }
    changed = sorted(name for name, cells in apart.items() if cells > TOLERANCE)
    missing = sorted(set(recorded) - set(signatures))
    for name in changed:
        print(
            f"    ✗ {name} draws a different shape than the baseline recorded "
            f"({apart[name]} of {GRID * GRID} cells)"
        )
    for name in missing:
        print(f"    ✗ {name} is no longer rendered at all")
    if changed or missing:
        return 1
    if added:
        print(f"    ⓘ new since the baseline, rendering: {', '.join(added)}")
    print(
        f"  ✓ All {len(apart)} recorded icons render exactly as the baseline recorded."
    )
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--baseline", action="store_true", help="record what the font renders now"
    )
    parser.add_argument(
        "--check", action="store_true", help="compare against the recorded render"
    )
    parser.add_argument(
        "--url", default=None, help="dev-server base URL (default: derived)"
    )
    args = parser.parse_args(argv)

    if not (args.baseline or args.check):
        parser.error("choose --baseline or --check")

    url_base = args.url
    if not url_base:
        from deploy.local_http_server import dev_server_url

        url_base = dev_server_url("")

    print("\n  Rendering every icon the app uses...")
    hashes, blank = render_signatures(url_base)

    if blank:
        print(f"  ✗ {len(blank)} icon(s) rendered BLANK: {', '.join(sorted(blank))}")
        return 1

    if args.baseline:
        BASELINE.write_text(
            json.dumps(hashes, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        print(f"  ✓ Recorded {len(hashes)} rendered icons in {BASELINE.name}.")
        return 0

    if not BASELINE.exists():
        print(
            f"  ✗ No baseline to compare against — run --baseline first ({BASELINE.name})."
        )
        return 1
    return _report_against_baseline(hashes)


if __name__ == "__main__":
    sys.exit(main())
