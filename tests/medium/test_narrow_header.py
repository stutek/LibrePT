# tests/medium/test_narrow_header.py
# The app header and the clipboard's title bar on the narrowest phone the app supports (320 px).
#
# Found by exploratory testing: at 320 px the app name was cut to "Libr…", the backup warning covered
# the logo and pushed the menu button off the screen, and the clipboard's session name was left 18 px
# wide next to the "Today" button and the countdown. Measured from the DOM, in Slovenian, whose words
# are the longest of the three languages.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import (
    HEADER_STUB,
    active_session_fixture,
    clipboard_stub,
    exercise_item,
    load_with_stub,
)

pytestmark = pytest.mark.clean_start

NARROW = {"width": 320, "height": 680}

STUB = (
    HEADER_STUB
    + """
import { renderBackupBadge } from './modules/common/applicationHeader.js';
window.showBackupHealth = (health) => renderBackupBadge(health);
"""
)


def _header(page, local_server, level):
    page.set_viewport_size(NARROW)
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")
    page.evaluate(
        """async (level) => {
          const { TRANSLATIONS } = await import(new URL('i18n/index.js', document.baseURI).href);
          window.showBackupHealth({ level, unbackedCount: 25 });
          const label = document.querySelector('#unbacked-badge .unbacked-badge-label');
          if (label) label.textContent = TRANSLATIONS.sl[level === 'urgent' ? 'unbacked_urgent' : 'unbacked_due'];
          document.getElementById('preview-badge')?.classList.remove('hidden');
        }""",
        level,
    )
    page.wait_for_timeout(200)


@pytest.mark.parametrize("level", ["none", "due", "urgent"])
def test_the_app_name_and_the_menu_button_fit_at_320(page, local_server, level):
    _header(page, local_server, level)
    name = page.evaluate(
        """() => {
          const h1 = document.querySelector('.logo-area h1');
          const menu = document.getElementById('btn-app-menu');
          return {
            cut: h1.scrollWidth > h1.clientWidth,
            menuRight: menu.getBoundingClientRect().right,
            pageWidth: document.documentElement.scrollWidth,
          };
        }"""
    )
    assert not name["cut"], "the app name is cut with an ellipsis"
    assert name["menuRight"] <= NARROW["width"], f"menu button leaves the screen: {name}"
    assert name["pageWidth"] <= NARROW["width"], f"the page scrolls sideways: {name}"


def test_the_backup_warning_does_not_cover_the_logo(page, local_server):
    _header(page, local_server, "urgent")
    boxes = page.evaluate(
        """() => {
          const r = (s) => document.querySelector(s).getBoundingClientRect().toJSON();
          return { badge: r('#unbacked-badge'), logo: r('.logo-icon') };
        }"""
    )
    badge, logo = boxes["badge"], boxes["logo"]
    overlap = badge["left"] < logo["right"] and badge["right"] > logo["left"]
    assert not overlap, f"the warning sits on the logo: {boxes}"


def test_the_clipboard_title_keeps_its_name_beside_today_and_the_countdown(
    page, local_server
):
    page.set_viewport_size(NARROW)
    load_with_stub(
        page,
        local_server,
        clipboard_stub(
            active_session_fixture(exercises=[exercise_item("e1", "Back Squat")])
        ),
    )
    page.wait_for_selector("#active-session-overlay:not(.hidden)")
    measured = page.evaluate(
        """() => {
          document.getElementById('btn-plan-today').classList.remove('hidden');
          document.getElementById('overlay-session-timer').classList.remove('hidden');
          document.getElementById('btn-start-session').classList.add('hidden');
          document.getElementById('overlay-session-duration').textContent = '04h 31m';
          const title = document.getElementById('session-title-text');
          title.innerHTML = '<span class="clipboard-title"><span class="clipboard-title-line">'
            + '<span class="clipboard-title-name">Nova ura</span></span>'
            + '<span class="clipboard-title-when">Danes · 09:00 - 10:00 · Park</span></span>';
          const name = document.querySelector('.clipboard-title-name');
          const when = document.querySelector('.clipboard-title-when');
          return {
            name: name.clientWidth, nameNeeds: name.scrollWidth,
            whenNeeds: when.scrollWidth, when: when.clientWidth,
            caption: document.querySelector('.session-timer-caption').textContent,
          };
        }"""
    )
    assert measured["name"] >= measured["nameNeeds"], f"session name is cut: {measured}"
    assert measured["when"] >= 80, f"the day and time line has no room: {measured}"
