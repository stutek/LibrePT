# tests/e2e/test_notification_footer.py
# The omnipresent notification/status footer (#notification-area, components/notificationArea.js):
# collapsed, it peeks up just enough for one line of text (the summary title row — the second-line
# description used to push this to 92px); expanded, it covers the whole area below the app header
# rather than stopping short partway up the screen.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_collapsed_footer_is_a_single_line(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    assert not page.locator("#notification-summary-desc").is_visible()

    viewport_height = page.viewport_size["height"]
    box = page.locator("#notification-area").bounding_box()
    peek_height = viewport_height - box["y"]
    # A single text line + padding comfortably fits under 70px; the old two-line peek was 92px.
    assert peek_height < 70, (
        f"collapsed footer is {peek_height}px tall, expected a single line"
    )


def test_expanded_footer_covers_the_whole_area_below_the_header(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#notification-grabber-btn").click()
    page.wait_for_timeout(400)

    hdr_height = page.evaluate(
        "parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-height'))"
    )
    box = page.locator("#notification-area").bounding_box()
    viewport_height = page.viewport_size["height"]

    # Starts right below the header (no gap) and reaches the bottom of the viewport.
    assert abs(box["y"] - hdr_height) < 2
    assert abs((box["y"] + box["height"]) - viewport_height) < 2
