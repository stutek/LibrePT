# tests/e2e/test_crash_capture.py
# A thrown error becoming something a trainer can report (TODO §12.4).
#
# Before this, an exception died in a console a PT will never open, while docs/BUG_REPORTING.md asked
# them to retype the build stamp by hand. What the payload may contain is pinned without a browser
# (tests/unit_js/data/crashReport.test.mjs); what needs the whole app is that a REAL uncaught error
# reaches the offer at all — the wiring, which is the part that silently does nothing when it breaks.
#
# The other half of §12.4 is what must NOT happen: no modal, no stolen focus, nothing over a live
# session. A crash handler that interrupts a set mid-rep is worse than the bug it reports.

from playwright.sync_api import expect


def _boot(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#app-header", timeout=15_000)


def _throw_in_the_app(page, message="probe explosion"):
    """Throw the way a real bug does — from a scheduled task, not from an evaluate() the harness catches.

    A MICROTASK rather than a `setTimeout`, and that is not arbitrary: the suite freezes `Date.now`
    (tests/conftest.py), and Playwright's clock instrumentation swallows an exception thrown inside a
    timer callback — it never reaches `window.onerror` at all. A microtask throw is just as real a bug
    and survives the instrumentation, so this test keeps the deterministic clock instead of opting out
    of it.
    """
    page.evaluate(f"() => queueMicrotask(() => {{ throw new Error({message!r}); }})")
    page.wait_for_timeout(400)


def test_an_uncaught_error_becomes_something_the_trainer_can_report(page, local_server):
    _boot(page, local_server)

    _throw_in_the_app(page)

    feed = page.locator("#notification-area")
    expect(feed).to_contain_text("probe explosion")
    # A link the trainer chooses to follow. Never an automatic send: there is no server, and an issue
    # is public.
    links = page.eval_on_selector_all(
        "#notification-area a",
        "els => els.map((el) => el.href).filter((href) => href.includes('issues/new'))",
    )
    assert links, "the crash offers a prefilled issue link"
    assert "Crash%3A" in links[0] or "Crash:" in links[0]


def test_the_report_carries_the_build_stamp_nobody_should_retype(page, local_server):
    """The one thing BUG_REPORTING.md asks a trainer to copy by hand, filled in for them."""
    _boot(page, local_server)

    _throw_in_the_app(page)

    href = page.eval_on_selector_all(
        "#notification-area a",
        "els => els.map((el) => el.href).find((href) => href.includes('issues/new'))",
    )
    assert "Build" in href.replace("%3A", ":").replace("+", " ")


def test_a_crash_never_steals_the_screen(page, local_server):
    """§12.4's own warning: a handler that renders a modal over a live session mid-set is worse than the
    original bug. The feed waits to be looked at; nothing opens on its own."""
    _boot(page, local_server)

    _throw_in_the_app(page)

    assert page.locator("dialog[open]").count() == 0
    # And the app is still usable rather than sitting behind something.
    assert page.locator("#backup-btn").is_enabled()


def test_the_same_crash_repeating_stays_one_entry(page, local_server):
    """A render loop throwing every frame must not evict every other report — including the one that
    explains how it started."""
    _boot(page, local_server)

    for _ in range(4):
        _throw_in_the_app(page, "repeating boom")

    feed_text = page.locator("#notification-area").inner_text()
    assert feed_text.count("repeating boom") == 1
    assert "4" in feed_text, "and it says how often it happened"
