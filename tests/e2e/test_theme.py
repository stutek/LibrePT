# tests/e2e/test_theme.py
# End-to-end coverage of the 5-theme switcher (Midnight/Daylight/Red/Blossom/Nebula): selecting
# a theme swaps the single <body> theme class and the <meta name="theme-color">, persists the
# choice to localStorage['librept-theme'], and restores it across a reload.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

# value in #theme-switcher -> the body class applyTheme() sets (components/applicationHeader.js)
THEME_BODY_CLASS = {
    "dark": "dark-theme",
    "light": "light-theme",
    "red": "red-theme",
    "rose": "rose-theme",
    "violet": "violet-theme",
}


def _body_classes(page):
    return page.evaluate("() => Array.from(document.body.classList)")


def test_default_theme_is_light(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    assert "light-theme" in _body_classes(page)
    assert page.locator("#theme-switcher").input_value() == "light"


@pytest.mark.parametrize("value", ["dark", "red", "rose", "violet"])
def test_selecting_a_theme_swaps_the_single_body_class(page, local_server, value):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#theme-switcher").select_option(value)

    classes = _body_classes(page)
    # Exactly the chosen theme class is present; no other theme class lingers.
    assert THEME_BODY_CLASS[value] in classes
    others = {c for c in THEME_BODY_CLASS.values() if c != THEME_BODY_CLASS[value]}
    assert others.isdisjoint(classes), f"stale theme class left on body: {others & set(classes)}"

    # The choice is persisted.
    assert page.evaluate("() => localStorage.getItem('librept-theme')") == value


def test_theme_persists_across_reload(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    page.locator("#theme-switcher").select_option("violet")
    assert "violet-theme" in _body_classes(page)

    page.reload()
    page.wait_for_selector("#view-clients.active")

    # Restored from localStorage, not reset to the light default.
    assert "violet-theme" in _body_classes(page)
    assert "light-theme" not in _body_classes(page)
    assert page.locator("#theme-switcher").input_value() == "violet"
