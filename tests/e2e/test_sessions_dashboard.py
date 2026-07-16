# tests/e2e/test_sessions_dashboard.py
# End-to-end coverage of the dashboard's day deck: the title bar reporting the focused day,
# arrow/logo navigation, single-finger swipe between days, and the single-column invariant.
# Fixtures (page, browser, local_server) come from tests/conftest.py + pytest-playwright.

import datetime


def test_sessions_day_navigation(page, local_server):
    """
    Verifies the sessions title bar reports the focused day (weekday + date + Today tag),
    that the title arrows step across the day deck, and that going home re-focuses today.
    """
    page.goto(local_server)

    weekday = page.locator("#calendar-title-weekday")
    tag = page.locator("#calendar-title-tag")
    today = datetime.date.today()

    # Dashboard opens focused on today: ISO date, weekday and the (Today) tag are all present
    page.wait_for_selector("#calendar-title-weekday")
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == today.strftime("%Y-%m-%d")
    assert tag.is_visible()

    # Left arrow steps back to yesterday and drops the (Today) tag
    page.locator("#btn-sessions-prev").click()
    page.wait_for_timeout(900)
    yesterday = today - datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == yesterday.strftime("%A").upper()
    assert tag.is_hidden()

    # Yesterday is the first column, so stepping further back is a dead end
    assert page.locator("#btn-sessions-prev").is_disabled()

    # Right arrow returns to today, then steps on to tomorrow
    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    assert tag.is_visible()

    page.locator("#btn-sessions-next").click()
    page.wait_for_timeout(900)
    tomorrow = today + datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()
    assert tag.is_hidden()

    # Going home via the logo pulls focus back to today
    page.locator("#logo-area").click()
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == today.strftime("%A").upper()
    assert tag.is_visible()

    # A swipe of the deck itself (rather than the arrows) must retitle to the day it lands on
    page.evaluate("""() => {
      const grid = document.getElementById('sessions-categories-grid');
      const col = document.getElementById('tomorrow-sessions-column');
      grid.scrollTo({
        left: grid.scrollLeft + (col.getBoundingClientRect().left - grid.getBoundingClientRect().left),
        behavior: 'auto'
      });
    }""")
    page.wait_for_timeout(900)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%A").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == tomorrow.strftime("%Y-%m-%d")
    assert tag.is_hidden()


def _touch_swipe(cdp, page, x, y, dx, steps=12):
    """
    Drag a single finger horizontally across the deck.

    Note: CDP's Input.synthesizeScrollGesture does NOT scroll overflow containers in this
    headless setup (verified against a plain scroll-snap control deck), so the gesture is
    built from raw touch events instead.
    """
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    for i in range(1, steps + 1):
        cdp.send("Input.dispatchTouchEvent", {
            "type": "touchMove",
            "touchPoints": [{"x": x + dx * i / steps, "y": y}],
        })
        page.wait_for_timeout(16)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def test_touch_swipe_between_days(browser, local_server):
    """A real one-finger swipe on the deck must advance exactly one day and retitle the bar."""
    context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
    page = context.new_page()
    page.goto(local_server)
    page.wait_for_selector("#today-sessions-column")
    page.wait_for_timeout(1200)

    cdp = context.new_cdp_session(page)
    weekday = page.locator("#calendar-title-weekday-short")
    tag = page.locator("#calendar-title-tag")
    today = datetime.date.today()

    assert weekday.inner_text().strip().upper() == today.strftime("%a").upper()
    assert tag.is_visible()

    # Swiping left walks forward to tomorrow
    _touch_swipe(cdp, page, 195, 300, -300)
    page.wait_for_timeout(1200)
    tomorrow = today + datetime.timedelta(days=1)
    assert weekday.inner_text().strip().upper() == tomorrow.strftime("%a").upper()
    assert page.locator("#calendar-title-date").inner_text().strip() == tomorrow.strftime("%Y-%m-%d")
    assert tag.is_hidden()

    # Swiping right walks back to today, tag and all
    _touch_swipe(cdp, page, 195, 300, 300)
    page.wait_for_timeout(1200)
    assert weekday.inner_text().strip().upper() == today.strftime("%a").upper()
    assert tag.is_visible()

    context.close()


def test_single_column_deck_at_every_viewport(page, local_server):
    """Exactly one day column may occupy the deck viewport, on phone and desktop alike."""
    visible_columns = """() => {
      const grid = document.getElementById('sessions-categories-grid');
      const gr = grid.getBoundingClientRect();
      return ['yesterday','today','tomorrow','upcoming'].filter(d => {
        const r = document.getElementById(d + '-sessions-column').getBoundingClientRect();
        return r.left < gr.right - 1 && r.right > gr.left + 1;
      });
    }"""

    for width, height in [(390, 844), (868, 843), (1280, 800)]:
        page.set_viewport_size({"width": width, "height": height})
        page.goto(local_server)
        page.wait_for_selector("#today-sessions-column")
        page.wait_for_timeout(700)
        assert page.evaluate(visible_columns) == ["today"], f"expected only today's column at {width}px"
