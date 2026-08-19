"""`python -m agent_tools.icon_render` — render the app's launcher icons from the master artwork.

Why this exists: the launcher icons are binaries, so without a rendering path they are effectively
unmaintainable — an agent asked to adjust the mark has nothing to adjust, and hand-editing a PNG is
not something an agent can do at all. `assets/icon-master.png` is the single source of truth (the
clipboard-and-whistle artwork, transparent surround, no background plate); every PNG under
`src/icons/` is derived from it here. "Edit the master, re-run this, commit the lot" is the whole
workflow.

**Sizes come from `src/manifest.json`, not from a list in this file.** Adding an icon entry to the
manifest should not also require remembering to edit a tool; a declared icon with no PNG behind it
is the failure this closes (`tests/unit/test_project_layout.py` catches it after the fact, this
prevents it). The favicon is the one exception, declared below — it is an `index.html` `<link>`, not
a manifest entry, so nothing else states its size.

**`any` and `maskable` are rendered at different scales, and that is the point.** A maskable icon is
cropped by the launcher to whatever shape the platform wants, and only the centred circle of 80%
diameter is guaranteed to survive; artwork drawn edge-to-edge loses its corners. So the maskable
render is deliberately smaller — sized so the artwork's bounding box fits *inside* that circle —
while the `any` render fills its square, because nothing crops it. Declaring one file as both (which
this app did until now) means one of the two is wrong.

Not a Stage 1/2 gate (see agent_tools/INDEX.md's no-browser bar): rasterizing needs Chromium, so this
is a manual tool an agent runs when the artwork changes. Chromium rather than a new `cairosvg`/Pillow
dependency because Playwright is already a dev dependency.

Usage:
  python -m agent_tools.icon_render            # rewrite every derived PNG
  python -m agent_tools.icon_render --check    # exit 1 if any derived PNG is stale
"""

import argparse
import base64
import json
import math
import pathlib
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"
MANIFEST = SRC / "manifest.json"

# The master lives OUTSIDE src/ deliberately: run_build copies that tree wholesale into dist/, so a
# ~900KB design source parked there would ship to production and be hashed into the integrity
# catalog for nothing. It is design tooling, not a runtime asset.
MASTER = REPO_ROOT / "assets" / "icon-master.png"

# The plate the artwork is composited onto for the LAUNCHER icons, which must be opaque — a PWA
# icon with transparent pixels gets an unpredictable backing from the OS. Matches the manifest's own
# background_color/theme_color, so the icon and the app's chrome are the same black.
#
# Everything the app renders INSIDE itself is transparent instead (background=None below): the
# header mark, the favicon and the splash mark all sit on a themed surface that ranges from
# zinc-950 to near-white, so a baked dark plate would show up as a black square on the light themes.
BACKGROUND = "#09090b"

# Renders the app references directly rather than through the manifest, so nothing else states
# their sizes: the browser-tab favicon, and the mark in the app's own header.
#
# ONLY the favicon crops to the whistle. At 16-32px the full mark is unreadable — board-plus-clip-
# plus-whistle resolves to a grey smudge with a green dot in it, and the reference artwork this was
# cut from hits the same wall in its own 16px sample — so the tab gets one bold shape filling the
# frame. The crop is measured off the master's green pixels rather than hardcoded, so it follows the
# artwork if the mark is redrawn.
#
# The HEADER mark is the full clipboard, and the crop is exactly why it cannot be the whistle: the
# master's whistle sits on the clipboard's opaque white page, so cropping to it carries that page
# along as a white plate. In the header that plate reads as a white tile on every theme AND clips
# the emerald drop-shadow glow to a square behind it (applicationHeader.css) — the glow is drawn
# from the image's alpha silhouette, and a fully opaque square has none to follow. The full mark's
# surround is transparent, so the glow traces the board. Rendered at 96 for a 34px slot: enough for
# a 2x phone display without the browser resampling it.
FAVICON = (32, "icons/icon-32.png", "any")
HEADER_MARK = (96, "icons/icon-96.png", "any")

# The splash draws the same full clipboard mark, just far larger.
SPLASH_MARK = (512, "icons/icon-mark-512.png", "any")

DIRECT_RENDERS = (FAVICON, HEADER_MARK, SPLASH_MARK)
WHISTLE_CROP_RENDERS = (FAVICON,)

# Fraction of the canvas the artwork's longer edge occupies, per purpose. `any` leaves a hair of
# breathing room; `maskable` is derived, not chosen — see _maskable_scale().
ANY_SCALE = 0.94
MASKABLE_SAFE_DIAMETER = (
    0.8  # the fraction of the icon a maskable crop is guaranteed to keep
)


def _maskable_scale(aspect_ratio):
    """Largest fraction of the canvas the artwork's longer edge may occupy and still fit entirely
    inside the maskable safe circle, for artwork of the given short/long aspect ratio.

    The binding constraint is the bounding box's half-diagonal against the circle's radius, not its
    edges: a box that fits the circle's width still pokes out at the corners."""
    half_diagonal_per_unit_long_edge = math.hypot(aspect_ratio, 1) / 2
    return (MASKABLE_SAFE_DIAMETER / 2) / half_diagonal_per_unit_long_edge


