# tests/medium/test_offline_cached_signal.py
# The offline-cached signal: when the app is running off its cached shell rather than a reachable
# server, the header's sync badge says so. The header comes from tests/medium/_harness.py's
# HEADER_STUB. (The dialog's "Sync Data" button this also covered was removed on 2026-09-29: it
# connected to no calendar and replaced the trainer's sessions with the sample ones.)
#
# The offline state is set through applicationHeader's own setOfflineCachedState() rather than by
# taking the browser offline: the signal under test is the app's rendering of that state, and
# genuinely severing the connection would also stop the page loading its own modules.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

# The stub's `t` reads `state.lang`, which is module-private; this lets a test choose the language
# the badge is written in.
STUB = HEADER_STUB + "\nwindow.__setUiLang = (lang) => { state.lang = lang; };\n"


def test_offline_cached_signal(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    page.evaluate("""() => {
        return import('./modules/common/applicationHeader.js').then((mod) => {
            mod.setOfflineCachedState(true);
        });
    }""")
    page.wait_for_timeout(300)

    # The header badge surfaces the offline state.
    badge = page.locator("#sync-badge")
    assert badge.is_visible()
    assert "Offline" in badge.inner_text()


def test_the_offline_badge_is_written_in_the_chosen_language(page, local_server):
    load_with_stub(page, local_server, STUB)
    page.wait_for_selector("#app-header")

    page.evaluate("""() => {
        window.__setUiLang('sl');
        return import('./modules/common/applicationHeader.js').then((mod) => {
            mod.setOfflineCachedState(true);
        });
    }""")
    page.wait_for_timeout(300)

    assert page.locator("#sync-badge .sync-offline").inner_text().strip() == (
        "Brez povezave"
    )
