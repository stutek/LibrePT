# tests/e2e/test_app_name_goes_home.py
# Tapping the app name is the way back to now.
#
# Reported 2026-08-18 as "does not link to homepage, seems to be a noop on the session list page".
# The literal half was true and is fixed in the header markup (it was a <div> with a click handler —
# see tests/medium/test_header_menu.py). The "noop" half turned out NOT to be: measured on a phone
# viewport, the tap brings today's column back from 1300px off screen. It read as dead on a desktop
# dashboard, where nothing needs to scroll and the URL is already today's.
#
# So this pins the behaviour that was working and untested. Full e2e because the claim spans the
# header, the router's home redirect and the timeline's settle — three components agreeing.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

PHONE = {"width": 390, "height": 844}
TODAY_HEADER_TOP = """() => {
    const today = document.querySelector('[data-date="2026-08-19"]');
    return today ? Math.round(today.getBoundingClientRect().top) : null;
}"""


def test_tapping_the_app_name_brings_today_back_into_view(page, local_server):
    page.set_viewport_size(PHONE)
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    # The timeline settles itself on entry; sample after it has.
    page.wait_for_timeout(800)

    page.evaluate(
        """() => {
            const headers = [...document.querySelectorAll('[data-date]')];
            headers[headers.length - 1]?.scrollIntoView({ block: 'start' });
        }"""
    )
    page.wait_for_timeout(600)
    scrolled_away = page.evaluate(TODAY_HEADER_TOP)
    assert scrolled_away is not None, (
        "the seeded board has no today column to scroll away from"
    )
    assert scrolled_away < -200, f"expected today far off screen, got {scrolled_away}"

    page.locator("#logo-area").click()
    page.wait_for_timeout(1200)

    back = page.evaluate(TODAY_HEADER_TOP)
    assert 0 <= back < 400, f"today did not come back into view (top={back})"


def test_it_returns_from_another_day_too(page, local_server):
    """The case where the route genuinely changes — the home redirect resolves to TODAY, not to
    whatever day was last looked at."""
    page.goto(local_server + "sessions/2026-08-21")
    page.wait_for_selector("#view-clients.active")

    page.locator("#logo-area").click()
    page.wait_for_url("**/sessions/2026-08-19", timeout=5000)
