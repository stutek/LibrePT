"""`python -m agent_tools.text_glyphs` — ship the symbols and emoji the app writes into its text.

Why this exists (TODO §74.4): every typeface and every icon this app draws is vendored, so a first
load in a basement gym needs no network and no host font. Its own SENTENCES were the exception. They
carry ☰, ✕, ⚠, a pencil, a waving hand — sixteen characters, measured — and not one of them was in
any file the app ships. They render on a developer's machine because the SYSTEM supplies them; on a
phone with a thin font set they are empty boxes, and one of them is the ☰ that the sandbox card names
as the way out.

**Vendored, not reworded.** The other way was to take the characters out of the strings and let the
icon font draw them, which is cheaper and wrong here: an icon is an element, a translated string
reaches the screen as TEXT (i18n/domMappings.js writes `textContent`, notificationArea.js escapes),
so an icon cannot sit inside a sentence — every such sentence would have to be rewritten, in both
languages, to say the shape in words. Ruled 2026-09-21: the characters stay.

**Two sources, because no one font has both halves.**

  * the symbols come from DejaVu Sans — committed under `assets/`, like the Font Awesome faces, so
    regeneration needs nothing but the repository;
  * the emoji come from Noto Color Emoji, which is NOT committed: it is 11MB, forty times the rest of
    `assets/` put together. Its exact provenance is recorded below instead, so the same file can be
    fetched again deliberately.

**Not a build dependency.** `fonttools` is installed for the minutes this runs and uninstalled after,
exactly as `font_subset.py` does it. The output is committed; nothing in the pipeline needs this
module to be runnable.

**The list comes from the app, never from a list here.** `printable_characters()` reads every string
`src/` can print, so a character added to a sentence tomorrow is a character this cuts in — and
tests/e2e/test_text_glyphs_render.py fails the build when one of them has nowhere to come from.

**Licensing.** Both sources permit subsetting and redistribution, and both reserve their names, so
the cut faces are renamed and each carries its own copyright in its name table — the same treatment
the icon subsets get. THIRD_PARTY_NOTICES.md records them.

Usage:
  python -m agent_tools.text_glyphs --check     # which printable characters have no glyph anywhere
  python -m agent_tools.text_glyphs --build     # cut the two faces again (needs fonttools)
"""

import argparse
import pathlib
import re
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = REPO_ROOT / "src"
FONT_DIR = SRC / "fonts"
UPSTREAM = REPO_ROOT / "assets"

# The symbols source, committed: 760KB, permissively licensed, and the face most Linux systems were
# quietly supplying these glyphs from anyway.
DEJAVU = UPSTREAM / "dejavu-upstream" / "DejaVuSans.ttf"
# The emoji source, NOT committed — 11MB. Recorded precisely so it can be fetched again: Noto Color
# Emoji, the build shipped by Debian's fonts-noto-color-emoji, installed at
# /usr/share/fonts/truetype/noto/NotoColorEmoji.ttf. Google publishes the same file at
# https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf
# The file these subsets were cut from:
#   sha256 9fd0a3d0ce84d77e3185dfbae77bd1abf3926aa49a032e354d076c4f17151f10
NOTO_EMOJI_SYSTEM = pathlib.Path("/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf")

OUT_SYMBOLS = FONT_DIR / "librept-symbols.woff2"
OUT_EMOJI = FONT_DIR / "librept-emoji.woff2"

# One family in the stack, two files behind it, split by unicode-range — which is what
# unicode-range is for. A second name in every font stack would be a second thing to remember.
FAMILY = "LibrePT Symbols"

SYMBOL_COPYRIGHT = (
    "Glyphs from DejaVu Sans (Bitstream Vera Fonts Copyright 2003 Bitstream, Inc.; "
    "DejaVu changes in public domain). Subset for LibrePT; not endorsed by Bitstream, Inc."
)
EMOJI_COPYRIGHT = (
    "Glyphs from Noto Color Emoji, Copyright Google Inc., SIL OFL 1.1. "
    "Subset for LibrePT; not endorsed by Google Inc."
)

