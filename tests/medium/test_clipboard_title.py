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


def test_the_session_name_opens_the_same_menu_as_the_dots(page, local_server):
    """Asked 2026-08-31 (Simon): "maybe make the ... menu open (edit, copy, delete) on session name
    click instead of separate button".

    ADDED to the ⋯ rather than replacing it, deliberately. That menu holds Delete Session, and a
    destructive action reachable only by tapping a title that carries no affordance is §38.16's
    lesson again — a control that promised less than it did. The ⋯ is the one mark on this bar
    saying there is more here; what the title buys is a much bigger target for the same action,
    which is the ergonomics the request was actually after."""
    _mount(page, local_server)

    page.click(".session-title-block")
    page.wait_for_selector("#session-menu:not(.hidden)", timeout=5000)
    assert page.locator("#session-menu .session-menu-item").count() >= 2, (
        "the title opened something, but not the session menu"
    )
    # The same menu, not a second one — and the ⋯ is still on the bar.
    assert page.locator("#btn-session-menu").is_visible(), (
        "the ⋯ is the only visible mark saying this menu exists; it must stay"
    )
    assert page.locator("#session-menu").count() == 1

    # Tapping the title again puts it away, the way its own button does. `state="attached"`
    # because the menu is hidden by a class: waiting for it to be VISIBLE never resolves.
    page.click(".session-title-block")
    page.wait_for_selector("#session-menu.hidden", state="attached", timeout=5000)


def test_the_title_says_it_is_a_control(page, local_server):
    """A tappable title with nothing announcing it is meaning nobody can find. It cannot carry a
    visible affordance without becoming a button on a bar that already has three, so it carries the
    ones a screen reader and a keyboard use: a role, a name, and the state of the menu it owns."""
    _mount(page, local_server)

    block = page.locator(".session-title-block")
    assert block.get_attribute("role") == "button"
    assert block.get_attribute("aria-haspopup") == "true"
    assert block.get_attribute("aria-expanded") == "false"
    assert (block.get_attribute("aria-label") or "").strip(), "the control has no name"

    block.press("Enter")
    page.wait_for_selector("#session-menu:not(.hidden)", timeout=5000)
    assert block.get_attribute("aria-expanded") == "true"


def test_a_merged_clipboard_names_every_session_in_it(page, local_server):
    """Raised 2026-08-31 (Simon): "the new title mechanics makes also sense from 'merged plans from
    overlapping sessions' too".

    One clipboard can cover several booked slots — `buildSessionMeta` collapses overlapping ones, so
    `titles` and `ids` are arrays. The collapsed clipboard bar has always joined them with " + "
    (sessionBar.js); this title bar shipped reading `titles[0]` and quietly dropped the rest, so two
    merged sessions looked like one, named after whichever sorted first."""
    _mount(page, local_server)
    page.evaluate(
        """async () => {
          const m = await import(new URL('modules/session/sessionTitleBar.js', document.baseURI).href);
          m.initSessionTitleBar({
            getActiveSession: () => ({
              sourceSession: {
                titles: ['Group Strength & Conditioning', 'Rehab Hour'],
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

    name = page.locator(".clipboard-title-name").inner_text()
    assert "Group Strength & Conditioning" in name and "Rehab Hour" in name, (
        f"a merged clipboard must name every session it covers: {name!r}"
    )


def test_the_editor_second_line_is_set_like_the_clipboard_second_line(
    page, local_server
):
    """Reported twice 2026-08-31/09-01 (Simon): "edit scrin title is not unified with clipboard
    title", then "edit screen still has session name in the form of a tag (button?) instead of
    normal title like the clipboard".

    Measured, the session's NAME was already identical in both — 15px, weight 600, no background.
    What made the editor look like a different app was the second line: the clipboard sets day, time
    and gym as plain muted text, and the editor wore a 10px uppercase pill with a border, a 10px
    radius and a red tint for the same day and time.

    Nothing was lost by dropping the pill. Its colour said "this session is running now", and the
    word it wrapped already says that: `Today` and `Yesterday` are the information, and a colour is
    the one part of it a colour-blind trainer cannot read anyway."""
    _mount(page, local_server)
    page.click("#btn-session-menu")
    page.click("#btn-edit-plan")
    page.wait_for_selector(".clipboard-editor", timeout=5000)
    page.wait_for_timeout(400)

    assert page.locator(".edit-mode-chip").count() == 0, (
        "the editor's title still wears a status pill the clipboard's does not"
    )
    style = page.evaluate(
        """() => {
          const el = document.querySelector('#session-title-text .clipboard-title-when');
          if (!el) return null;
          const cs = getComputedStyle(el);
          return { fontSize: cs.fontSize, textTransform: cs.textTransform,
                   background: cs.backgroundColor, radius: cs.borderTopLeftRadius };
        }"""
    )
    assert style, "the editor's second line does not use the clipboard's own when-line"
    assert style["fontSize"] == "12px", style
    assert style["textTransform"] == "none", style
    assert style["radius"] == "0px", style
    assert "0)" in style["background"], f"still tinted like a pill: {style}"
