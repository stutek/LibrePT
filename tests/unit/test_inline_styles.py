"""Unit tests for agent_tools/inline_styles.py — look and layout may only be written in CSS.

Ruled 2026-09-13: a theme is a stylesheet that may restyle any component, and a declaration written
by code sits on the element and beats every stylesheet. What this check has to get right is the one
exception — a number only the running code knows, handed over as a custom property.
"""

from agent_tools import inline_styles


def test_a_declaration_assigned_in_code_is_found():
    assert inline_styles.findings_in('card.style.gap = "12px";')
    assert inline_styles.findings_in('tab.style["minHeight"] = "44px";')
    assert inline_styles.findings_in('el.style.cssText = "color: red";')


def test_a_declaration_set_by_call_is_found():
    assert inline_styles.findings_in('el.style.setProperty("gap", "12px");')


def test_a_style_attribute_in_a_template_is_found():
    assert inline_styles.findings_in('`<span style="opacity: 0.45;">&bull;</span>`')
    assert inline_styles.findings_in("`<i style='color: #ef4444'></i>`")


def test_an_attribute_wrapped_over_two_lines_is_found_on_its_first_line():
    assert inline_styles.findings_in(
        'x\n`<div style="display: flex;\n  gap: 4px">`'
    ) == [(2, '`<div style="display: flex;')]


def test_a_custom_property_is_the_allowed_exception():
    """The stylesheet still decides what the number does, so a theme can still restyle it."""
    assert not inline_styles.findings_in(
        'c.style.setProperty("--plan-column-count", "3");'
    )
    assert not inline_styles.findings_in(
        '`<div style="--spot-x: ${x}px; --spot-y: ${y}px">`'
    )


def test_a_custom_property_does_not_hide_a_declaration_beside_it():
    assert inline_styles.findings_in('`<div style="--spot-x: 4px; top: 0">`')


def test_reading_a_style_is_not_writing_one():
    assert not inline_styles.findings_in('if (el.style.display === "none") {')
    assert not inline_styles.findings_in("const w = getComputedStyle(el).width;")


def test_the_tree_writes_no_style_in_code():
    assert inline_styles.main() == 0
