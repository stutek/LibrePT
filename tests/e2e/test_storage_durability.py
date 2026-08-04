# tests/e2e/test_storage_durability.py
# Storage durability reporting (TODO §18.6, §18.8). The pure model (fake storage APIs) is covered
# by tests/unit_js/data/storageDurability.test.mjs; this file keeps only the one check that needs
# a REAL browser Storage API rather than an injected double.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_the_real_browser_reports_a_usable_quota(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/storageDurability.js', document.baseURI).href;
            const m = await import(url);
            return await m.assessDurability();
        }"""
    )
    # Against the real Storage API rather than an injected double: a normal browsing context must
    # clear the workable-quota floor, so a "tiny-quota" verdict here would mean the check is wrong.
    assert r["reason"] != "no-storage-api"
    assert r["quota"] is not None
    assert r["reason"] != "tiny-quota"
