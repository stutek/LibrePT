# tests/e2e/test_text_glyphs_render.py
# Every character the app writes into its own text is drawn by a font the app SHIPS (TODO §74.4).
#
# The app vendors every typeface and every icon so a first load in a basement gym needs no network
# and no host font. Its own sentences were the exception: ☰, ✕, ⚠, a pencil, a waving hand — none of
# them in any file the app ships, all of them drawn by whatever the device happened to have. On a
# developer's machine that looks like success. On a phone with a thin font set they are empty boxes,
# and one of them is the ☰ that the sandbox card names as the way out.
#
# **The test takes the device's fonts away.** Comparing renderings on a normal machine cannot answer
# this: the subsets are cut from DejaVu Sans and Noto Color Emoji, which are exactly what a Linux box
# falls back to, so "the app drew it" and "the system drew it" produce identical pixels — measured,
# 2026-09-21, and it is why this test does not work that way. A browser launched against a
# fontconfig with no fonts in it has nothing to fall back to, so whatever appears came from the app's
# own `@font-face` files. That is also the phone this promise is about.
#
# The characters come from agent_tools/text_glyphs.py, the same scan the subsetter cuts from, so a
# character added to a sentence tomorrow is in this test tomorrow.
# Fixtures (local_server) come from tests/conftest.py + pytest-playwright.

import pathlib

from agent_tools.text_glyphs import printable_characters

# A fontconfig holding ONE face and nothing else. Not an empty one: Chromium cannot start without
# any system font at all and dies inside its font manager, and it will not take a woff2 as a system
# font either — both measured. So the device is given `tests/fixtures/fonts/thin-device-latin.ttf`:
# DejaVu Sans cut down to bare ASCII, 95 codepoints, not one of them a symbol or an emoji. A device
# that can show a Latin sentence and nothing else, which is the device this promise is about.
LEAN_DEVICE = """<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>{fonts}</dir>
  <cachedir>{cache}</cachedir>
</fontconfig>
"""

# Draws each character and reports the ones that came out as the browser's missing-glyph mark.
#
# "It left some ink" is NOT the question, and asking it that way is what hid four missing icons for a
# month (TODO §74.5): with nothing to fall back to, Chromium draws a box, and a box is ink. So every
# drawing is compared against the drawing of a codepoint no font on earth carries — whatever THAT
# looks like is this browser's way of saying "I have no glyph", and a character that matches it is a
# character the app does not ship.
MISSING_ONES = """async (chars) => {
  // Every face the page declares, fetched before anything is measured. A web font is downloaded
  // when something LAYS IT OUT, and a canvas drawing is not that — so a face whose characters
  // happen not to be on screen would measure as missing. Learned three times on 2026-09-21.
  await Promise.all([...document.fonts].map((face) => face.load().catch(() => null)));
  await document.fonts.ready;
  const NOTHING_HAS_THIS = '\ue9fe';
  const draw = (ch) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.font = `400 32px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 8, 32);
    return canvas.toDataURL();
  };
  const noGlyph = draw(NOTHING_HAS_THIS);
  const blank = draw(' ');
  return chars.filter((ch) => {
    const drawn = draw(ch);
    return drawn === noGlyph || drawn === blank;
  });
}"""


def _font_config(tmp_path):
    fonts = tmp_path / "thin-device"
    cache = tmp_path / "fc-cache"
    fonts.mkdir()
    cache.mkdir()
    latin = (
        pathlib.Path(__file__).resolve().parents[1]
        / "fixtures"
        / "fonts"
        / "thin-device-latin.ttf"
    )
    (fonts / latin.name).write_bytes(latin.read_bytes())
    config = tmp_path / "fonts.conf"
    config.write_text(LEAN_DEVICE.format(fonts=fonts, cache=cache), encoding="utf-8")
    return config


def test_every_character_the_app_writes_is_a_character_it_ships(
    browser_type, local_server, tmp_path
):
    """The promise: nothing the app prints depends on the device having a font for it.

    A browser of its own, launched from the session's own Playwright — a second `sync_playwright()`
    inside a run that already has one raises "Sync API inside the asyncio loop", so the whole file
    passed alone and failed beside its neighbour (measured 2026-09-21). The suite's shared browser
    cannot be used either: the device's fonts have to be gone before the process starts.
    """
    characters = printable_characters()
    assert characters, (
        "the scan found no characters at all, which means it stopped working"
    )

    config = _font_config(tmp_path)
    browser = browser_type.launch(env={"FONTCONFIG_FILE": str(config)})
    try:
        page = browser.new_page()
        page.goto(local_server)
        page.wait_for_function(
            "() => document.fonts.status === 'loaded'", timeout=20_000
        )
        # The app's own Latin still renders here, which is the control: it comes from the same
        # @font-face path these characters have to come from.
        assert page.evaluate(MISSING_ONES, ["A"]) == [], (
            "not even a letter rendered — the browser did not load the app's own faces, "
            "so this test proves nothing until that is fixed"
        )
        missing = page.evaluate(MISSING_ONES, sorted(characters))
    finally:
        browser.close()

    assert not missing, (
        "on a device with no fonts of its own, these characters did not appear: "
        + ", ".join(
            f"{ch} (U+{ord(ch):04X}, {', '.join(characters[ch][:2])})" for ch in missing
        )
        + " — cut them in with `python -m agent_tools.text_glyphs --build`"
    )


def test_the_scan_reads_sentences_and_not_comments():
    """What the subsetter cuts is what this scan finds, so the scan has to mean the right thing: a
    character discussed in a comment is not a character a trainer sees, and cutting those would grow
    the font with glyphs nothing prints."""
    characters = printable_characters()

    assert "☰" in characters, "the menu character is written into several sentences"
    # agent_tools/text_glyphs.py's own docstring says ☰ too, and this file names a dozen of them —
    # neither is source the app prints.
    assert all(
        not file.endswith(".py") for files in characters.values() for file in files
    )
    # The vendored QR encoder's block-drawing characters are its own ASCII-art output; this app
    # draws the code as an SVG path (modules/common/qrCode.js) and never calls that.
    assert "█" not in characters