def declared_icons(manifest):
    """[(size_px, relative_src, purpose)] for every square PNG the manifest declares, smallest first.

    Skips entries whose `sizes` is not a single `NxN` — a multi-size `.ico`, or the `any` keyword an
    SVG entry uses — since a fixed-size rasterizer cannot produce those. An entry declaring both
    purposes is skipped loudly rather than guessed at: the two need different scales, so one file
    cannot honestly serve both."""
    icons = []
    for entry in manifest.get("icons", []):
        spec = entry.get("sizes", "").strip()
        width, _, height = spec.partition("x")
        if not (width.isdigit() and width == height):
            continue
        purpose = entry.get("purpose", "any").strip()
        if purpose not in ("any", "maskable"):
            raise ValueError(
                f"manifest icon {entry['src']!r} declares purpose {purpose!r}; render 'any' and "
                "'maskable' as separate files, they need different scales"
            )
        icons.append((int(width), entry["src"], purpose))
    return sorted(set(icons))


MEASURE_SCRIPT = """
(dataUri) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onerror = () => reject(new Error('master did not decode'));
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    // Bounding box of the emerald mass, i.e. the whistle. Hue-based rather than an exact colour
    // match so the artwork's own light-to-dark shading all counts as one region.
    let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
    for (let p = 0; p < img.width * img.height; p++) {
      const i = p * 4;
      if (data[i + 3] < 128) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (g !== mx) continue;                       // greens only: green must be the dominant channel
      // Absolute thresholds, not a ratio. Channel noise in the near-black keyline (say 2,3,2) has
      // green as its max and a ratio-based saturation of 0.33, so a ratio test alone matched the
      // artwork's outline everywhere and returned the whole image as the "green" box.
      if (mx < 60 || mx - mn < 30) continue;
      const x = p % img.width, y = (p - x) / img.width;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    resolve({ size: [img.width, img.height], greenBox: [minX, minY, maxX, maxY] });
  };
  img.src = dataUri;
})
"""

RENDER_SCRIPT = """
([dataUri, size, scale, background, rect]) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onerror = () => reject(new Error('master did not decode'));
  img.onload = () => {
    const [sx, sy, sw, sh] = rect ?? [0, 0, img.width, img.height];
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (background) {                    // null leaves the canvas transparent
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);
    }
    // Scale against the LONGER edge so portrait artwork stays inside the square either way.
    const longEdge = Math.max(sw, sh);
    const drawW = sw / longEdge * size * scale;
    const drawH = sh / longEdge * size * scale;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH);
    resolve(canvas.toDataURL('image/png'));
  };
  img.src = dataUri;
})
"""


def _data_uri(master_png):
    return "data:image/png;base64," + base64.b64encode(master_png).decode("ascii")


def measure_master(master_png):
    """(aspect_ratio, whistle_rect) — the master's short/long ratio, and the source rectangle the
    favicon crops to, padded past the green so the artwork's black keyline comes with it."""
    from playwright.sync_api import (
        sync_playwright,
    )  # deferred: only the browser path needs it

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        page.set_content("<html><body></body></html>")
        measured = page.evaluate(MEASURE_SCRIPT, _data_uri(master_png))
        browser.close()

    width, height = measured["size"]
    min_x, min_y, max_x, max_y = measured["greenBox"]
    if max_x < 0:
        raise ValueError(f"{MASTER} contains no green artwork to crop the favicon from")

    pad = round(max(max_x - min_x, max_y - min_y) * 0.05)
    left = max(0, min_x - pad)
    top = max(0, min_y - pad)
    right = min(width, max_x + pad)
    bottom = min(height, max_y + pad)
    return min(width, height) / max(width, height), [
        left,
        top,
        right - left,
        bottom - top,
    ]


def render(
    master_png, size, purpose, aspect_ratio, source_rect=None, background=BACKGROUND
):
    """PNG bytes: the master artwork (or `source_rect` of it) centred at size×size, on `background`
    — or on transparency when `background` is None."""
    from playwright.sync_api import sync_playwright

    scale = ANY_SCALE if purpose == "any" else _maskable_scale(aspect_ratio)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page()
        page.set_content("<html><body></body></html>")
        result = page.evaluate(
            RENDER_SCRIPT,
            [_data_uri(master_png), size, scale, background, source_rect],
        )
        browser.close()
    return base64.b64decode(result.split(",", 1)[1])


def main(argv=None):
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="do not write; exit 1 if any derived PNG differs from the committed one",
    )
    args = parser.parse_args(argv)

    master_png = MASTER.read_bytes()
    try:
        icons = declared_icons(json.loads(MANIFEST.read_text(encoding="utf-8")))
    except ValueError as err:
        print(f"icon_render: {err}", file=sys.stderr)
        return 2
    if not icons:
        print(f"icon_render: {MANIFEST} declares no square PNG icons", file=sys.stderr)
        return 2

    aspect_ratio, whistle_rect = measure_master(master_png)
    stale = []
    for size, relative_src, purpose in icons + list(DIRECT_RENDERS):
        destination = SRC / relative_src
        entry = (size, relative_src, purpose)
        in_app = entry in DIRECT_RENDERS
        png = render(
            master_png,
            size,
            purpose,
            aspect_ratio,
            source_rect=whistle_rect if entry in WHISTLE_CROP_RENDERS else None,
            background=None if in_app else BACKGROUND,
        )
        if args.check:
            if not destination.exists() or destination.read_bytes() != png:
                stale.append(relative_src)
            continue
        destination.write_bytes(png)
        print(f"  {relative_src}  {size}x{size}  {purpose}  {len(png):,} bytes")

    for relative_src in stale:
        print(
            f"src/{relative_src}: out of date with src/icons/icon-master.png — "
            "re-run `python -m agent_tools.icon_render`",
            file=sys.stderr,
        )
    return 1 if stale else 0


if __name__ == "__main__":
    sys.exit(main())
