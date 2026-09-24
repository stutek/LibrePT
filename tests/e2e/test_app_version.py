# tests/e2e/test_app_version.py
# Choosing the app version (TODO §76): the ☰ menu offers the supported versions, a tap reloads the
# app under the chosen version's behaviours, and no choice changes the data the trainer holds.
# A real boot, because the promise includes the reload. Fixtures come from tests/conftest.py.

COUNTS = """async () => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = s.getState();
    return Object.fromEntries(
        Object.entries(state).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]),
    );
}"""


def _open_exercises(page, local_server):
    page.goto(local_server + "exercises")
    page.wait_for_selector("#view-exercises.active")


def _with_no_session_running(page, local_server):
    """The demo seed has a session in progress, and a running session refuses the switch. The trainer
    would finish it; here the stored session is removed and the app loaded again without it."""
    _open_exercises(page, local_server)
    page.evaluate("localStorage.removeItem('librept_active_session')")
    _open_exercises(page, local_server)
    running = page.evaluate(
        """async () => {
            const a = await import(new URL('controllers/activeSessionStore.js', document.baseURI).href);
            return a.getActiveSession() !== null;
        }"""
    )
    assert not running, "a session is still running, so the switch would be refused"


def _choose(page, version):
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#menu-app-version").click()
    page.wait_for_selector("#dialog-app-version[open]")
    with page.expect_navigation():
        page.locator(f'#dialog-app-version [data-version="{version}"]').click()
    page.wait_for_selector("#view-exercises.active")


def test_a_version_changes_what_the_app_offers_and_nothing_it_holds(page, local_server):
    _with_no_session_running(page, local_server)
    assert page.locator("#btn-import-library").count() == 1, (
        "the default version imports a library"
    )
    before = page.evaluate(COUNTS)

    _choose(page, "2026-09")
    assert page.locator("#btn-import-library").count() == 0, (
        "2026-09 does not import a library"
    )
    assert page.evaluate(COUNTS) == before, "choosing a version changed the data"

    _choose(page, "2026-10")
    assert page.locator("#btn-import-library").count() == 1
    assert page.evaluate(COUNTS) == before


def test_the_version_cannot_change_while_a_session_is_running(page, local_server):
    """A reload in front of a client is the one moment the switch must not happen (TODO §18.12)."""
    _open_exercises(page, local_server)
    result = page.evaluate(
        """async () => {
            const d = await import(new URL('modules/common/appVersionDialog.js', document.baseURI).href);
            window.__reloads = 0;
            d.initAppVersionDialog({
                t: (key) => key,
                isSessionRunning: () => true,
                reload: () => { window.__reloads += 1; },
            });
            d.openAppVersionDialog();
            const options = [...document.querySelectorAll('#dialog-app-version .app-version-option')];
            options.forEach((option) => option.click());
            return {
                refusalShown: !document.getElementById('app-version-refused').classList.contains('hidden'),
                allDisabled: options.length > 1 && options.every((option) => option.disabled),
                reloads: window.__reloads,
            };
        }"""
    )
    assert result == {"refusalShown": True, "allDisabled": True, "reloads": 0}
