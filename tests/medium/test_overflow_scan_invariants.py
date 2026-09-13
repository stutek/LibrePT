# tests/medium/test_overflow_scan_invariants.py
# What agent_tools/overflow_scan.py reports, on the smallest page that shows each case.
#
# The route walk (tests/e2e/test_layout_overflow.py) can only say "the app has no overflow". It
# cannot say whether the sweep would have SEEN one. TODO §47.1 is that gap: a session name ran
# under the clipboard's ▶ and ⋮ buttons, and the sweep reported nothing, because the text never
# crossed a box that clips and never crossed the screen edge. So each rule is pinned here against a
# page built to break it, and against the near-miss it must leave alone.
#
# Here and not in unit/: the rules are layout, and only a browser computes layout. No app is
# booted — `set_content` on a blank page — so this is the cheapest test that can hold them.
# Fixtures (page) come from tests/conftest.py + pytest-playwright.

from agent_tools import overflow_scan

# The clipboard title bar of §47.1, reduced to its layout: a 300px row, a title slot that may
# shrink, and a 60px button beside it. The title's own `min-width` is the one thing each case
# changes.
_TITLE_ROW = """
<div style="display:flex; width:300px; gap:10px; font:16px sans-serif">
  <div id="slot" style="display:flex; flex:1; min-width:0">
    <h3 id="title" style="margin:0; white-space:nowrap; {title_style}">
      Group Strength &amp; Conditioning + Return-to-Play Rehab
    </h3>
  </div>
  <button style="flex:0 0 60px">▶</button>
</div>
"""


def _findings(page, html, invariant):
    page.set_content(f"<body style='margin:0; width:800px'>{html}</body>")
    return [f for f in overflow_scan.scan(page) if f["invariant"] == invariant]


def test_c_reports_text_that_runs_out_of_its_slot_and_under_the_next_control(page):
    """The §47.1 defect. Nothing on this page clips, and the text stays well inside the 800px
    body — so A has no boundary to measure against and B no clipping box to look in."""
    findings = _findings(page, _TITLE_ROW.format(title_style=""), "C")

    assert [f["element"] for f in findings] == ["h3#title"], findings
    assert findings[0]["boundary"] == "div#slot", findings


def test_c_is_quiet_when_the_title_is_allowed_to_shrink_and_ellipsise(page):
    style = "min-width:0; overflow:hidden; text-overflow:ellipsis"

    assert _findings(page, _TITLE_ROW.format(title_style=style), "C") == []


def test_c_lets_a_child_bleed_into_its_parents_padding(page):
    """A status bar that runs edge to edge in a padded card (sessionsView.css does this) is inside
    the card's box, just not inside its content."""
    html = """
    <div style="width:300px; padding:0 14px">
      <div style="margin:0 -14px; height:20px"></div>
    </div>
    """
    assert _findings(page, html, "C") == []


def test_c_lets_a_negative_margin_carry_a_child_past_its_parent(page):
    """Every view's title bar (`.view-titlebar`, index.css) has `margin: 0 -16px`, so it runs past
    its section into the padding of the column around it, to the column's edge. A negative margin
    is the author asking for exactly that distance, so C measures the box the margin leaves."""
    html = """
    <div style="width:340px; padding:0 16px">
      <section style="width:300px">
        <div style="margin:0 -16px; height:20px"></div>
      </section>
    </div>
    """
    assert _findings(page, html, "C") == []


def test_c_still_reports_what_goes_further_than_the_margin_asked(page):
    html = """
    <section style="width:300px">
      <div style="margin-left:-16px; width:340px; height:20px"></div>
    </section>
    """
    findings = _findings(page, html, "C")

    assert [f["overflowPx"] for f in findings] == [24], findings


def test_c_ignores_what_is_positioned_out_of_the_flow(page):
    """A badge placed on a card's corner is where its author put it, not where the text pushed it."""
    html = """
    <div style="position:relative; width:100px; height:40px">
      <span style="position:absolute; right:-12px; top:-6px; width:24px; height:24px"></span>
    </div>
    """
    assert _findings(page, html, "C") == []


def test_c_leaves_a_clipping_or_scrolling_parent_to_a_and_b(page):
    """Past a parent that clips, the content is cut, not covering anything: that is A's and B's
    case. Past a parent that scrolls, it can be reached."""
    for overflow in ("hidden", "auto"):
        html = f"""
        <div style="width:100px; overflow-x:{overflow}">
          <div style="width:300px; height:10px"></div>
        </div>
        """
        assert _findings(page, html, "C") == [], overflow
