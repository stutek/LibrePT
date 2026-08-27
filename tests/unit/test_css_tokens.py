"""Unit tests for agent_tools/css_tokens.py — the custom-property gate.

The bug this exists for is invisible at runtime: CSS reading a property nobody defines does not
warn, it takes the fallback written beside it, so the declaration quietly stops following the theme
and freezes at whatever the author's own theme was. These tests pin the two halves — a read with no
writer, and a palette that defines something its siblings do not — plus the two writers that are not
stylesheets, because a checker blind to those would push a value back into two places.
"""

import pytest

from agent_tools import css_tokens


@pytest.fixture
def fake_src(tmp_path, monkeypatch):
    """A miniature `src/` the checker can be pointed at, with its palette directory."""
    src = tmp_path / "src"
    (src / "modules" / "themes").mkdir(parents=True)
    monkeypatch.setattr(css_tokens, "SRC", src)
    monkeypatch.setattr(css_tokens, "REPO_ROOT", tmp_path)
    return src


def test_a_read_with_no_writer_fails(fake_src, capsys):
    (fake_src / "card.css").write_text(
        ".card { color: var(--text-invented, #475569); }"
    )

    assert css_tokens.main() == 1
    assert "--text-invented" in capsys.readouterr().out


def test_a_read_of_a_property_the_css_defines_passes(fake_src):
    (fake_src / "index.css").write_text(":root { --text-main: #0f172a; }")
    (fake_src / "card.css").write_text(".card { color: var(--text-main); }")

    assert css_tokens.main() == 0


def test_javascript_counts_as_a_writer(fake_src):
    """demoHand.js stamps `--ripple-ms` onto the rings it builds and demoTour.css animates with it,
    deliberately with no fallback so the duration has one source. A checker that only read
    stylesheets would call that an error and push the number back into two places."""
    (fake_src / "hand.js").write_text(
        'ring.style.setProperty("--ripple-ms", `${520}ms`);'
    )
    (fake_src / "tour.css").write_text(
        ".ring { animation-duration: var(--ripple-ms); }"
    )

    assert css_tokens.main() == 0


def test_an_inline_style_attribute_counts_as_a_writer(fake_src):
    (fake_src / "view.js").write_text('return `<div style="--row-span: 3">`;')
    (fake_src / "view.css").write_text(".row { grid-row: span var(--row-span); }")

    assert css_tokens.main() == 0


def test_a_property_only_one_palette_defines_fails(fake_src, capsys):
    """The palettes are alternatives, not layers: whichever class is on <html> supplies every colour
    by itself. A token added to one and forgotten in the others is defined as far as the read check
    is concerned, and undefined for everyone on the other themes."""
    themes = fake_src / "modules" / "themes"
    (themes / "daylight.css").write_text(
        ".daylight-theme { --text-main: #0f172a; --accent: #059669; }"
    )
    (themes / "midnight.css").write_text(".midnight-theme { --text-main: #fafafa; }")

    assert css_tokens.main() == 1
    out = capsys.readouterr().out
    assert "--accent" in out and "midnight" in out


def test_palettes_that_agree_pass(fake_src):
    themes = fake_src / "modules" / "themes"
    (themes / "daylight.css").write_text(".daylight-theme { --text-main: #0f172a; }")
    (themes / "midnight.css").write_text(".midnight-theme { --text-main: #fafafa; }")
    (fake_src / "card.css").write_text(".card { color: var(--text-main); }")

    assert css_tokens.main() == 0


def test_vendored_css_is_not_audited(fake_src):
    """Font Awesome's `--fa-*` properties are upstream's contract with its own users: we did not
    write them and may not fix them, so reading this file would only ever produce noise."""
    (fake_src / "fonts").mkdir()
    (fake_src / "fonts" / "fontawesome.css").write_text(
        ".fa { color: var(--fa-invented); }"
    )

    assert css_tokens.main() == 0


def test_the_real_repository_passes():
    """The check against the actual tree — what the gate runs, and the reason the story card's
    slate-on-slate could not survive this file being added."""
    assert css_tokens.main() == 0
