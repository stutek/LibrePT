# tests/e2e/test_sessions_day_footer.py
# End-to-end coverage of the mirrored sticky day footer (sessionsView.js/sessionTimeline.js): it
# previews the NEXT day-group while scrolling through a long one, not its own day (that was the
# original "duplicate label" bug — printing the same day name at both edges with nothing between
# them to tell a mirrored pair from a genuine duplicate group). Three regressions already fixed here
# get their own coverage so they can't come back silently:
#   1. A footer must never show the same day its own currently-visible header shows (the duplicate).
#   2. A footer must exist and stay correct across the FULL date range the app supports — sessions
#      seeded far in the future and far in the past, not just "tomorrow" (TODO: nothing in the
#      dashboard's own grouping logic is bucket-limited, so neither is this).
#   3. Deleting an entire day's sessions must re-link the PRECEDING day's footer to whichever day is
#      now its immediate successor, not leave it pointing at the day that no longer exists.
#
# The wall clock is mocked (page.clock.install) so "today" is a fixed, known date regardless of when
# the suite runs — every seeded session's date is expressed relative to that anchor, never to the
# real calendar. Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import datetime
from urllib.parse import urlparse


def _route_path(page):
    """The URL path alone, without the query string. Assertions here are about which day the router
    navigated to; the query carries unrelated deep-link parameters (conftest appends `splash=off`)
    that the router deliberately preserves across navigation."""
    return urlparse(page.url).path.rstrip("/")


ANCHOR = "2026-07-28T09:00:00"
ANCHOR_DATE = datetime.date(2026, 7, 28)


def _iso(offset_days):
    return (ANCHOR_DATE + datetime.timedelta(days=offset_days)).isoformat()


def _session(id_, offset_days, title, hour=10):
    return {
        "id": id_,
        "time": f"{hour:02d}:00 - {hour + 1:02d}:00",
        "startDate": f"{_iso(offset_days)}T{hour:02d}:00:00.000Z",
        "title": title,
        "location": "",
        "participants": [],
        "routineId": "",
        "maxCapacity": 1,
        "day": "today" if offset_days == 0 else "upcoming",
    }


def _tall_day_sessions(id_prefix, offset_days, count=10):
    """`count` sessions on the same day, spread across distinct hours — enough for the group to
    exceed one viewport's height, which is what earns a group its footer at all (a day whose cards
    all fit on one screen already shows its own header and its successor's together)."""
    return [
        _session(f"{id_prefix}{i}", offset_days, f"Session {i}", hour=6 + i)
        for i in range(count)
    ]


def _seed_sessions(page, local_server, sessions):
    """Replace state.sessions outright and reload, so every test's day-group shape is exactly what
    it declares — never dependent on the demo dataset's own (evolving) content."""
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    page.evaluate(
        """async (sessions) => {
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const queueUrl = new URL('data/writeQueue.js', document.baseURI).href;
            const store = await import(stateUrl);
            const queue = await import(queueUrl);
            const state = store.getState();
            state.sessions = sessions;
            store.saveToLocalStorage();
            // The write is write-behind onto IndexedDB now (TODO §18.6 part 4): a reload must wait
            // for it to land, or it can race the write and read back stale data.
            await queue.flushWrites();
        }""",
        sessions,
    )
    page.reload()
    page.wait_for_selector(".sessions-day-group")
    page.wait_for_timeout(500)


def _group_dates_in_order(page):
    return page.evaluate(
        "() => [...document.querySelectorAll('.sessions-day-group')].map(g => g.dataset.date)"
    )


def _footer_text_for(page, date):
    return page.evaluate(
        """(date) => {
            const g = document.querySelector(`.sessions-day-group[data-date="${date}"]`);
            const f = g?.querySelector('.sessions-day-group-footer');
            return f ? f.textContent.trim().replace(/\\s+/g, ' ') : null;
        }""",
        date,
    )


