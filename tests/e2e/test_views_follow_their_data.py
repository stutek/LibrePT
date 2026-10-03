# tests/e2e/test_views_follow_their_data.py
# A screen that shows some data is drawn again when an action changes that data, without a reload.
# Each test here is an action that changed the data and left a screen showing the old state: the
# notification drawer still said a signal was waiting after it was resolved, and a client's profile
# still showed the name and phone number after the client was erased.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright; the demo data is
# seeded by the conftest.

PENDING = (
    '#notification-list-container [data-notification-id="synthetic-pending-sessions"]'
)


def test_resolving_the_last_signal_empties_the_drawer_at_once(page, local_server):
    page.goto(local_server + "adjustments")
    page.wait_for_selector("#view-adjustments.active")
    assert page.locator(PENDING).count() == 1

    cards = page.locator("#dashboard-adjustments-list .adjustment-card")
    while cards.count() > 0:
        before = cards.count()
        cards.first.locator(".btn-resolve-alert").click()
        page.wait_for_function(
            "(n) => document.querySelectorAll('#dashboard-adjustments-list .adjustment-card').length < n",
            arg=before,
        )

    assert page.locator(PENDING).count() == 0, (
        "the drawer still says a signal is waiting"
    )


def test_an_erased_client_is_gone_from_the_profile_behind_the_receipt(
    page, local_server
):
    page.goto(local_server + "clients/c1a9f0e2")
    page.wait_for_selector("#view-client-detail.active")
    assert "Jane Doe" in page.locator("#detail-client-name").inner_text()

    page.locator("#btn-client-erase").click()
    page.locator("#client-erase-confirm").fill("ERASE")
    page.locator("#btn-erase-confirm").click()

    # The receipt stays open over the profile, and the profile behind it no longer names her.
    assert page.locator("#client-erase-receipt").is_visible()
    assert "Jane Doe" not in page.locator("#detail-client-name").inner_text()
    assert "Jane Doe" not in page.locator("#view-client-detail").inner_text()


def test_a_signal_logged_in_a_session_is_in_the_drawer_when_the_session_ends(
    page, local_server
):
    """Finishing a session turns its Too Hard signal into a waiting item. The drawer must show it
    at once, not say everything is reviewed until the page is reloaded."""
    from tests.conftest import answer_app_questions

    answer_app_questions(page)
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")
    # Start from an empty drawer, so that any waiting item is the one this session made.
    page.evaluate(
        """async () => {
          const store = await import(new URL('data/stateStore.js', document.baseURI).href);
          for (const note of store.getState().exerciseNotes || []) {
            if (note.review === 'pending') note.review = 'resolved';
          }
          store.saveToLocalStorage();
          const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
          await queue.flushWrites();
        }"""
    )
    page.reload()
    page.wait_for_selector("#view-clients.active")
    assert page.locator(PENDING).count() == 0

    page.locator('.session-card[data-session-id="s01f2e3d"]').click()
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-start-session")
    page.wait_for_selector("#dialog-session-start-time[open]")
    page.click("#btn-session-start-time-keep")
    page.wait_for_selector("#dialog-session-start-time[open]", state="detached")

    page.locator(".exercise-deck-card").first.click(force=True)
    page.locator(".deck-action-hard").first.click()
    page.locator("#btn-finish-session").click()
    page.wait_for_selector("#view-clients.active")
    page.wait_for_timeout(300)

    page.locator("#btn-toggle-notifications").click()
    assert page.locator(PENDING).count() == 1, (
        "the drawer does not list the signal the session just produced"
    )
