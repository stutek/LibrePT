"""`python -m agent_tools.font_subset` — build the app's icon font from the glyphs it actually uses.

Why this exists: the app shipped two whole Font Awesome faces, 252KB of woff2 for the ~50 glyphs it
draws (TODO §12.6). On the first load in a basement gym — the load this app is designed around —
that is a quarter of a megabyte spent on ~1400 icons nobody asks for.

**Not a build dependency.** `fonttools` is installed for the minutes this runs and uninstalled after
(`pip install fonttools brotli`); regeneration stays a deliberate, committed act, the same way Node,
Biome and the ZAP rules are vendored rather than fetched. The output is committed; nothing in the
pipeline needs this module to be runnable.

**The glyph list comes from icon_coverage.py**, which already answers "which icons does `src/` ask
for", runtime-built names included. A second list here would be a second thing to keep true, and the
day the two disagreed the app would ship a blank box with a green gate behind it.

**Adding an icon means running this again.** The e2e suite fails on an icon that is not in the
subset — that is what caught `fa-copy` an hour after the subsetting shipped, in the commit that added
it — and the fix is one command plus a re-recorded baseline, not a debate.

**Verify with agent_tools/glyph_render.py, not by eye.** Take a baseline BEFORE running this, run it,
then `--check`: every used icon must render byte-identically to how the full font rendered it. "It
still renders something" is not enough — the wrong glyph at the right codepoint is also something.

**Licensing.** A subset is a Modified Version under SIL OFL 1.1, which permits it but reserves the
name "Font Awesome" — so the merged font is renamed (`LibrePT Icons`) and the copyright and licence
travel in its name table, which subsetting tools routinely drop. THIRD_PARTY_NOTICES.md records the
change, as CC BY 4.0 requires for the icons themselves.
"""

import re
import shutil
import sys
import tempfile
from pathlib import Path

from agent_tools.icon_coverage import ICON_CSS, REPO_ROOT, scanned_files, used_icons

FONT_DIR = REPO_ROOT / "src" / "fonts"
# The unmodified upstream faces, kept OUT of src/ because they are not shipped — the app serves the
# subsets cut from them. Committed so regeneration needs nothing but the repository: without them,
# the next person to add an icon would have to find the exact upstream version again, and "the same
# version" is what makes the recorded render comparable at all.
UPSTREAM = REPO_ROOT / "assets" / "fontawesome-upstream"
SOLID = UPSTREAM / "fa-solid-900.woff2"
BRANDS = UPSTREAM / "fa-brands-400.woff2"
OUT_SOLID = FONT_DIR / "librept-icons.woff2"
OUT_BRANDS = FONT_DIR / "librept-icons-brands.woff2"

# The renamed families. OFL 1.1 reserves "Font Awesome" for upstream, so a Modified Version may not
# carry it.
#
# **TWO files, not one merged font, and that was measured rather than assumed.** The first attempt
# merged both faces into a single family; agent_tools/glyph_render.py then showed `github` and
# `google-drive` drawing something else entirely. The faces share 96 codepoints (both map the ASCII
# range, and `fa-plus` genuinely lives at U+002B), so merging forces a winner per codepoint and the
# loser's icons quietly become another glyph. Two subsets keep upstream's own separation, cost about
# a kilobyte more than one, and cannot mis-map anything.
FAMILY = "LibrePT Icons"
FAMILY_BRANDS = "LibrePT Icons Brands"
COPYRIGHT = (
    "Icon glyphs Copyright 2023 Fonticons, Inc. (Font Awesome Free 6.4.0), CC BY 4.0. "
    "Font software SIL OFL 1.1. Subset and merged for LibrePT; not endorsed by Fonticons, Inc."
)

# `.fa-name:before{content:"\fXXX"}`, with the alias lists Font Awesome groups onto one rule.
CSS_RULE = re.compile(
    r"((?:\.fa-[a-z0-9-]+:before\s*,?\s*)+)\{\s*content:\s*\"\\([0-9a-f]+)\""
)
CSS_GLYPH = re.compile(r"\.fa-([a-z0-9-]+):before")


