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
        cards.first.locator(".btn-resolve-alert").click()
        page.wait_for_selector("#dialog-apply-adjustment", state="visible")
        page.locator("#adjust-action-type").select_option("dismiss")
        page.locator("#dialog-apply-adjustment button[type='submit']").click()
        page.wait_for_selector("#dialog-apply-adjustment", state="hidden")

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
