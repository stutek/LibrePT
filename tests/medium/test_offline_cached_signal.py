# tests/medium/test_offline_cached_signal.py
# The offline-cached signal: when the app is running off its cached shell rather than a reachable
# server, the header's sync badge says so, and a Sync Data attempt reports the server as
# unreachable instead of failing silently. Both surfaces (header badge, Sync & Backup dialog) come
# from tests/medium/_harness.py's HEADER_STUB.
#
# The offline state is set through applicationHeader's own setOfflineCachedState() rather than by
# taking the browser offline: the signal under test is the app's rendering of that state, and
# genuinely severing the connection would also stop the page loading its own modules.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

from tests.medium._harness import HEADER_STUB, load_with_stub

pytestmark = pytest.mark.clean_start

# #btn-sync-data needs no extra boot step: its handler now lives in backupRestore.js, the module that
# owns its markup. Until 2026-08-05 (TODO §22) it was wired by sessionsView.js's
# setupCalendarSessions, so this stub had to boot a sessions-module function to exercise a
# backup-dialog button — the import-layering gate could not see that, both sides being legal
# cross-feature imports and the problem being ownership rather than direction.
STUB = HEADER_STUB


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

    # Sync Data, attempted while offline, must report the server as unreachable.
    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")

    page.locator("#btn-sync-data").click()
    page.wait_for_timeout(300)

    status = page.locator("#sync-status")
    assert status.is_visible()
    assert (
        "unreachable" in status.inner_text().lower()
        or "cached" in status.inner_text().lower()
    )
