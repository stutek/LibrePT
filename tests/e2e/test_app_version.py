# tests/e2e/test_app_version.py
# The app version a device runs. Since schemas 4 and 5 were retired (ruled 2026-10-02, Simon) the
# build offers one version, 2026-11, so the ☰ menu offers no choice, and a device that had chosen one
# of the retired versions runs 2026-11 without losing anything it holds. A real boot, because the
# promise is about what a device finds when the app starts. Fixtures come from tests/conftest.py.

COUNTS = """async () => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    const state = s.getState();
    return Object.fromEntries(
        Object.entries(state).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]),
    );
}"""

FLUSH = """async () => {
    const q = await import(new URL('data/writeQueue.js', document.baseURI).href);
    await q.flushWrites();
}"""


def _open_exercises(page, local_server):
    page.goto(local_server + "exercises")
    page.wait_for_selector("#view-exercises.active")


def test_with_one_version_the_menu_offers_no_choice(page, local_server):
    _open_exercises(page, local_server)
    page.locator("#btn-app-menu").click()
    page.wait_for_selector("#app-menu:not(.hidden)")
    page.locator("#menu-settings").click()
    assert page.locator("#menu-app-version").is_hidden(), (
        "a menu item that opens a choice of one is a dead end"
    )


def test_a_device_on_a_retired_version_runs_the_current_one_and_keeps_everything(
    page, local_server
):
    _open_exercises(page, local_server)
    page.evaluate(FLUSH)
    before = page.evaluate(COUNTS)

    page.evaluate("() => localStorage.setItem('librept_app_version', '2026-09')")
    _open_exercises(page, local_server)

    # 2026-09 had no library import; the version it falls back to has it.
    assert page.locator("#btn-import-library").is_visible()
    assert page.evaluate(COUNTS) == before, (
        "falling back to the current version lost data"
    )
