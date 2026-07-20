# tests/e2e/test_share_deeplink.py
# End-to-end coverage of promo/share deep-links: a URL may carry ?lang=, ?theme= and/or ?init= to
# open the demo with a preselected UI language, colour theme, and (opt-in) demo dataset
# (src/helper/shareLink.js, consumed in app.js init() for lang + init, and
# components/applicationHeader.js setupThemeSwitcher for theme).
#
# Rules under test:
#   * an unknown/since-renamed theme reverts to the default (daylight); an unknown language falls
#     through to the default (en) — old links must never break the UI.
#   * the app boots to a clean, empty slate; ?init=demo_data_load populates the demo dataset, but
#     ONLY when the app is genuinely empty — it is ignored when any data is already present.
#
# The whole module is marked `clean_start` so the conftest demo-seed injection stays out of the
# way and each test controls the ?init= param itself.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

pytestmark = pytest.mark.clean_start


def _body_classes(page):
    return page.evaluate("() => Array.from(document.body.classList)")


def _db(page):
    return page.evaluate(
        "() => { const d = localStorage.getItem('librept_db'); return d ? JSON.parse(d) : null; }"
    )


# --- language + theme preselection ---------------------------------------------------------------


def test_lang_param_preselects_language(page, local_server):
    page.goto(local_server + "?lang=sl")
    page.wait_for_selector("#view-clients.active")

    # The applied language is reflected in the switcher (source of truth is in-memory state).
    assert page.locator("#lang-switcher").input_value() == "sl"


def test_theme_param_preselects_theme(page, local_server):
    page.goto(local_server + "?theme=nebula")
    page.wait_for_selector("#view-clients.active")

    assert "nebula-theme" in _body_classes(page)
    assert "daylight-theme" not in _body_classes(page)
    assert page.locator("#theme-switcher").input_value() == "nebula"


def test_lang_and_theme_params_combine(page, local_server):
    page.goto(local_server + "?lang=sl&theme=red")
    page.wait_for_selector("#view-clients.active")

    assert page.locator("#lang-switcher").input_value() == "sl"
    assert "red-theme" in _body_classes(page)
    assert page.locator("#theme-switcher").input_value() == "red"


def test_unknown_theme_reverts_to_default(page, local_server):
    # A theme that no longer exists (e.g. renamed) must fall back to the default, not blank out.
    page.goto(local_server + "?theme=aurora")
    page.wait_for_selector("#view-clients.active")

    assert "daylight-theme" in _body_classes(page)
    assert page.locator("#theme-switcher").input_value() == "daylight"
    # And nothing invalid is persisted.
    assert page.evaluate("() => localStorage.getItem('librept-theme')") == "daylight"


def test_legacy_theme_alias_resolves(page, local_server):
    # Legacy alias names still resolve to their current theme (violet -> nebula).
    page.goto(local_server + "?theme=violet")
    page.wait_for_selector("#view-clients.active")

    assert "nebula-theme" in _body_classes(page)
    assert page.locator("#theme-switcher").input_value() == "nebula"


def test_unknown_lang_falls_back_to_default(page, local_server):
    page.goto(local_server + "?lang=xx")
    page.wait_for_selector("#view-clients.active")

    # Unknown code is ignored; the app stays on its default language.
    assert page.locator("#lang-switcher").input_value() == "en"


# --- clean boot + demo-data initializer ----------------------------------------------------------


def test_fresh_start_is_empty_without_init(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # No demo data is autoloaded on a plain visit.
    assert page.locator("#clients-list .client-card").count() == 0
    db = _db(page)
    assert db is None or (
        len(db.get("clients", [])) == 0 and len(db.get("bookings", [])) == 0
    )
    # No stale/demo active session either.
    assert page.evaluate("() => localStorage.getItem('librept_active_session')") is None


def test_init_param_loads_demo_data(page, local_server):
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    assert page.locator("#clients-list .client-card").count() > 0
    db = _db(page)
    assert db is not None
    assert len(db["clients"]) > 0
    assert len(db["bookings"]) > 0
    # The message feed is seeded together with the demo data (data-driven notifications),
    # including the demo-mode clean-up notice.
    assert len(db["notifications"]) > 0
    assert any(n["id"] == "demo-mode-notice" for n in db["notifications"])
    assert page.locator("#notification-list-container .notification-card.demo-mode").count() == 1


def test_clean_start_has_no_notifications(page, local_server):
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # Notifications are data-driven and seeded with the demo data, so a clean install has none.
    assert page.locator("#notification-list-container .notification-card").count() == 0
    assert page.locator("#notification-list-container .notification-empty").count() == 1


def test_init_ignored_when_data_already_present(page, local_server):
    # Pre-seed a real (non-demo) db so the app already holds data before the init link is opened.
    page.add_init_script(
        "window.localStorage.setItem('librept_db', JSON.stringify({"
        "clients:[{id:'c-custom',name:'Custom Person'}],"
        "exercises:[],routines:[],history:[],planUpdates:[],bookings:[],lang:'en'}));"
    )
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    # The pre-existing data is untouched; the demo dataset was NOT loaded over it.
    db = _db(page)
    assert [c["name"] for c in db["clients"]] == ["Custom Person"]
    assert page.locator("#clients-list .client-card").count() == 1


def test_init_seeds_only_once_then_edits_persist(page, local_server):
    # First visit with the init link seeds the demo dataset.
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")
    seeded_count = page.locator("#clients-list .client-card").count()
    assert seeded_count > 0

    # Simulate a user edit: wipe the clients collection but keep other demo data present.
    page.evaluate(
        "() => { const db = JSON.parse(localStorage.getItem('librept_db'));"
        " db.clients = []; localStorage.setItem('librept_db', JSON.stringify(db)); }"
    )

    # Re-opening the init link must NOT re-seed — data is already present, so it is ignored.
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")
    assert page.locator("#clients-list .client-card").count() == 0
