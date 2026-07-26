# tests/e2e/test_storage_durability.py
# Storage durability reporting (TODO §18.6, §18.8). LibrePT is local-first, so an eviction is not a
# cache miss — it is a business losing its records. These tests pin that the app asks for persistence
# on every boot, and that it reports risk by measuring the CONSEQUENCE (can this device still hold the
# data tomorrow?) rather than by sniffing for private browsing, which browsers actively break and
# which misses the cases that matter — a nearly full device, or an uninstalled Safari tab.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_persistence_is_requested_and_a_prior_grant_short_circuits(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/storageDurability.js', document.baseURI).href;
            const m = await import(url);
            let persistCalls = 0;
            const granted = await m.requestPersistentStorage({
                storage: {
                    persisted: async () => true,
                    persist: async () => { persistCalls += 1; return true; },
                },
            });
            const asked = await m.requestPersistentStorage({
                storage: {
                    persisted: async () => false,
                    persist: async () => { persistCalls += 1; return true; },
                },
            });
            const refused = await m.requestPersistentStorage({
                storage: { persisted: async () => false, persist: async () => false },
            });
            const unsupported = await m.requestPersistentStorage({ storage: {} });
            return { granted, asked, refused, unsupported, persistCalls };
        }"""
    )
    # An origin already exempt from eviction must not re-prompt.
    assert r["granted"] == {
        "supported": True,
        "persisted": True,
        "alreadyGranted": True,
    }
    assert r["asked"]["persisted"] is True
    # A refusal is the normal case until the app is installed — it must resolve, not throw.
    assert r["refused"] == {"supported": True, "persisted": False}
    assert r["unsupported"] == {"supported": False, "persisted": False}
    assert r["persistCalls"] == 1


def test_a_throwing_storage_api_is_treated_as_a_refusal(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/storageDurability.js', document.baseURI).href;
            const m = await import(url);
            return await m.requestPersistentStorage({
                storage: {
                    persisted: async () => { throw new Error('private mode'); },
                    persist: async () => { throw new Error('private mode'); },
                },
            });
        }"""
    )
    # Some private modes throw rather than returning false; that is the same answer.
    assert r == {"supported": True, "persisted": False}


def test_durability_reports_the_consequence_that_tripped_it(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/storageDurability.js', document.baseURI).href;
            const m = await import(url);
            const GB = 1024 * 1024 * 1024;
            const assess = (estimate, persisted) => m.assessDurability({
                storage: { estimate: async () => estimate, persisted: async () => persisted },
            });
            return {
                healthy: await assess({ quota: 2 * GB, usage: 1e6 }, true),
                tiny: await assess({ quota: 5 * 1024 * 1024, usage: 0 }, true),
                notPersisted: await assess({ quota: 2 * GB, usage: 1e6 }, false),
                noApi: await m.assessDurability({ storage: {} }),
                minimum: m.MINIMUM_WORKABLE_QUOTA_BYTES,
            };
        }"""
    )
    assert r["healthy"]["atRisk"] is False
    assert r["healthy"]["durable"] is True
    assert r["healthy"]["reason"] is None

    # A persisted origin with no room to grow is still a device that will start failing writes, so
    # quota is checked BEFORE persistence — saying "your storage is protected" there would be a lie.
    assert r["tiny"]["atRisk"] is True
    assert r["tiny"]["reason"] == "tiny-quota"
    assert r["tiny"]["durable"] is True

    # Works today, but the browser is free to reclaim it — the Safari seven-day case.
    assert r["notPersisted"]["atRisk"] is True
    assert r["notPersisted"]["reason"] == "not-persisted"

    assert r["noApi"]["atRisk"] is True
    assert r["noApi"]["reason"] == "no-storage-api"
    # A very busy PT reaches ~16.6 MiB/yr in one bucket (§18.6), so the floor must clear that with
    # room for the star write's multiple.
    assert r["minimum"] == 50 * 1024 * 1024


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