def _header_text_for(page, date):
    return page.evaluate(
        """(date) => {
            const g = document.querySelector(`.sessions-day-group[data-date="${date}"]`);
            const h = g?.querySelector('.sessions-day-group-header');
            return h ? h.textContent.trim().replace(/\\s+/g, ' ') : null;
        }""",
        date,
    )


def test_footer_previews_the_next_day_not_a_duplicate_of_this_one(page, local_server):
    page.clock.install(time=ANCHOR)
    sessions = _tall_day_sessions("today", 0) + [
        _session("tmr0", 1, "Tomorrow Session")
    ]
    _seed_sessions(page, local_server, sessions)

    today_iso, tomorrow_iso = _iso(0), _iso(1)
    assert _group_dates_in_order(page) == [today_iso, tomorrow_iso]

    header_text = _header_text_for(page, today_iso)
    footer_text = _footer_text_for(page, today_iso)
    assert footer_text is not None, "a day taller than the viewport must have a footer"
    assert footer_text != header_text, (
        "the footer must preview the NEXT day, never repeat this group's own header text"
    )
    assert footer_text == _header_text_for(page, tomorrow_iso), (
        "the footer's text must match the successor day-group's own header exactly"
    )

    # The last day-group has nothing to preview and must not get a footer at all.
    assert _footer_text_for(page, tomorrow_iso) is None


