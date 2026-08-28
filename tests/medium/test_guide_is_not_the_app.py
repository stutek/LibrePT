# tests/medium/test_guide_is_not_the_app.py
# A tap on the guided demo is the trainer working the GUIDE, not dismissing what the guide is
# pointing at (reported 2026-08-22, three times in one day).
#
# Every "tap outside closes me" rule in this app means "outside the thing you are working on": the ☰
# menu, the session menu, the plan editor. The guide floats its panel and its story card over the
# app, so without this distinction the guide closes the very thing its next step is about — reported
# as "step 2 of 31 … this step didn't complete", because Show me had just closed the menu holding
# the item that step points at.
#
# Pinned here rather than in the demo's own e2e walk, which did NOT catch it: that walk taps Show me
# while the app happens to be in a state where the closure does no harm. The rule is about the tap,
# so the test is about the tap.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest
from playwright.sync_api import expect

from tests.medium._harness import (
    HEADER_STUB,
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

pytestmark = pytest.mark.clean_start

# A stand-in for the guide: the real overlay is mounted by the walkthrough, and what these tests are
# about is the id the app's own rules key on, not how the guide draws itself.
GUIDE_STUB = """
const guide = document.createElement('div');
guide.id = 'walkthrough-overlay';
guide.style.cssText = 'position:fixed;left:0;bottom:0;width:100%;height:60px;z-index:9999';
guide.innerHTML = '<button id="fake-show-me" style="width:100%;height:60px">Show me</button>';
document.body.appendChild(guide);
"""


def test_the_header_menu_survives_a_tap_on_the_guide(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB + GUIDE_STUB)
    page.click("#btn-app-menu")
    expect(page.locator("#menu-clients-register")).to_be_visible()

    page.click("#fake-show-me")

    # Still on screen: the next step of the demo is about to point at it.
    expect(page.locator("#menu-clients-register")).to_be_visible()


def test_the_header_menu_still_closes_on_a_tap_anywhere_else(page, local_server):
    """The carve-out is for the guide alone: an ordinary tap outside still dismisses the menu, or
    this would be a menu that traps the trainer."""
    load_with_stub(page, local_server, HEADER_STUB + GUIDE_STUB)
    page.click("#btn-app-menu")
    expect(page.locator("#menu-clients-register")).to_be_visible()

    page.mouse.click(10, 300)

    expect(page.locator("#menu-clients-register")).to_be_hidden()


def test_the_session_menu_survives_a_tap_on_the_guide(page, local_server):
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=[exercise_item("e1", "Back Squat")]),
            extra_body=GUIDE_STUB,
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    page.click("#btn-session-menu")
    expect(page.locator("#btn-edit-plan")).to_be_visible()

    page.click("#fake-show-me")

    expect(page.locator("#btn-edit-plan")).to_be_visible()
