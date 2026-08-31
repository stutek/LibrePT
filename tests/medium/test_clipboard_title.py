# tests/medium/test_clipboard_title.py
# The clipboard's session title has to be readable (reported 2026-08-18: "we need to make clipboard
# session titles readable — the three dots menu and edit icon take too much space from the title
# label").
#
# Measured on a 390px phone before the fix: the title block got 103px of 390 while the actions took
# 239. A session called "Group Strength & Conditioning" had room for about nine characters, which is
# not a title, it is a hint.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import (
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)
from tests.medium._overflow import assert_component_fits

pytestmark = pytest.mark.clean_start

PHONE = {"width": 390, "height": 844}
LONG_TITLE = "Group Strength & Conditioning — Tuesday"


def _mount(page, local_server):
    page.set_viewport_size(PHONE)
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=[exercise_item("e1", "Back Squat")])
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.evaluate(
        "(title) => { document.getElementById('session-title-text').textContent = title; }",
        LONG_TITLE,
    )
    page.wait_for_timeout(300)


def test_the_title_gets_the_larger_half_of_its_own_bar(page, local_server):
    _mount(page, local_server)

    title = page.locator("#session-title-text").bounding_box()
    bar_width = page.evaluate(
        "() => document.querySelector('.session-title-block').parentElement.clientWidth"
    )

    assert title["width"] > bar_width * 0.5, (
        f"title has {title['width']}px of {bar_width}px — the controls beside it take the rest"
    )


def test_every_control_on_the_line_is_still_reachable(page, local_server):
    """Making room must not come from shrinking targets below what a thumb can hit
    ."""
    _mount(page, local_server)

    for selector in ("#btn-edit-plan", "#btn-session-menu"):
        control = page.locator(selector)
        if control.count() == 0 or not control.is_visible():
            continue
        box = control.bounding_box()
        assert min(box["width"], box["height"]) >= 32, f"{selector} is {box}"


def test_the_bar_says_which_session_over_when_and_where(page, local_server):
    """TODO §39.6, reported 2026-08-31 at desktop width: "this one clips on desktop".

    The bar carried `2026-09-01 11:30 playground outside` on one 22px line — no session name
    anywhere in the clipboard, and 90px of that line lost to an ellipsis on a desktop window. The
    repo's own sweep passes that, correctly: an ellipsis is visible truncation, not the silent
    clipping `overflow_scan` hunts for.

    Two lines cost nothing, because the bar's height comes from the 44px touch row its buttons need
    and the title was using 25px of it. What this pins is the ORDER, which is what survives a long
    gym name: the session's name leads and gets the larger type, and the day, time and gym follow
    under it — the gym last, being the least identifying thing on the bar."""
    _mount(page, local_server)
    # The real renderer, handed a session — not the stub's hand-set string. Its own deps, because
    # this tier boots one component rather than the app, and the module reads its session through
    # them (the harness wires the clipboard, not this bar).
    page.evaluate(
        """async () => {
          const m = await import(new URL('modules/session/sessionTitleBar.js', document.baseURI).href);
          m.initSessionTitleBar({
            getActiveSession: () => ({
              sourceSession: {
                titles: ['Group Strength & Conditioning'],
                day: 'today',
                timeLabel: '17:00 - 19:00',
                location: 'Trib gym base',
                startDate: '2026-09-01T15:00:00.000Z',
              },
            }),
            getISODateString: (d) => new Date(d).toISOString().slice(0, 10),
            formatClockFromMinutes: () => '17:00',
            t: (key) => key,
          });
          m.renderSessionTitle();
        }"""
    )
    page.wait_for_timeout(200)

    bar = page.locator("#session-title-text").inner_text()
    assert "Group Strength & Conditioning" in bar, bar
    assert "Trib gym base" in bar, bar

    name = page.locator(".clipboard-title-name")
    under = page.locator(".clipboard-title-when")
    assert name.count(), "the bar has no line carrying the session's name"
    assert name.bounding_box()["y"] < under.bounding_box()["y"], (
        "the session's name must lead; when and where sit under it"
    )
    sizes = page.evaluate(
        "() => ['.clipboard-title-name', '.clipboard-title-when']"
        "        .map((s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize))"
    )
    assert sizes[0] > sizes[1], f"the name must be the larger of the two lines: {sizes}"


def test_nothing_in_the_title_bar_is_pushed_out_of_it(page, local_server):
    """§25.5's defect was here: with the title ellipsised, the edit-mode chip beside it was pushed
    169px outside the bar and vanished entirely. Geometry, in the test that owns this component —
    the route walk in tests/e2e/ sees the same thing but names only the route it happened on."""
    _mount(page, local_server)

    assert_component_fits(
        page, ".session-title-block", label="clipboard title bar", viewport=None
    )
