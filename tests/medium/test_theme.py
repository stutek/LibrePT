# tests/medium/test_theme.py
# End-to-end coverage of the 5-theme switcher (Midnight/Daylight/Spreadsheet/Blossom/Nebula): selecting
# a theme swaps the theme class on BOTH <html> and <body> plus the <meta name="theme-color">,
# persists the choice to localStorage['librept-theme'], and restores it across a reload. Mounted via
# appBoot.bootHeader() (see tests/medium/_harness.py's HEADER_STUB) — the theme switcher lives
# inside the ☰ header menu, wired by setupApplicationHeader()'s setupThemeSwitcher(). The initial
# theme class itself comes from src/theme-boot.js, a separate anti-FOUC script tag that runs
# regardless of app.js/our stub, so it's unaffected by the interception.
#
# Both elements are asserted because each theme stylesheet declares its tokens against `html.X,
# body.X`, and theme-boot.js can only reach <html>: when two divergent copies of applyTheme() were
# live (TODO §24.1), the switcher updated <body> only and left the root on the boot theme.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

# value in #theme-switcher -> the theme class applyTheme() sets (modules/common/theme.js)
THEME_BODY_CLASS = {
    "midnight": "midnight-theme",
    "daylight": "daylight-theme",
    "spreadsheet": "spreadsheet-theme",
    "blossom": "blossom-theme",
    "nebula": "nebula-theme",
}


def _body_classes(page):
    return page.evaluate("() => Array.from(document.body.classList)")


def _root_classes(page):
    return page.evaluate("() => Array.from(document.documentElement.classList)")


def test_default_theme_is_daylight(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    assert "daylight-theme" in _body_classes(page)
    assert "daylight-theme" in _root_classes(page)
    assert page.locator("#theme-switcher").input_value() == "daylight"


@pytest.mark.parametrize("value", ["midnight", "spreadsheet", "blossom", "nebula"])
def test_selecting_a_theme_swaps_the_single_body_class(page, local_server, value):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#theme-switcher").select_option(value)

    others = {c for c in THEME_BODY_CLASS.values() if c != THEME_BODY_CLASS[value]}
    # Exactly the chosen theme class is present on each element; no other theme class lingers.
    for element, classes in (
        ("body", _body_classes(page)),
        ("html", _root_classes(page)),
    ):
        assert THEME_BODY_CLASS[value] in classes, (
            f"{element} missing the chosen theme class"
        )
        assert others.isdisjoint(classes), (
            f"stale theme class left on {element}: {others & set(classes)}"
        )

    # The choice is persisted.
    assert page.evaluate("() => localStorage.getItem('librept-theme')") == value


@pytest.mark.parametrize("how", ["saved", "link"])
def test_the_retired_red_theme_opens_as_spreadsheet(page, local_server, how):
    """Red was replaced by Spreadsheet on 2026-09-13 (TODO §49.2). A trainer who had chosen Red, or
    opens an old link naming it, lands on its replacement, not silently on the default."""
    if how == "saved":
        page.add_init_script("localStorage.setItem('librept-theme', 'red')")
        load_with_stub(page, local_server, HEADER_STUB)
    else:
        load_with_stub(page, local_server + "?theme=red", HEADER_STUB)
    page.wait_for_selector("#app-header")

    assert "spreadsheet-theme" in _body_classes(page)
    assert "spreadsheet-theme" in _root_classes(page)
    assert page.locator("#theme-switcher").input_value() == "spreadsheet"


def test_theme_persists_across_reload(page, local_server):
    load_with_stub(page, local_server, HEADER_STUB)
    page.wait_for_selector("#app-header")

    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#theme-switcher").select_option("nebula")
    assert "nebula-theme" in _body_classes(page)

    page.reload()
    page.wait_for_selector("#app-header")

    # Restored from localStorage, not reset to the light default.
    assert "nebula-theme" in _body_classes(page)
    assert "nebula-theme" in _root_classes(page)
    assert "daylight-theme" not in _body_classes(page)
    assert "daylight-theme" not in _root_classes(page)
    assert page.locator("#theme-switcher").input_value() == "nebula"