def codepoints_for(names, css_text):
    """`{name: codepoint}` for the icons the app uses, read from the stylesheet beside the font.

    The CSS is the manifest: the two are generated together, so a name it does not carry is a name
    the font cannot draw — which icon_coverage.py already refuses to let happen.
    """
    wanted = set(names)
    found = {}
    for selector_list, hex_code in CSS_RULE.findall(css_text):
        for name in CSS_GLYPH.findall(selector_list):
            if name in wanted:
                found[name] = int(hex_code, 16)
    return found


def _subset(source, codepoints, work_dir):
    """One face, cut down to the codepoints it holds from `codepoints`. Returns a path or None when
    this face carries none of them (a build with no brand icons should not merge an empty font)."""
    from fontTools import subset
    from fontTools.ttLib import TTFont

    font = TTFont(source)
    in_font = {
        code
        for code in codepoints
        if any(code in table.cmap for table in font["cmap"].tables)
    }
    if not in_font:
        return None
    options = subset.Options()
    # Layout tables and hinting are dead weight for a PUA icon font: nothing kerns, nothing shapes.
    options.layout_features = []
    options.hinting = False
    options.desubroutinize = True
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.notdef_outline = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=in_font)
    subsetter.subset(font)
    out = work_dir / f"{Path(source).stem}-subset.ttf"
    font.flavor = None
    font.save(out)
    font.close()
    return out


def _rename(font, family=FAMILY):
    """Give the merged font its own identity, and carry the licences in it.

    Subsetting tools routinely strip the name table down to nothing, which would leave a font on
    disk with no statement of where it came from — exactly what both licences require it to keep.
    """
    name = font["name"]
    for name_id, value in (
        (0, COPYRIGHT),
        (1, family),
        (3, f"{family}; subset of Font Awesome Free 6.4.0"),
        (4, family),
        (6, family.replace(" ", "")),
        (13, "SIL Open Font License 1.1 (font software); CC BY 4.0 (icons)"),
        (14, "https://fontawesome.com/license/free"),
        (16, family),
    ):
        name.setName(value, name_id, 3, 1, 0x409)


def build():
    css_text = ICON_CSS.read_text(encoding="utf-8")
    names = sorted(used_icons(scanned_files()))
    codepoints = codepoints_for(names, css_text)
    missing = [name for name in names if name not in codepoints]
    if missing:
        print(f"  ✗ No codepoint in the stylesheet for: {', '.join(missing)}")
        return 1

    from fontTools.ttLib import TTFont

    wanted = set(codepoints.values())
    written = []
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        for source, out, family in (
            (SOLID, OUT_SOLID, FAMILY),
            (BRANDS, OUT_BRANDS, FAMILY_BRANDS),
        ):
            piece = _subset(source, wanted, work)
            if not piece:
                out.unlink(missing_ok=True)
                continue
            font = TTFont(piece)
            _rename(font, family)
            font.flavor = "woff2"
            font.save(out)
            font.close()
            written.append(out)
    if not written:
        print("  ✗ Neither face carries any of the icons the app uses.")
        return 1

    before = SOLID.stat().st_size + BRANDS.stat().st_size
    after = sum(out.stat().st_size for out in written)
    names_written = ", ".join(out.name for out in written)
    print(
        f"\n  ✓ {names_written}: {len(codepoints)} glyphs, {after // 1024}KB (was {before // 1024}KB)"
    )
    print("    Verify with: python -m agent_tools.glyph_render --check")
    return 0


def main(argv=None):
    if not shutil.which("python") and not sys.executable:
        return 1
    try:
        import fontTools  # noqa: F401
    except ImportError:
        print(
            "\n  ✗ fonttools is not installed. It is NOT a build dependency — install it for this"
        )
        print("    run and remove it afterwards:  pip install fonttools brotli")
        return 1
    return build()


if __name__ == "__main__":
    sys.exit(main())
