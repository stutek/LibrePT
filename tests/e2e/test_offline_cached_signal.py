# tests/e2e/test_offline_cached_signal.py
# Tests signaling offline cached code operation when HTTP server is unreachable.


def test_offline_cached_signal(page, local_server):
    """
    Verifies that the app displays an offline badge and appropriate status message
    when operating offline / off cached code.
    """
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    # Set offline cached mode via JS helper function exposed on applicationHeader
    page.evaluate("""() => {
        import('./modules/common/applicationHeader.js').then(mod => {
            mod.setOfflineCachedState(true);
        });
    }""")
    page.wait_for_timeout(500)

    # Verify the sync badge in the header displays offline status
    badge = page.locator("#sync-badge")
    assert badge.is_visible()
    assert "Offline" in badge.inner_text()

    # Open Sync & Backup Center modal and test Sync Data action while offline
    page.locator("#backup-btn").click()
    page.wait_for_selector("#dialog-backup[open]")

    page.locator("#btn-sync-data").click()
    page.wait_for_timeout(300)

    # Status message must indicate HTTP server is unreachable / operating off cached code
    status = page.locator("#sync-status")
    assert status.is_visible()
    assert (
        "unreachable" in status.inner_text().lower()
        or "cached" in status.inner_text().lower()
    )
