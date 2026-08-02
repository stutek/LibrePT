# tests/e2e/test_drive_sync_interval.py
# The configurable periodic-pull interval (src/data/driveSyncService.js): default, clamping to
# [MIN_SYNC_INTERVAL_MINUTES, MAX_SYNC_INTERVAL_MINUTES], and that a stored value round-trips. Pure
# read/write over localStorage, no network or auth involved, so this is tested directly against the
# module rather than through the UI. Run in-browser like every other pure-module test in this suite
# (see test_record_id.py for why: the app's CSP forbids `new Function`, so there is no eval-based test
# harness available).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE_SCRIPT = """
async () => {{
    const url = new URL('data/driveSyncService.js', document.baseURI).href;
    const m = await import(url);
    {body}
}}
"""


def _run(page, local_server, body):
    page.goto(local_server)
    page.wait_for_timeout(300)
    return page.evaluate(MODULE_SCRIPT.format(body=body))


def test_default_interval_is_five_minutes(page, local_server):
    r = _run(
        page,
        local_server,
        "return { current: m.getSyncIntervalMinutes(), constant: m.DEFAULT_SYNC_INTERVAL_MINUTES };",
    )
    assert r == {"current": 5, "constant": 5}


def test_bounds_are_one_to_sixty(page, local_server):
    r = _run(
        page,
        local_server,
        "return { min: m.MIN_SYNC_INTERVAL_MINUTES, max: m.MAX_SYNC_INTERVAL_MINUTES };",
    )
    assert r == {"min": 1, "max": 60}


def test_a_valid_value_round_trips(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const set = m.setSyncIntervalMinutes(17);
        const read = m.getSyncIntervalMinutes();
        return { set, read };
        """,
    )
    assert r == {"set": 17, "read": 17}


def test_out_of_range_values_are_clamped(page, local_server):
    r = _run(
        page,
        local_server,
        """
        return {
            tooLow: m.setSyncIntervalMinutes(0),
            tooHigh: m.setSyncIntervalMinutes(999),
            negative: m.setSyncIntervalMinutes(-5),
        };
        """,
    )
    assert r == {"tooLow": 1, "tooHigh": 60, "negative": 1}


def test_garbage_input_falls_back_to_the_default(page, local_server):
    r = _run(
        page,
        local_server,
        """
        return {
            notANumber: m.setSyncIntervalMinutes('abc'),
            nothing: m.setSyncIntervalMinutes(undefined),
        };
        """,
    )
    assert r == {"notANumber": 5, "nothing": 5}


def test_fractional_values_round_to_the_nearest_minute(page, local_server):
    r = _run(page, local_server, "return m.setSyncIntervalMinutes(4.6);")
    assert r == 5
