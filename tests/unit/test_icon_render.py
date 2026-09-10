# tests/unit/test_icon_render.py
# Covers the pure logic of agent_tools/icon_render.py — manifest parsing and the maskable scale.
# The rasterizing itself needs Chromium and is not exercised here (see agent_tools/INDEX.md's
# no-browser bar for what may gate a build).

import json
import math

import pytest

from agent_tools import icon_render


def test_declared_icons_reads_size_src_and_purpose():
    manifest = {
        "icons": [
            {"src": "icons/icon-512.png", "sizes": "512x512", "purpose": "any"},
            {"src": "icons/icon-192.png", "sizes": "192x192", "purpose": "any"},
        ]
    }
    assert icon_render.declared_icons(manifest) == [
        (192, "icons/icon-192.png", "any"),
        (512, "icons/icon-512.png", "any"),
    ]


def test_declared_icons_defaults_purpose_to_any():
    manifest = {"icons": [{"src": "icons/a.png", "sizes": "48x48"}]}
    assert icon_render.declared_icons(manifest) == [(48, "icons/a.png", "any")]


@pytest.mark.parametrize("sizes", ["any", "16x16 32x32", "512x256", ""])
def test_declared_icons_skips_what_a_fixed_size_rasterizer_cannot_produce(sizes):
    """An SVG entry, a multi-size .ico and a non-square entry are all legal manifest icons that this
    tool has no business rendering — it must skip them rather than crash or guess a size."""
    manifest = {"icons": [{"src": "icons/other", "sizes": sizes}]}
    assert icon_render.declared_icons(manifest) == []


def test_declared_icons_rejects_one_file_serving_both_purposes():
    """`purpose: "any maskable"` is the failure this tool exists to prevent: the two need different
    scales, so a single file is necessarily wrong for one of them."""
    manifest = {
        "icons": [{"src": "icons/x.png", "sizes": "512x512", "purpose": "any maskable"}]
    }
    with pytest.raises(ValueError, match="separate files"):
        icon_render.declared_icons(manifest)


def test_maskable_scale_keeps_the_whole_bounding_box_inside_the_safe_circle():
    """The safe circle is the binding constraint at the CORNERS, not the edges — the check is that
    the scaled box's half-diagonal fits the radius."""
    for aspect_ratio in (0.5, 0.825, 1.0):
        scale = icon_render._maskable_scale(aspect_ratio)
        long_edge = scale
        short_edge = scale * aspect_ratio
        half_diagonal = math.hypot(long_edge, short_edge) / 2
        assert half_diagonal == pytest.approx(
            icon_render.MASKABLE_SAFE_DIAMETER / 2, rel=1e-9
        )


def test_maskable_render_is_smaller_than_the_any_render():
    """Square artwork is the worst case for the safe circle; even so the maskable scale must come
    out below the `any` scale, or the padding that makes it maskable is not there."""
    assert icon_render._maskable_scale(1.0) < icon_render.ANY_SCALE


def test_every_manifest_icon_and_the_favicon_are_rendered(src_dir):
    """The tool's output set must cover what the app actually references: every manifest icon, plus
    the favicon index.html links directly (which no manifest entry declares)."""
    manifest = json.loads((src_dir / "manifest.json").read_text(encoding="utf-8"))
    rendered = {src for _, src, _ in icon_render.declared_icons(manifest)}
    rendered.add(icon_render.FAVICON[1])

    index_html = (src_dir / "index.html").read_text(encoding="utf-8")
    assert f'href="{icon_render.FAVICON[1]}"' in index_html, (
        "index.html should link the favicon this tool renders"
    )
    for relative_src in rendered:
        assert (src_dir / relative_src).exists(), (
            f"src/{relative_src} was never rendered"
        )


def test_master_artwork_is_not_inside_the_shipped_tree():
    """run_build copies src/ wholesale into dist/, so the ~900KB design master must stay out of it
    or it ships to production and is hashed into the integrity catalog."""
    assert icon_render.MASTER.exists(), "the icon master artwork is missing"
    assert icon_render.SRC not in icon_render.MASTER.parents


def _predictor(filter_type, left, up, up_left):
    """The value a PNG row filter predicted for one byte, from its already-decoded neighbours."""
    if filter_type == 0:
        return 0
    if filter_type == 1:
        return left
    if filter_type == 2:
        return up
    if filter_type == 3:
        return (left + up) // 2
    if filter_type == 4:  # Paeth, ties going to left, then up
        estimate = left + up - up_left
        to_left, to_up, to_up_left = (
            abs(estimate - left),
            abs(estimate - up),
            abs(estimate - up_left),
        )
        if to_left <= to_up and to_left <= to_up_left:
            return left
        return up if to_up <= to_up_left else up_left
    raise AssertionError(f"unknown PNG filter type {filter_type}")


