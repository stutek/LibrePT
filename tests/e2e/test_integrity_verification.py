# tests/e2e/test_integrity_verification.py
# The service worker verifies every precached asset against a SHA-256 integrity catalog and refuses to
# install a build it can't verify — surfacing a blocking error page instead of silently skipping
# (README "Architectural Invariants"). In local dev the dev server computes the catalog live from src/,
# so this path runs for real here (not only in production). The failure path is driven by a test-only
# `corrupt_integrity` cookie the dev server honours by flipping one hash.


def test_service_worker_installs_and_verifies_clean(page, local_server):
    """Happy path: the verified atomic precache succeeds, so a worker activates and no error page shows.
    navigator.serviceWorker.ready resolves ONLY once a worker has activated — i.e. install (which now
    hashes every shell asset against the live catalog) passed."""
    page.goto(local_server)
    page.evaluate("() => navigator.serviceWorker.ready.then(() => true)")
    page.wait_for_timeout(200)
    assert page.eval_on_selector(
        "#integrity-error-overlay", "el => el.classList.contains('hidden')"
    ), "a clean, verified build must not show the integrity error page"


def test_corrupt_build_shows_integrity_error_page(browser, local_server):
    """Failure path: a tampered catalog (one wrong hash) fails verification, aborts the atomic install,
    and the SW messages the page to show the blocking error overlay naming the offending file."""
    context = browser.new_context()
    context.add_cookies(
        [{"name": "corrupt_integrity", "value": "1", "url": local_server}]
    )
    page = context.new_page()
    page.goto(local_server)

    page.wait_for_selector("#integrity-error-overlay:not(.hidden)", timeout=10000)
    assert "integrity check" in page.text_content("#integrity-error-message").lower()
    # The offending asset is named verbatim so a bug report can pinpoint it.
    assert "app.js" in page.text_content("#integrity-error-detail")
    context.close()
