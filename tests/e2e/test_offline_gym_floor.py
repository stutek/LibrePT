# tests/e2e/test_offline_gym_floor.py
# The app opens, and keeps what the trainer logs, with no network at all.
#
# A basement gym has no signal. What makes a cold start possible there is the service worker: its
# precache (src/sw/precache.js) and its fetch handler (src/sw/runtimeFetch.js). No other test takes
# the browser offline — tests/medium/test_offline_cached_signal.py sets the offline STATE by hand,
# because a component stub cannot load its own modules without a server. This file cuts the network
# for real, after one online visit has installed the worker: the order a trainer's phone sees it.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


# The session running now in the demo seed: its deck has exercises still to do.
LIVE_SESSION = ".session-card.session-live, .session-card:has-text('Group Strength & Conditioning')"


def _install_then_go_offline(page, local_server):
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")
    page.context.set_offline(True)


def _notes_on_review(page):
    """The note on every card of the review screen: a card shows the client, the tag, the exercise
    and what the trainer typed with it."""
    cards = page.locator("#dashboard-adjustments-list .adjustment-card")
    cards.first.wait_for()
    return [cards.nth(i).inner_text() for i in range(cards.count())]


def test_the_app_opens_with_no_network(page, local_server):
    _install_then_go_offline(page, local_server)
    page.reload()
    page.wait_for_selector(".session-card")
    assert page.locator("#integrity-error-overlay").is_hidden()
    # The trainer is told the app is running from what the phone kept.
    page.wait_for_selector("#sync-badge:not(.hidden)")


def test_a_deep_link_opens_with_no_network(page, local_server):
    """A bookmarked screen is an address the server never sees offline: the worker has to answer
    it with the app, not with the browser's own no-connection page."""
    _install_then_go_offline(page, local_server)
    page.goto(local_server + "adjustments")
    page.wait_for_selector("#view-adjustments.active")


def test_a_note_logged_offline_is_still_there_after_a_restart(page, local_server):
    _install_then_go_offline(page, local_server)
    page.reload()
    page.locator(LIVE_SESSION).first.click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.wait_for_timeout(400)
    page.locator(".exercise-deck-card").first.click(force=True)
    page.wait_for_timeout(300)
    page.locator("#btn-log-feedback").click()
    page.wait_for_selector("#dialog-feedback[open]")
    page.locator(
        '#form-feedback input[name="feedback-tag"][value="Joint Pain / Discomfort"]'
    ).check()
    page.locator("#feedback-custom-note").fill("no signal down here")
    page.locator("#form-feedback button[type=submit]").click()
    page.wait_for_selector("#dialog-feedback", state="hidden")
    # Saving is write-behind (src/data/writeQueue.js): the note is on the phone once the queued
    # write has landed, and not before.
    page.evaluate(
        "async () => (await import(new URL('data/writeQueue.js', document.baseURI).href)).flushWrites()"
    )

    page.goto(local_server + "adjustments")
    page.reload()
    page.wait_for_selector("#view-adjustments.active")
    assert any("no signal down here" in note for note in _notes_on_review(page)), (
        "the note typed offline did not survive the restart"
    )


def test_a_static_page_opens_while_the_worker_controls_the_app(page, local_server):
    """The PREVIEW badge and the privacy links open real .html pages. The worker answers a
    navigation with the app, so these pages must be let through, not shown as 'not found'."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")
    page.reload()  # from here on the worker controls the page
    for name in ("preview.html", "privacy.html", "consent-form-sl.html"):
        page.goto(local_server + name)
        assert page.locator("#view-not-found.active, .not-found").count() == 0, name
        assert page.locator("main, article, h1").first.is_visible(), name
        assert page.locator("#session-list, .session-card").count() == 0, name


def test_a_static_page_opens_with_no_network(page, local_server):
    _install_then_go_offline(page, local_server)
    page.goto(local_server + "preview.html")
    assert page.locator("#session-list, .session-card").count() == 0
    assert "Preview" in page.title()
