"""Unit tests for agent_tools/overflow_scan.py — the pure-logic parts and the JS blob's syntax.

The sweep itself needs a browser and is gated by tests/e2e/test_layout_overflow.py. What is worth
pinning here is what that suite CANNOT tell you apart from any other failure: a device preset that
drifted, and a syntax error in the inline JavaScript. The second one matters more than it looks —
`page.evaluate` on a malformed function fails as a Playwright error inside whichever e2e test ran
first, which reads like a browser problem rather than a typo in a string literal.
"""

import pytest
import tree_sitter_javascript as tsjs
from tree_sitter import Language, Parser

from agent_tools import overflow_scan


def test_every_device_preset_has_a_portrait_viewport_and_a_reason():
    for name, profile in overflow_scan.DEVICE_PROFILES.items():
        assert profile["height"] > profile["width"] or name == "desktop", (
            f"{name} is declared landscape; phones are held portrait mid-session"
        )
        assert profile["description"], (
            f"{name} has no description saying why it is in the list"
        )


def test_device_profile_returns_the_named_viewport():
    assert overflow_scan.device_profile("iphone-14")["width"] == 390
    assert overflow_scan.device_profile("galaxy-s23-ultra")["width"] == 412


def test_device_profile_names_the_alternatives_when_asked_for_an_unknown_device():
    with pytest.raises(ValueError, match="iphone-14"):
        overflow_scan.device_profile("nokia-3310")


def test_parse_viewport_reads_width_and_height():
    assert overflow_scan.parse_viewport("412x915") == {"width": 412, "height": 915}


def test_parse_viewport_rejects_a_malformed_spec():
    with pytest.raises(ValueError):
        overflow_scan.parse_viewport("wide-ish")


def test_the_sweep_is_syntactically_valid_javascript():
    """Parsed with the real grammar, the same way agent_tools/complexity.py parses `src/` — a regex
    cannot tell a valid arrow function from one missing a brace."""
    tree = Parser(Language(tsjs.language())).parse(
        overflow_scan.OVERFLOW_SCAN_JS.encode("utf-8")
    )
    assert not tree.root_node.has_error, "OVERFLOW_SCAN_JS does not parse as JavaScript"


def test_format_findings_names_the_context_and_every_finding():
    message = overflow_scan.format_findings(
        "clients at 390px",
        [
            {
                "invariant": "A",
                "axis": "x",
                "element": "div.chip",
                "boundary": "body",
                "overflowPx": 24,
            }
        ],
    )
    assert "clients at 390px" in message
    assert "div.chip" in message
    assert "24px" in message


def test_format_findings_says_so_when_there_is_nothing_to_report():
    assert "no overflow" in overflow_scan.format_findings("clients at 390px", [])