# Characters below this are Latin the vendored text faces already carry, and scanning them would
# drown the answer in every accented letter Slovenian uses.
FIRST_INTERESTING = 0x0180

# Source files whose strings are not the app speaking: a vendored library's own ASCII-art output
# reaches no screen in this app (the QR code is drawn as an SVG path — modules/common/qrCode.js).
SKIP = ("vendor/",)

# Invisible by design: it selects the colour presentation of the character before it and has no
# glyph of its own to ship.
INVISIBLE = {0xFE0F, 0x200D, 0xFEFF}

_STRING = re.compile(
    r'"((?:[^"\\\n]|\\.)*)"' r"|'((?:[^'\\\n]|\\.)*)'" r"|`((?:[^`\\]|\\.)*)`", re.S
)


def _strings_in(path):
    """Every string literal in a JS file, with comments removed first.

    A comment is where a character is discussed rather than printed — this file is full of them —
    and counting those would send the subsetter after characters no trainer can ever see.
    """
    text = path.read_text(encoding="utf-8")
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"^\s*//.*$", "", text, flags=re.M)
    for match in _STRING.finditer(text):
        yield next(group for group in match.groups() if group is not None)


def printable_characters():
    """Every character above Latin that `src/` can put on a screen, with where it came from.

    `{character: sorted list of files}`. Strings AND the static markup, because both reach the same
    screen — index.html's own text is what first paint shows.
    """
    found = {}
    for path in sorted(SRC.rglob("*.js")):
        relative = str(path.relative_to(SRC))
        if any(relative.startswith(prefix) for prefix in SKIP):
            continue
        for value in _strings_in(path):
            for char in value:
                if ord(char) >= FIRST_INTERESTING and ord(char) not in INVISIBLE:
                    found.setdefault(char, set()).add(relative)

    html = (SRC / "index.html").read_text(encoding="utf-8")
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    for char in re.sub(r"<[^>]+>", "", html):
        if ord(char) >= FIRST_INTERESTING and ord(char) not in INVISIBLE:
            found.setdefault(char, set()).add("index.html")

    return {char: sorted(files) for char, files in sorted(found.items())}


def _cmap_of(path):
    """Every codepoint a font file carries. Needs fonttools, so only the build path calls it."""
    from fontTools.ttLib import TTFont

    font = TTFont(path)
    covered = set()
    for table in font["cmap"].tables:
        covered |= set(table.cmap)
    font.close()
    return covered


def _cut(source, codepoints, out, family, copyright_line):
    """One face, cut down to the codepoints it holds — renamed, with its licence travelling in it."""
    from fontTools import subset
    from fontTools.ttLib import TTFont

    font = TTFont(source)
    in_font = {
        code
        for code in codepoints
        if any(code in table.cmap for table in font["cmap"].tables)
    }
    if not in_font:
        font.close()
        return None

    options = subset.Options()
    # Nothing kerns or shapes a warning sign; layout tables and hinting are dead weight.
    options.layout_features = []
    options.hinting = False
    options.notdef_outline = True
    options.name_IDs = ["*"]
    options.name_legacy = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=in_font)
    subsetter.subset(font)

    name = font["name"]
    for name_id, value in (
        (0, copyright_line),
        (1, family),
        (4, family),
        (6, family.replace(" ", "")),
        (13, "See THIRD_PARTY_NOTICES.md"),
        (16, family),
    ):
        name.setName(value, name_id, 3, 1, 0x409)

    font.flavor = "woff2"
    font.save(out)
    font.close()
    return sorted(in_font)


