# tests/e2e/test_sessions_dashboard.py
# End-to-end coverage of the dashboard's continuous, time-ordered session timeline (TODO §7.3
# item 8): the focused date reflected in the URL, today/jump-to-date navigation, a real touch
# scroll updating the focused date, and the single-vertical-column invariant across viewports.
# Fixtures (page, browser, local_server) come from tests/conftest.py + pytest-playwright.

import datetime


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
    today = datetime.date.today()
    today_iso = today.strftime("%Y-%m-%d")

    # Dashboard opens focused on today
    page.wait_for_timeout(900)
    assert page.url.rstrip("/").endswith(today_iso)
    assert page.locator("#btn-sessions-today").is_disabled(), (
        "the Today control disables itself once today is already focused"
    )

    # Scrolling the timeline to another day-group must retitle the URL to the date it settles on
    tomorrow = today + datetime.timedelta(days=1)
    tomorrow_iso = tomorrow.strftime("%Y-%m-%d")
    page.evaluate(
        """(iso) => {
      const group = document.querySelector(`.sessions-day-group[data-date="${iso}"]`);
      if (group) group.scrollIntoView({ behavior: 'auto', block: 'start' });
    }""",
        tomorrow_iso,
    )
    page.wait_for_timeout(900)
    assert page.url.rstrip("/").endswith(tomorrow_iso)
    assert not page.locator("#btn-sessions-today").is_disabled()

    # Going home via the logo pulls focus back to today
    page.locator("#logo-area").click()
    page.wait_for_timeout(900)
    assert page.url.rstrip("/").endswith(today_iso)

    # The Today control resets the timeline directly
    page.evaluate(
        """(iso) => {
      const group = document.querySelector(`.sessions-day-group[data-date="${iso}"]`);
      if (group) group.scrollIntoView({ behavior: 'auto', block: 'start' });
    }""",
        tomorrow_iso,
    )
    page.wait_for_timeout(900)
    page.locator("#btn-sessions-today").click()
    page.wait_for_timeout(900)
    assert page.url.rstrip("/").endswith(today_iso)
    assert page.locator("#btn-sessions-today").is_disabled()


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
    # Boot re-renders the timeline more than once (recovering an active session, notifications,
    # etc.), and each render re-arms a brief "ignore scroll during a programmatic settle" guard
    # (sessionTimeline.js) so the focused date doesn't flicker mid-scrollIntoView. Give every
    # boot-time render's guard window a chance to expire before driving a scroll of our own.
    page.wait_for_timeout(1200)

    today_iso = datetime.date.today().strftime("%Y-%m-%d")
    assert page.url.rstrip("/").endswith(today_iso)

    page.evaluate("() => { document.getElementById('main-content').scrollTop += 900; }")
    page.wait_for_timeout(1000)
    assert not page.url.rstrip("/").endswith(today_iso), (
        "scrolling the timeline must move the focused day-group off today"
    )


def test_date_jump_control_scrolls_to_chosen_date(page, local_server):
    """The date-jump button (TODO §7.3 item 8's "scrub to an exact date" control) opens a native
    `<input type="date">`; choosing a date there must scroll the timeline straight to it. Playwright
    can't drive the native OS picker `.showPicker()` opens, so this fills the (visually hidden but
    still rendered) input directly and fires `change` — exactly what a real picker selection does."""
    page.goto(local_server)
    page.wait_for_selector(".sessions-day-group")
    page.wait_for_timeout(1200)

    today = datetime.date.today()
    today_iso = today.strftime("%Y-%m-%d")
    assert page.url.rstrip("/").endswith(today_iso)

    far_future = (today + datetime.timedelta(days=3)).strftime("%Y-%m-%d")
    page.locator("#sessions-date-jump-input").fill(far_future)
    page.locator("#sessions-date-jump-input").dispatch_event("change")
    page.wait_for_timeout(900)

    # The seed data has nothing exactly 3 days out, so this also proves the "nearest date forward,
    # else the latest loaded" fallback (focusSessionsColumn) lands on real content, not nowhere.
    assert not page.url.rstrip("/").endswith(today_iso), (
        "jumping 3 days out must move the focused date off today"
    )


def test_continuous_vertical_timeline_at_every_viewport(page, local_server):
    """The timeline is one vertical, chronologically-ordered scroll of day-groups — not
    per-viewport paged columns — at every viewport width."""
    check = """() => {
      const groups = Array.from(document.querySelectorAll('.sessions-day-group[data-date]'));
      const dates = groups.map((g) => g.dataset.date);
      const sorted = [...dates].sort();
      const lefts = new Set(groups.map((g) => Math.round(g.getBoundingClientRect().left)));
      return {
        count: groups.length,
        inOrder: JSON.stringify(dates) === JSON.stringify(sorted),
        singleColumn: lefts.size <= 1,
      };
    }"""

    for width, height in [(390, 844), (868, 843), (1280, 800)]:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(local_server)
        page.wait_for_selector(".sessions-day-group")
        page.wait_for_timeout(300)
        result = page.evaluate(check)
        assert result["count"] > 1, "the seed data spans multiple days"
        assert result["singleColumn"], (
            f"day-groups must stack in one column at {width}px"
        )
        assert result["inOrder"], "day-groups must render in chronological order"
