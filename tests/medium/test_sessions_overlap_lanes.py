# tests/medium/test_sessions_overlap_lanes.py
# Sessions that overlap in time sit side by side on the board, the way a calendar shows them, instead
# of stacking as if one followed the other (TODO 1.3). The lane arithmetic is unit-tested in
# tests/unit_js/domain/overlapLanes.test.mjs; this file pins what the trainer SEES: boxes.
#
# Mounted on SESSIONS_STUB's board with the sessions replaced by a known set, so no seeded evening
# can join a cluster by accident. Dates are fixed (not "today"): only the layout is under test.

import pytest

from tests.medium._harness import SESSIONS_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

DAY = "2026-09-14"


def _sessions_js(rows):
    """Replace the stub's seeded sessions with `rows` = [(id, "HH:MM - HH:MM")]."""
    items = ",".join(
        f"""{{ id: '{sid}', title: 'T {sid}', time: '{span}', day: 'upcoming',
            startDate: new Date('{DAY}T{span[:5]}:00').toISOString(),
            participants: [], routineId: '', maxCapacity: 4 }}"""
        for sid, span in rows
    )
    return SESSIONS_STUB.replace(
        "sessions: structuredClone(DEFAULT_SESSIONS),", f"sessions: [{items}],"
    )


BOXES = """() => Object.fromEntries(
  Array.from(document.querySelectorAll('.session-card')).map((c) => {
    const r = c.getBoundingClientRect();
    return [c.dataset.sessionId, { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
                                   width: r.width }];
  })
)"""


def _mount(page, local_server, rows, width=390):
    page.set_viewport_size({"width": width, "height": 844})
    load_with_stub(page, local_server, _sessions_js(rows))
    page.wait_for_selector(".session-card")
    return page.evaluate(BOXES)


def test_a_partial_overlap_sits_side_by_side_and_the_lone_session_is_full_width(
    page, local_server
):
    boxes = _mount(
        page,
        local_server,
        [("a", "10:00 - 11:00"), ("b", "10:30 - 11:30"), ("c", "14:00 - 15:00")],
    )
    a, b, c = boxes["a"], boxes["b"], boxes["c"]
    assert a["right"] <= b["left"] + 1, f"a must be left of b: {a} {b}"
    # A shared horizontal band: the two boxes' vertical spans intersect.
    assert min(a["bottom"], b["bottom"]) > max(a["top"], b["top"]), "they share a band"
    assert b["top"] > a["top"] + 10, "the later start starts visibly lower"
    assert c["width"] > 1.8 * a["width"], "the lone 14:00 session keeps the full width"
    assert c["left"] < a["left"] + 1 and c["right"] > b["right"] - 1


def test_touching_sessions_are_not_side_by_side(page, local_server):
    boxes = _mount(page, local_server, [("a", "10:00 - 11:00"), ("b", "11:00 - 12:00")])
    a, b = boxes["a"], boxes["b"]
    assert abs(a["width"] - b["width"]) < 1 and a["width"] > 300
    assert b["top"] >= a["bottom"] - 1, "back to back is one under the other"


def test_two_lanes_stay_legible_at_390(page, local_server):
    _mount(page, local_server, [("a", "10:00 - 11:00"), ("b", "10:30 - 11:30")])
    cut = page.evaluate(
        """() => Array.from(document.querySelectorAll(
          '.session-card .session-card-time-badge, .session-card .session-card-title'))
          .filter((e) => e.scrollWidth > e.clientWidth + 1).length"""
    )
    assert cut == 0, "time and title are wrapped, never cut off"
    overflow = page.evaluate(
        "() => document.documentElement.scrollWidth - document.documentElement.clientWidth"
    )
    assert overflow <= 0


def test_three_overlapping_sessions_fall_back_to_full_width_with_a_marker(
    page, local_server
):
    boxes = _mount(
        page,
        local_server,
        [("a", "10:00 - 11:00"), ("b", "10:15 - 11:15"), ("c", "10:30 - 11:30")],
    )
    for box in boxes.values():
        assert box["width"] > 300, f"three lanes do not fit 390 px: {box}"
    assert boxes["b"]["top"] >= boxes["a"]["bottom"] - 1
    markers = page.locator(".session-overlap-note")
    assert markers.count() == 3
    assert "10:30 - 11:30" in markers.nth(0).inner_text()