def build():
    characters = printable_characters()
    wanted = {ord(char) for char in characters}

    if not DEJAVU.exists():
        print(f"  ✗ The symbols source is not in the repository: {DEJAVU}")
        return 1
    if not NOTO_EMOJI_SYSTEM.exists():
        print(
            f"  ✗ The emoji source is not on this machine: {NOTO_EMOJI_SYSTEM}\n"
            "    It is deliberately not committed (11MB) — install fonts-noto-color-emoji, or\n"
            "    fetch it from github.com/googlefonts/noto-emoji."
        )
        return 1

    # What the app's own text faces already draw is not cut again: a second copy of an em dash is
    # bytes on every load for a glyph the page already has.
    already = _already_in_the_text_faces(wanted)
    missing = wanted - already

    emoji_cmap = _cmap_of(NOTO_EMOJI_SYSTEM)
    # The emoji face takes what it has first, so a character both sources carry is drawn by the one
    # that means it: a waving hand is an emoji, not a dingbat.
    emoji = _cut(NOTO_EMOJI_SYSTEM, missing, OUT_EMOJI, FAMILY, EMOJI_COPYRIGHT)
    symbols = _cut(
        DEJAVU, missing - set(emoji_cmap), OUT_SYMBOLS, FAMILY, SYMBOL_COPYRIGHT
    )

    covered = set(emoji or []) | set(symbols or [])
    homeless = sorted(missing - covered)
    for path, cut in ((OUT_SYMBOLS, symbols), (OUT_EMOJI, emoji)):
        if cut:
            size = path.stat().st_size / 1024
            print(f"  ✓ {path.name}: {len(cut)} glyph(s), {size:.1f}KB")
    if homeless:
        marks = ", ".join(f"U+{code:04X} {chr(code)}" for code in homeless)
        print(f"  ✗ No source carries: {marks}")
        return 1
    # The `unicode-range` each face is declared with, printed rather than remembered: fonts.css has
    # to say which characters a file is for, and a range typed by hand is a range that drifts from
    # the file the moment a character is added.
    for path, cut in ((OUT_SYMBOLS, symbols), (OUT_EMOJI, emoji)):
        if cut:
            ranges = ", ".join(f"U+{code:04X}" for code in cut)
            print(f"    {path.name} unicode-range: {ranges};")
    print("    Verify with: python -m agent_tools.text_glyphs --check")
    return 0


def _already_in_the_text_faces(codepoints):
    """The codepoints the app's own text faces already draw — DM Sans and friends carry the dashes
    and the ellipsis, and cutting them again would ship a second copy of a glyph the page already
    has."""
    covered = set()
    for path in sorted(FONT_DIR.glob("*.woff2")):
        if path.name.startswith("librept-"):
            continue
        covered |= _cmap_of(path) & codepoints
    return covered


def check():
    """Which printable characters no vendored file can draw. Reads the fonts, never a manifest.

    A manifest is what let four icons go missing for a month (TODO §74.5): the stylesheet said they
    were there and nothing asked the font. Needs fonttools, so the BUILD does not run this — the
    browser does, in tests/e2e/test_text_glyphs_render.py, which asks the page what it can draw.
    """
    characters = printable_characters()
    covered = set()
    for path in sorted(FONT_DIR.glob("*.woff2")):
        covered |= _cmap_of(path)

    homeless = {
        char: files for char, files in characters.items() if ord(char) not in covered
    }
    if homeless:
        print(
            f"  ✗ {len(homeless)} character(s) the app prints have no glyph in any font it ships"
        )
        for char, files in homeless.items():
            print(f"    U+{ord(char):04X} {char}  {', '.join(files[:3])}")
        return 1
    print(
        f"  ✓ Text glyphs: all {len(characters)} printable character(s) ship with the app."
    )
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build", action="store_true", help="cut the two faces again")
    parser.add_argument(
        "--check", action="store_true", help="report characters with no glyph"
    )
    args = parser.parse_args(argv)
    if args.build:
        return build()
    return check()


if __name__ == "__main__":
    sys.exit(main())
