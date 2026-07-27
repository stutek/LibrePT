# tests/e2e/test_sessions_dashboard.py
# End-to-end coverage of the dashboard's continuous, time-ordered session timeline (TODO §7.3
# item 8): the title bar reporting the focused date, arrow/logo/today navigation, a real touch
# scroll updating the focused date, and the single-vertical-column invariant across viewports.
# Fixtures (page, browser, local_server) come from tests/conftest.py + pytest-playwright.

import datetime


def test_sessions_day_navigation(page, local_server):
    """
    Verifies the sessions title bar reports the focused date (weekday + date),
    and that the title arrows step across the timeline's day-groups.
    """
    page.goto(local_server)

    weekday = page.locator("#calendar-title-weekday")
    today = datetime.date.today()

    # Dashboard opens focused on today: ISO date + weekday show today
    page.wait_for_selector("#calendar-title-weekday")
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == today.strftime(
        "%Y-%m-%d"
    )

    # Left arrow steps back to the previous day-group (the seed data's earliest is yesterday)
    page.locator("#btn-sessions-prev").click()
    page.wait_for_timeout(900)
    yesterday = today - datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == yesterday.strftime("%A").upper()

    # Yesterday is the earliest loaded day-group, so stepping further back is a dead end
    assert page.locator("#btn-sessions-prev").is_disabled()

    # Right arrow returns to today, then steps on to tomorrow
    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)

    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    tomorrow = today + datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()

    # Going home via the logo pulls focus back to today
    page.locator("#logo-area").click()
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()

    # The Today control resets the timeline directly, without stepping through the arrows
    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    page.locator("#btn-sessions-today").click()
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert page.locator("#btn-sessions-today").is_disabled(), (
        "the Today control disables itself once today is already focused"
    )

    # Scrolling the timeline itself (rather than the arrows) must retitle to the date it settles on
    tomorrow_iso = tomorrow.strftime("%Y-%m-%d")
    page.evaluate(
        """(iso) => {
      const group = document.querySelector(`.sessions-day-group[data-date="${iso}"]`);
      if (group) group.scrollIntoView({ behavior: 'auto', block: 'start' });
    }""",
        tomorrow_iso,
    )
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == tomorrow_iso


def test_scrolling_the_timeline_updates_the_focused_day(page, local_server):
    """The old day-deck's custom swipe/fling-clamp logic is gone with the horizontal carousel —
    the continuous timeline is plain native browser scrolling plus an IntersectionObserver
    watching the sticky headers (sessionTimeline.js), so what actually needs proving is that
    scroll position drives the focused date, not any particular input method. Driving the
    scroll directly (rather than a synthetic touch/wheel gesture, which headless Chromium does
    not reliably turn into real scrolling for a plain overflow container) tests exactly that,
    deterministically."""
    page.goto(local_server)
    page.wait_for_selector(".sessions-day-group")
    # Boot re-renders the timeline more than once (recovering an active session, notifications,
    # etc.), and each render re-arms a brief "ignore scroll during a programmatic settle" guard
    # (sessionTimeline.js) so the title doesn't flicker mid-scrollIntoView. Give every boot-time
    # render's guard window a chance to expire before driving a scroll of our own.
    page.wait_for_timeout(1200)

    weekday = page.locator("#calendar-title-weekday-short")
    today = datetime.date.today()
    assert weekday.inner_text().strip().upper() == today.strftime("%a").upper()

    page.evaluate("() => { document.getElementById('main-content').scrollTop += 900; }")
    page.wait_for_timeout(1000)
    assert weekday.inner_text().strip().upper() != today.strftime("%a").upper(), (
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

    weekday = page.locator("#calendar-title-weekday")
    today = datetime.date.today()
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()

    far_future = (today + datetime.timedelta(days=3)).strftime("%Y-%m-%d")
    page.locator("#sessions-date-jump-input").fill(far_future)
    page.locator("#sessions-date-jump-input").dispatch_event("change")
    page.wait_for_timeout(900)

    # The seed data has nothing exactly 3 days out, so this also proves the "nearest date forward,
    # else the latest loaded" fallback (focusSessionsColumn) lands on real content, not nowhere.
    assert page.locator("#calendar-title-date").inner_text().strip() != today.strftime(
        "%Y-%m-%d"
    ), "jumping 3 days out must move the focused date off today"


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
