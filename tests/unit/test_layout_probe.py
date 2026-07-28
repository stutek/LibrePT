"""Unit tests for agent_tools/layout_probe.py — the pure-logic argument parsing only.

`probe()` itself launches a real browser and is exercised by hand when an agent actually runs the
tool against a live page (see the tool's own docstring) — that is the same reason this repo's e2e
suite, not its unit suite, owns anything that starts a browser.
"""

import pytest

from agent_tools import layout_probe


def test_parse_viewport_reads_width_and_height():
    assert layout_probe.parse_viewport("390x844") == {"width": 390, "height": 844}


def test_parse_viewport_rejects_malformed_spec():
    with pytest.raises(ValueError):
        layout_probe.parse_viewport("not-a-viewport")


def test_parse_scroll_splits_selector_and_amount():
    assert layout_probe.parse_scroll("#main-content:1780") == ("#main-content", 1780)


def test_parse_scroll_with_no_selector_scrolls_the_window():
    assert layout_probe.parse_scroll(":800") == ("", 800)


def test_parse_scroll_uses_the_last_colon():
    """A selector containing ':' (unusual but valid CSS, e.g. a pseudo-class-like id) must still
    split on the colon separating it from the amount, not an earlier one inside the selector."""
    assert layout_probe.parse_scroll("#foo:bar:500") == ("#foo:bar", 500)


def test_parse_scroll_rejects_a_spec_with_no_colon():
    with pytest.raises(ValueError):
        layout_probe.parse_scroll("no-colon-here")


def test_build_parser_requires_url_and_selector():
    parser = layout_probe.build_parser()
    with pytest.raises(SystemExit):
        parser.parse_args([])


def test_build_parser_accepts_repeated_selectors_and_css_props():
    parser = layout_probe.build_parser()
    args = parser.parse_args(
        [
            "--url",
            "http://localhost:8081/",
            "--selector",
            ".a",
            "--selector",
            ".b",
            "--css",
            "bottom",
        ]
    )
    assert args.selectors == [".a", ".b"]
    assert args.css_props == ["bottom"]
