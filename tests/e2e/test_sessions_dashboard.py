# tests/e2e/test_sessions_dashboard.py
# End-to-end coverage of the dashboard's continuous, time-ordered session timeline (TODO §7.3
# item 8): the focused date reflected in the URL, the Today control, a real touch
# scroll updating the focused date, and the single-vertical-column invariant across viewports.
# Fixtures (page, browser, local_server) come from tests/conftest.py + pytest-playwright.

import datetime
from urllib.parse import urlparse

from tests.conftest import frozen_today, frozen_today_iso


def _route_path(page):
    """The URL path alone, without the query string. Assertions here are about which day the router
    navigated to; the query carries unrelated deep-link parameters (conftest appends `splash=off`)
    that the router deliberately preserves across navigation."""
    return urlparse(page.url).path.rstrip("/")


# Boot re-renders the timeline more than once (recovering an active session, notifications, the
# seeded demo data), and EVERY render re-settles the scroll to `focusedSessionDate` — so a test
# that starts scrolling before the last boot render's settle has run gets its own scroll silently
# overwritten by a later one arriving mid-flight. The focused date already reads "today" from the
# very first render (it is that variable's initial value), so waiting on the URL alone proves
# nothing about whether boot is still churning underneath it — that URL can already be "correct"
# while a later render is still queued to yank the scroll back to it out from under a real user (or
# test) action. `sessionTimeline.js` stamps a generation number on #sessions-categories-grid each
# time it schedules a settle and a matching `settled` marker once that settle actually runs; waiting
# for the generation to stop advancing is a genuine quiescence signal, not a guessed duration.
#
# `polling=100` (an interval, not the `wait_for_function` default of `"raf"`) is deliberate on every
# wait in this file: once a rAF-driven poll resolves, headless Chromium can stop producing new
# compositor frames until something else asks for one — and a bare `scrollTop` write doesn't
# reliably ask. That silently starves this page's own IntersectionObserver-driven scrollspy, so a
# scroll performed right after a rAF-polled wait can sit forever without the URL ever updating
# (confirmed by direct repro: identical scroll, only the polling mode of the preceding wait
# differed). An interval poll doesn't create that dependency.
def _wait_for_timeline_settled(page):
    page.evaluate(
        "() => { window.__lastSettleGen = -1; window.__settleStableTicks = 0; }"
    )
    page.wait_for_function(
        """() => {
          const grid = document.getElementById('sessions-categories-grid');
          if (!grid) return false;
          const gen = Number(grid.dataset.settleGen || 0);
          const settled = Number(grid.dataset.settled || 0) === gen;
          if (gen === window.__lastSettleGen && settled) {
            window.__settleStableTicks++;
          } else {
            window.__lastSettleGen = gen;
            window.__settleStableTicks = 0;
          }
          return window.__settleStableTicks >= 5;
        }""",
        polling=100,
    )


def _wait_for_focused_date(page, iso_date):
    page.wait_for_function(
        "(iso) => location.pathname.replace(/\\/$/, '').endsWith(iso)",
        arg=iso_date,
        polling=100,
    )


def _wait_for_focused_date_to_change_from(page, iso_date):
    page.wait_for_function(
        "(iso) => !location.pathname.replace(/\\/$/, '').endsWith(iso)",
        arg=iso_date,
        polling=100,
    )


def test_sessions_day_navigation(page, local_server):
    """
    Verifies the dashboard opens focused on today (reflected in the URL, since `/` redirects to
    `/sessions/<isoDate>`), that scrolling to a day-group updates the URL to match, and that the
    Today control resets the timeline and disables itself once today is already focused. The old
    prev/next title-bar arrows and the weekday/date text are gone from the UI (removed in favor of
    the sticky per-day headers already showing each group's own date) — this test only covers what
    remains.
    """
    page.goto(local_server)
    page.wait_for_selector(".sessions-day-group")
    # Guards against the boot-settle race fixed in sessionTimeline.js/sessionRoutes.js
    # (scheduleTimelineSettle) — belt-and-braces alongside the fixed-delay waits below, which this
    # test keeps: several `wait_for_function` polls back-to-back in this specific multi-hop
    # scroll-then-navigate-then-scroll-again sequence were empirically LESS reliable here than a
    # plain wait, for reasons that traced back into headless Chromium's own frame-production
    # scheduling rather than anything under this app's control (see test_sessions_dashboard.py's
    # sibling tests, which use the polling form successfully for their simpler single-scroll cases).
    _wait_for_timeline_settled(page)
    today_iso = frozen_today_iso()

    # Dashboard opens focused on today
    page.wait_for_timeout(900)
    assert _route_path(page).endswith(today_iso)

    # Scrolling the timeline to another day-group must retitle the URL to the date it settles on
    tomorrow = frozen_today() + datetime.timedelta(days=1)
    tomorrow_iso = tomorrow.strftime("%Y-%m-%d")
    page.evaluate(
        """(iso) => {
      const group = document.querySelector(`.sessions-day-group[data-date="${iso}"]`);
      if (group) group.scrollIntoView({ behavior: 'auto', block: 'start' });
    }""",
        tomorrow_iso,
    )
    page.wait_for_timeout(900)
    assert _route_path(page).endswith(tomorrow_iso)

    # Going home via the logo pulls focus back to today
    page.locator("#logo-area").click()
    page.wait_for_timeout(900)
    assert _route_path(page).endswith(today_iso)

    # The Today control resets the timeline directly
    page.evaluate(
        """(iso) => {
      const group = document.querySelector(`.sessions-day-group[data-date="${iso}"]`);
      if (group) group.scrollIntoView({ behavior: 'auto', block: 'start' });
    }""",
        tomorrow_iso,
    )
    page.wait_for_timeout(900)
    # Today lives in the date filter's calendar since 2026-09-21 (§74.2), so reaching it is two
    # taps: the date chip opens the calendar, and Today is in its header beside the month.
    page.locator("#filter-chip-dates").click()
    page.locator(".filter-today-btn").click()
    page.wait_for_timeout(900)
    assert _route_path(page).endswith(today_iso)


