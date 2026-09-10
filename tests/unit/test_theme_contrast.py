# tests/unit/test_theme_contrast.py
# Muted text must stay readable in every theme, with room to spare (TODO §38.11).
#
# `--text-muted` is what every secondary line in the app takes — timestamps, hints, the target under
# an exercise name, the card that tells a trainer what the app wants from them. On 2026-09-10 the two
# LIGHT palettes measured 4.76:1 (Daylight) and 4.84:1 (Blossom) on their own cards and 4.45:1 /
# 4.46:1 on the page field behind them: the field was already UNDER the 4.5:1 a paragraph needs, and
# the card had so little margin that any tinted surface pushed the text below the bar — which is what
# had already happened once, to the demo's story card at 4.28:1.
#
# So the bar here is NOT 4.5:1. It is 6:1, which is the headroom the three dark palettes have carried
# all along (7.1:1 to 10.8:1): a component may then mix an accent into the card surface, the way a
# warning or a selected row does, and the text under it still passes.
#
# **Why this can be a Stage 1 text test and not a browser one.** Both surfaces are computed from the
# theme's own tokens: `--bg-color` is a plain hex, and `--card-bg` is that hex with an alpha over it.
# Compositing those is arithmetic, so no browser is needed to know what a muted line sits on. The
# assumption is asserted rather than assumed — a theme whose `--card-bg` stops being an `rgba()` over
# the field fails here instead of quietly dropping out of the sweep.
#
# Pure text analysis, no browser — Stage 1. Uses the src_dir fixture (tests/conftest.py).

import re

# Muted text, on the card and on the page field behind it. 4.5:1 is the floor for body text; the gap
# up to 6 is what a component is allowed to spend on tinting a surface.
MIN_CONTRAST = 6.0

TOKEN = re.compile(r"^\s*(--[a-z-]+):\s*([^;]+);", re.MULTILINE)
HEX = re.compile(r"^#([0-9a-fA-F]{6})$")
RGBA = re.compile(
    r"^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$",
)


def _theme_files(src_dir):
    return sorted((src_dir / "modules" / "themes").glob("*.css"))


def _tokens(path):
    """{'--text-muted': '#475569', …} — the last value each token is given in this file."""
    return {
        token: value.strip()
        for token, value in TOKEN.findall(path.read_text(encoding="utf-8"))
    }


def _channels(hex_value):
    return tuple(int(hex_value[i : i + 2], 16) for i in (1, 3, 5))


def _luminance(rgb):
    """WCAG relative luminance, the same formula the browser-side sweep uses."""
    linear = []
    for channel in rgb:
        value = channel / 255
        linear.append(
            value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4
        )
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def _contrast(foreground, background):
    lighter, darker = sorted(
        (_luminance(foreground), _luminance(background)), reverse=True
    )
    return (lighter + 0.05) / (darker + 0.05)


def _over(top, alpha, bottom):
    """What the eye actually sees where a translucent surface lies on the field behind it."""
    return tuple(round(top[i] * alpha + bottom[i] * (1 - alpha)) for i in range(3))


def _surfaces(path):
    """(field, card) as solid RGB for one theme — or an explanation of why they can't be read."""
    tokens = _tokens(path)
    field_value = tokens.get("--bg-color", "")
    card_value = tokens.get("--card-bg", "")

    if not HEX.match(field_value):
        return None, f"{path.name}: --bg-color is not a plain hex ({field_value!r})"
    field = _channels(field_value)

    if HEX.match(card_value):
        return (field, _channels(card_value)), None
    match = RGBA.match(card_value)
    if not match:
        return (
            None,
            f"{path.name}: --card-bg is neither a hex nor an rgba() ({card_value!r})",
        )
    red, green, blue, alpha = match.groups()
    card = _over((int(red), int(green), int(blue)), float(alpha), field)
    return (field, card), None


def test_muted_text_has_room_to_spare_in_every_theme(src_dir):
    themes = _theme_files(src_dir)
    assert themes, (
        "no theme stylesheets found — the check would pass by measuring nothing"
    )

    too_low = []
    for path in themes:
        surfaces, problem = _surfaces(path)
        assert not problem, problem
        field, card = surfaces

        muted = _tokens(path).get("--text-muted", "")
        assert HEX.match(muted), (
            f"{path.name}: --text-muted is not a plain hex ({muted!r})"
        )
        text = _channels(muted)

        for where, ground in (("card", card), ("page field", field)):
            ratio = _contrast(text, ground)
            if ratio < MIN_CONTRAST:
                too_low.append(
                    f"{path.name} --text-muted {muted} on the {where}: {ratio:.2f}:1"
                )

    assert not too_low, (
        f"muted text needs {MIN_CONTRAST}:1 so a tinted surface still leaves it above the 4.5:1 "
        "a paragraph needs (TODO §38.11):\n  " + "\n  ".join(too_low)
    )