def test_no_visible_duplicate_while_scrolling_through_a_long_day(page, local_server):
    """The concrete regression: scrolling through a day taller than the viewport must never show
    the same day name in a header and a footer at once (mirroring, not duplicating)."""
    page.clock.install(time=ANCHOR)
    sessions = _tall_day_sessions("today", 0, count=14) + [
        _session("tmr0", 1, "Tomorrow Session")
    ]
    _seed_sessions(page, local_server, sessions)

    scroll_height = page.evaluate(
        "document.getElementById('main-content').scrollHeight"
    )
    step = max(1, scroll_height // 12)
    for target in range(0, scroll_height, step):
        page.evaluate(
            "(y) => { document.getElementById('main-content').scrollTop = y; }", target
        )
        page.wait_for_timeout(
            150
        )  # let the IntersectionObserver settle before measuring
        state = page.evaluate(
            """() => {
                const inView = (r) => r.bottom > 0 && r.top < window.innerHeight;
                const headers = [...document.querySelectorAll('.sessions-day-group-header')]
                    .map((h) => ({ text: h.textContent.trim().replace(/\\s+/g, ' '), r: h.getBoundingClientRect() }))
                    .filter((h) => inView(h.r))
                    .map((h) => h.text);
                const footers = [...document.querySelectorAll('.sessions-day-group-footer')]
                    .filter((f) => getComputedStyle(f).visibility === 'visible')
                    .map((f) => ({ text: f.textContent.trim().replace(/\\s+/g, ' '), r: f.getBoundingClientRect() }))
                    .filter((f) => inView(f.r))
                    .map((f) => f.text);
                return { headers, footers };
            }"""
        )
        duplicate = set(state["footers"]) & set(state["headers"])
        assert not duplicate, (
            f"at scrollTop={target}, a footer duplicated a currently-visible header: "
            f"headers={state['headers']} footers={state['footers']}"
        )


def test_footer_click_jumps_to_the_previewed_day(page, local_server):
    page.clock.install(time=ANCHOR)
    sessions = _tall_day_sessions("today", 0) + [
        _session("tmr0", 1, "Tomorrow Session")
    ]
    _seed_sessions(page, local_server, sessions)

    today_iso, tomorrow_iso = _iso(0), _iso(1)
    # The footer is only a real tap target once it is actually the stuck, visible one — force it
    # rather than depending on exact scroll geometry, the same way the app's own click handler
    # works regardless of visibility state.
    page.evaluate(
        """(date) => {
            document.querySelector(`.sessions-day-group[data-date="${date}"] .sessions-day-group-footer`).click();
        }""",
        today_iso,
    )
    page.wait_for_timeout(900)
    assert _route_path(page).endswith(tomorrow_iso), (
        "clicking the footer must jump to the day it previews, not the day it belongs to"
    )


def test_session_far_in_the_future_gets_its_own_day_group_and_footer(
    page, local_server
):
    far_future = 180
    page.clock.install(time=ANCHOR)
    sessions = _tall_day_sessions("today", 0) + [
        _session("ff0", far_future, "Far Future Session")
    ]
    _seed_sessions(page, local_server, sessions)

    today_iso, far_iso = _iso(0), _iso(far_future)
    assert _group_dates_in_order(page) == [today_iso, far_iso], (
        "a session 180 days out must still sort into its own chronological day-group"
    )
    # Today is the only group taller than the viewport, so it is the only one that gets a footer;
    # it must preview the far-future day exactly, however distant the actual calendar gap is.
    assert _footer_text_for(page, today_iso) == _header_text_for(page, far_iso)
    assert _footer_text_for(page, far_iso) is None, "the last group never gets a footer"


def test_session_far_in_the_past_gets_its_own_day_group_and_footer(page, local_server):
    far_past = -180
    page.clock.install(time=ANCHOR)
    sessions = [_session("fp0", far_past, "Far Past Session")] + _tall_day_sessions(
        "today", 0
    )
    _seed_sessions(page, local_server, sessions)

    past_iso, today_iso = _iso(far_past), _iso(0)
    assert _group_dates_in_order(page) == [past_iso, today_iso], (
        "a session 180 days back must still sort chronologically before today"
    )
    # The far-past group is short (one session) — but it must still preview today next, since
    # nothing in the footer/prune logic may special-case distance.
    assert _footer_text_for(page, past_iso) == _header_text_for(page, today_iso)


def test_deleting_a_whole_day_relinks_the_preceding_footer_to_its_new_successor(
    page, local_server
):
    """Day B sits between two taller days A and C. A's footer previews B. Deleting every session
    on B must re-point A's footer at C — not leave it dangling on a day that no longer renders, and
    not silently drop the footer just because the immediate successor changed."""
    page.clock.install(time=ANCHOR)
    sessions = (
        _tall_day_sessions("a", 0)
        + [_session("b0", 1, "Day B Session")]
        + _tall_day_sessions("c", 2)
    )
    _seed_sessions(page, local_server, sessions)

    day_a, day_b, day_c = _iso(0), _iso(1), _iso(2)
    assert _group_dates_in_order(page) == [day_a, day_b, day_c]
    assert _footer_text_for(page, day_a) == _header_text_for(page, day_b), (
        "before the delete, A's footer previews its immediate successor B"
    )

    # Remove every session on day B entirely, the same way clearing a day of bookings would.
    page.evaluate(
        """async (dayB) => {
            const stateUrl = new URL('data/stateStore.js', document.baseURI).href;
            const queueUrl = new URL('data/writeQueue.js', document.baseURI).href;
            const store = await import(stateUrl);
            const queue = await import(queueUrl);
            const state = store.getState();
            state.sessions = state.sessions.filter((s) => !s.startDate.startsWith(dayB));
            store.saveToLocalStorage();
            // Write-behind onto IndexedDB (TODO §18.6 part 4): wait for it before reloading.
            await queue.flushWrites();
        }""",
        day_b,
    )
    page.reload()
    page.wait_for_selector(".sessions-day-group")
    page.wait_for_timeout(500)

    assert _group_dates_in_order(page) == [day_a, day_c], (
        "day B's group must be gone entirely once it has no sessions left"
    )
    assert _footer_text_for(page, day_a) == _header_text_for(page, day_c), (
        "A's footer must now preview C, its new immediate successor — not vanish, and not still "
        "point at the deleted day B"
    )
    assert _footer_text_for(page, day_c) is None, (
        "the last remaining group never gets a footer"
    )