def test_scrolling_the_timeline_updates_the_focused_day(page, local_server):
    """The old day-deck's custom swipe/fling-clamp logic is gone with the horizontal carousel —
    the continuous timeline is plain native browser scrolling plus an IntersectionObserver
    watching the sticky headers (sessionTimeline.js), so what actually needs proving is that
    scroll position drives the focused date, not any particular input method. Driving the
    scroll directly (rather than a synthetic touch/wheel gesture, which headless Chromium does
    not reliably turn into real scrolling for a plain overflow container) tests exactly that,
    deterministically. The focused date is read from the URL (`/sessions/<isoDate>`), since the
    title bar no longer renders it as text."""
    page.goto(local_server)
    page.wait_for_selector(".sessions-day-group")
    _wait_for_timeline_settled(page)

    today_iso = frozen_today_iso()
    _wait_for_focused_date(page, today_iso)

    page.evaluate("() => { document.getElementById('main-content').scrollTop += 900; }")
    _wait_for_focused_date_to_change_from(page, today_iso)


# The date-jump control was removed on 2026-09-11 and its test with it (TODO §45.6). It opened a
# native `<input type="date">` and SCROLLED the timeline to the chosen day; the filter row's date
# chip now filters to that day, which is the stronger answer to the same need and is covered by
# tests/medium/test_session_filters.py. The test is deleted rather than rewritten because what it
# pinned — "reach an exact date" — is no longer reached this way at all, and a test kept alive
# against a control nobody can see would be the worst of both.


def test_the_filter_calendar_survives_the_boards_own_rerender(page, local_server):
    """Reported by Simon the day it was built: the calendar closed after the first tap (TODO §45.6).

    The medium tier could not see it — the board there is rendered by the stub and nothing else — and
    in the real app renderSessions() is called by half a dozen other things (the timers, the
    notification area, a recovered session), each of which repaints the filter row. What must hold is
    that a repaint carries the open calendar with it: a range takes two taps, so a calendar that
    closes after the first can never make one."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")

    page.locator("#filter-chip-dates").click()
    calendar = page.locator("#sessions-filter-calendar")
    calendar.wait_for(state="visible", timeout=5000)

    calendar.locator(".filter-day").nth(7).click()

    assert calendar.is_visible(), "the calendar closed after the first tap"
    assert calendar.locator(".filter-day-end").count() == 1

    # ON SCREEN, not merely open. The board's own re-render settles the focused day to the top of the
    # scrolling container, and this row lives above the list — so without skipSettleOnNextRender()
    # the calendar stayed open and scrolled out of sight, which reads as having closed.
    box = calendar.bounding_box()
    viewport = page.viewport_size["height"]
    assert box is not None and box["y"] < viewport, (
        f"the calendar was scrolled out of the viewport (y={box and box['y']}, height={viewport})"
    )


def test_the_filter_row_stays_on_screen_while_the_board_scrolls(page, local_server):
    """The filters live in the sticky header with the title (asked 2026-09-11, TODO §45.6).

    They were a row below it, which meant scrolling the board took the filters off the screen while
    the thing they filter stayed on it — a filter you cannot see is the modal's defect arriving by
    another road, and the board would look short with nothing on screen saying why."""
    page.goto(f"{local_server}?init=demo_data_load&lang=en")
    page.wait_for_selector(".session-card")

    chips = page.locator("#filter-chip-dates")
    top_before = chips.bounding_box()["y"]

    page.evaluate(
        "() => { document.getElementById('main-content').scrollTop += 1200; }"
    )
    page.wait_for_timeout(400)

    after = chips.bounding_box()
    assert after is not None, "the filter row left the layout when the board scrolled"
    assert abs(after["y"] - top_before) < 4, (
        f"the filter row scrolled with the list (y {top_before} → {after['y']}) instead of sticking"
    )
