# tests/medium/test_session_filters.py
# The board's filter row (TODO §45.6): the chips narrow the board, they SAY what they narrowed it to,
# and the calendar's taps follow the documented model rather than one of our own.
#
# Medium tier: this is markup plus the board's own render, and nothing here needs the router, a
# database or a real boot. The click RULES are pinned as pure logic in
# tests/unit_js/domain/sessionFilters.test.mjs; what is proved here is that the controls are wired to
# them and that the board actually changes.
# Mounted via tests/medium/_harness.py's SESSIONS_STUB; fixtures come from tests/conftest.py.

import pytest

from tests.medium._harness import SESSIONS_STUB, load_with_stub

pytestmark = pytest.mark.clean_start


def _card_count(page):
    return page.locator("#sessions-categories-grid .session-card").count()


def _open_calendar(page):
    """Opened ONCE per test. It stays open across taps on purpose — a range takes two taps, so a
    calendar that closed after the first could never make one — and tapping the chip again is what
    closes it."""
    page.locator("#filter-chip-dates").click()
    page.wait_for_selector("#sessions-filter-calendar:not([hidden])")


def test_the_row_is_chips_and_starts_empty(page, local_server):
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector("#sessions-filter-bar")

    # Three filters and no clear button, because nothing is on yet — the row is the readout, so an
    # offer to clear nothing would be a lie about the state of the board.
    assert page.locator("#filter-chip-dates").is_visible()
    assert page.locator("#filter-chip-client").is_visible()
    assert page.locator("#filter-chip-location").is_visible()
    assert page.locator("#filter-clear").is_hidden()
    assert page.locator("#sessions-filter-calendar").is_hidden()


def test_a_client_filter_narrows_the_board_and_says_so(page, local_server):
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector("#sessions-filter-bar")
    before = _card_count(page)
    assert before > 0, "the seeded board must have something to filter"

    client = page.locator("#filter-chip-client")
    value = client.locator("option").nth(1).get_attribute("value")
    client.select_option(value)

    assert _card_count(page) < before, "choosing a client must narrow the board"
    # The chip carries the state: a board that is short without saying why is the defect this row
    # exists to prevent.
    assert "active" in (
        page.locator("#filter-chip-client").get_attribute("class") or ""
    )
    assert page.locator("#filter-clear").is_visible()


def test_clearing_puts_every_session_back(page, local_server):
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector("#sessions-filter-bar")
    before = _card_count(page)

    client = page.locator("#filter-chip-client")
    client.select_option(client.locator("option").nth(1).get_attribute("value"))
    page.locator("#filter-clear").click()

    assert _card_count(page) == before
    assert page.locator("#filter-clear").is_hidden()


def test_the_calendar_selects_a_day_then_a_range_then_starts_over(page, local_server):
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector("#sessions-filter-bar")
    _open_calendar(page)

    calendar = page.locator("#sessions-filter-calendar")
    calendar.locator(".filter-day").nth(7).click()
    # VISIBLE, not merely present: a hidden calendar still has its day buttons in the DOM, so
    # counting them would pass against a calendar that had closed itself — and a calendar that closes
    # after the first tap can never make a range at all.
    assert calendar.is_visible(), (
        "the calendar stays open between the two taps of a range"
    )
    assert calendar.locator(".filter-day-end").count() == 1, (
        "one tap is one day, and a single day has one end"
    )

    calendar.locator(".filter-day").nth(11).click()
    assert calendar.locator(".filter-day-end").count() == 2, (
        "the second tap makes a range"
    )
    assert calendar.locator(".filter-day-inside").count() == 3, (
        "the days between the ends are covered by the range, not chosen — and are drawn as such"
    )

    # The third tap starts over from that day. This is the behaviour every documented picker has
    # (eBay, Syncfusion, react-dates), and the reason neither alternating taps nor a "nearer end
    # moves" rule was built: both make the next tap's meaning depend on something invisible.
    calendar.locator(".filter-day").nth(20).click()
    assert calendar.locator(".filter-day-end").count() == 1
    assert calendar.locator(".filter-day-inside").count() == 0


def test_an_armed_end_moves_on_its_own(page, local_server):
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector("#sessions-filter-bar")
    _open_calendar(page)

    calendar = page.locator("#sessions-filter-calendar")
    calendar.locator(".filter-day").nth(7).click()
    calendar.locator(".filter-day").nth(14).click()

    # Arming the start and tapping a day moves ONLY that end — the range survives, where an
    # unarmed tap would have started over.
    page.locator("[data-arm='from']").click()
    calendar.locator(".filter-day").nth(9).click()

    assert calendar.locator(".filter-day-end").count() == 2, (
        "the range is still a range"
    )
    assert calendar.locator(".filter-day-inside").count() == 4
    # Arming is spent on the tap it aimed: leaving it lit would make the next tap move the same end
    # again, which is the invisible mode this whole design avoids.
    assert page.locator("[data-arm='from']").get_attribute("aria-pressed") == "false"


def test_a_filter_matching_nothing_says_it_is_the_filter(page, local_server):
    load_with_stub(page, local_server, SESSIONS_STUB)
    page.wait_for_selector("#sessions-filter-bar")
    _open_calendar(page)

    # A day far outside the seeded board: the first cell of the grid, then paged back a year.
    for _ in range(12):
        page.locator("[data-month='-1']").click()
    page.locator("#sessions-filter-calendar .filter-day").nth(7).click()

    assert _card_count(page) == 0
    empty = page.locator("#sessions-categories-grid").inner_text()
    assert "filter" in empty.lower(), (
        "an empty board must say the filters emptied it, or the trainer goes looking for lost data"
    )