def _decode_rgba(png_path):
    """(width, height, pixels) for an 8-bit RGBA PNG, `pixels` being the raw RGBA bytes.

    Hand-rolled because this venv has no Pillow (see agent_tools/icon_render.py on why the renderer
    uses Chromium rather than adding an imaging dependency); stdlib zlib plus the five PNG row
    filters is all it takes."""
    import struct
    import zlib

    raw = png_path.read_bytes()
    assert raw[:8] == b"\x89PNG\r\n\x1a\n", f"{png_path} is not a PNG"

    offset, idat, header = 8, b"", None
    while offset < len(raw):
        (length,) = struct.unpack(">I", raw[offset : offset + 4])
        kind = raw[offset + 4 : offset + 8]
        data = raw[offset + 8 : offset + 8 + length]
        if kind == b"IHDR":
            header = struct.unpack(">IIBBBBB", data)
        elif kind == b"IDAT":
            idat += data
        elif kind == b"IEND":
            break
        offset += 12 + length

    width, height, bit_depth, colour_type, _, _, interlace = header
    assert (bit_depth, colour_type, interlace) == (8, 6, 0), (
        f"{png_path}: expected non-interlaced 8-bit RGBA, got {header}"
    )

    stride = width * 4
    filtered = zlib.decompress(idat)
    pixels = bytearray(stride * height)
    for y in range(height):
        filter_type = filtered[y * (stride + 1)]
        row = filtered[y * (stride + 1) + 1 : (y + 1) * (stride + 1)]
        for x in range(stride):
            left = pixels[y * stride + x - 4] if x >= 4 else 0
            up = pixels[(y - 1) * stride + x] if y >= 1 else 0
            up_left = pixels[(y - 1) * stride + x - 4] if (y >= 1 and x >= 4) else 0
            predicted = _predictor(filter_type, left, up, up_left)
            pixels[y * stride + x] = (row[x] + predicted) & 0xFF
    return width, height, bytes(pixels)


def _top_left_pixel_alpha(png_path):
    """Alpha of the top-left pixel of an 8-bit RGBA PNG."""
    return _decode_rgba(png_path)[2][3]


def test_launcher_icons_are_opaque_and_in_app_marks_are_transparent(src_dir):
    """A PWA launcher icon must be opaque — transparent pixels get an unpredictable backing from
    the OS — while the marks the app draws on its own themed surfaces must NOT carry a plate.

    This exists because the renderer once passed the module-level BACKGROUND constant instead of
    its own `background` parameter, so every "transparent" render silently got the dark plate. The
    whole gate stayed green; it took a screenshot of the splash to notice a black square behind the
    artwork on a light theme."""
    for _, relative_src, _ in icon_render.declared_icons(
        json.loads((src_dir / "manifest.json").read_text(encoding="utf-8"))
    ):
        assert _top_left_pixel_alpha(src_dir / relative_src) == 255, (
            f"src/{relative_src} is a launcher icon and must have an opaque background"
        )

    for _, relative_src, _ in icon_render.DIRECT_RENDERS:
        assert _top_left_pixel_alpha(src_dir / relative_src) == 0, (
            f"src/{relative_src} is drawn on a themed app surface and must be transparent"
        )


def test_the_favicon_carries_no_white_plate(src_dir):
    """The favicon crops to the whistle, and in the master the whistle lies on the clipboard's
    opaque WHITE page. Without knocking that page out the browser tab showed a white tile with a
    whistle on it — a transparent CORNER (the test above) does not catch it, because the plate is
    in the middle. The whistle's own artwork is emerald and near-black, so any large opaque light
    area is the page coming back."""
    _, relative_src, _ = icon_render.FAVICON
    width, height, pixels = _decode_rgba(src_dir / relative_src)

    light = 0
    for i in range(0, len(pixels), 4):
        red, green, blue, alpha = pixels[i : i + 4]
        luma = 0.299 * red + 0.587 * green + 0.114 * blue
        if alpha > 200 and luma > 200:
            light += 1
    assert light <= width * height * 0.02, (
        f"src/{relative_src}: {light} of {width * height} pixels are opaque and near-white — the "
        "clipboard page is showing through the crop again"
    )
