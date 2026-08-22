# tests/medium/test_feedback_route.py
# The way out of the app for a trainer with something to say (TODO §23.5).
#
# The addresses and the message bodies are pinned without a browser in
# tests/unit_js/data/feedbackRoute.test.mjs. What needs the DOM is the promise the dialog makes:
# reaching someone takes no account, a bug is pointed at the place a bug belongs, and what the app
# is about to send is on screen before either link is opened — sending something about a person's
# own app without showing them what it contains would be the opposite of what this app is for.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start


def _open(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.click("#btn-app-menu")
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.click("#menu-feedback")
    page.wait_for_selector("#dialog-feedback-route[open]")


def test_a_trainer_with_no_github_account_can_still_reach_someone(page, local_server):
    _open(page, local_server)

    mail = page.locator("#feedback-route-mail")
    expect(mail).to_be_visible()
    assert mail.get_attribute("href").startswith("mailto:LibrePT.adm@gmail.com")


def test_a_bug_is_pointed_at_where_a_bug_belongs_with_a_screenshot(page, local_server):
    """An email thread about a bug has no version, no page and no way for the next person who hits
    it to find it. The screenshot is asked for in words because the app cannot take it."""
    _open(page, local_server)

    issue = page.locator("#feedback-route-issue")
    expect(issue).to_be_visible()
    assert "/issues/new" in issue.get_attribute("href")
    expect(page.locator("#feedback-route-bug-lede")).to_contain_text("screenshot")


def test_what_would_be_sent_is_on_screen_first(page, local_server):
    _open(page, local_server)

    shown = page.locator("#feedback-route-diagnostics").inner_text()
    assert "Build:" in shown
    assert "Page:" in shown
    # Four lines, and not one of them is about a client.
    assert len(shown.strip().split("\n")) == 4
    assert "client" not in shown.lower()
