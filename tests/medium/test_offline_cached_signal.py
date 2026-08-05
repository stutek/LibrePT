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

# #btn-sync-data's markup belongs to backupRestore.js (it lives in the Sync & Backup dialog), but
# its click handler is wired by sessionsView.js's setupCalendarSessions — the sessions dashboard
# wiring a button it does not own. That coupling is why this stub has to boot a sessions-module
# function to test a backup-dialog button; the import-layering gate cannot see it, since both sides
# are legal cross-feature imports. Recorded rather than fixed here: moving the handler to
# backupRestore.js is a src change, not a test migration.
STUB = (
    HEADER_STUB
    + """
import { setupCalendarSessions } from './modules/sessionList/sessionsView.js';
setupCalendarSessions({ state, t, saveToLocalStorage: noop, renderSessions: noop });
"""
)


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
