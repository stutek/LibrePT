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
    (AGENT_RULES §5.5) or it ships to production and is hashed into the integrity catalog."""
    assert icon_render.MASTER.exists(), "the icon master artwork is missing"
    assert icon_render.SRC not in icon_render.MASTER.parents
