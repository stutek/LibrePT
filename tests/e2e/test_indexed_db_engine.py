# tests/e2e/test_indexed_db_engine.py
# stateStore.js's move onto IndexedDB (TODO §18.6 part 4). test_indexed_db.py pins the low-level
# adapter in isolation; these tests pin the app's actual boot/save wiring on top of it: a legacy
# localStorage database is imported into IndexedDB exactly once and left untouched afterwards (the
# rollback snapshot for a build revert), a fresh install starts empty without error, and a write
# made after boot survives a reload by round-tripping through IndexedDB rather than localStorage.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

import pytest

from tests.conftest import current_schema_version


def test_legacy_localstorage_is_imported_and_left_as_a_rollback_snapshot(
    page, local_server
):
    """A pre-existing localStorage database (any build before this engine swap) must be imported
    into IndexedDB on first boot, and the localStorage bucket must never be written to again — it
    is the only way a build revert to an older, localStorage-only cached version keeps its data."""
    legacy = {
        "clients": [{"id": "c1", "name": "Legacy Client", "active": True}],
        "exercises": [],
        "routines": [],
        "history": [],
        "sessions": [],
        "planUpdates": [],
        "notifications": [],
    }
    page.add_init_script(
        "window.localStorage.setItem('librept_db', '%s');" % json.dumps(legacy)
    )
    page.goto(local_server)
    page.wait_for_timeout(600)

    r = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const state = store.getState();
            return {
                clients: state.clients.map((c) => c.name),
                legacyBlobStill: window.localStorage.getItem('librept_db'),
            };
        }"""
    )

    assert r["clients"] == ["Legacy Client"], (
        "the imported data must reach the live in-memory state"
    )
    assert r["legacyBlobStill"] is not None, (
        "the legacy bucket must survive the import untouched"
    )
    assert json.loads(r["legacyBlobStill"]) == legacy, (
        "the legacy bucket's bytes must be unchanged — it is the rollback snapshot"
    )

    count = page.evaluate(
        """async () => {
            const db = await new Promise((resolve, reject) => {
                const req = indexedDB.open('librept');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            const tx = db.transaction(['schemaP'], 'readonly');
            const c = await new Promise((resolve, reject) => {
                const req = tx.objectStore('schemaP').count();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            db.close();
            return c;
        }"""
    )
    assert count > 0, "the imported client should have been star-written into IndexedDB"


@pytest.mark.clean_start
def test_fresh_install_with_no_prior_data_starts_empty_without_error(
    page, local_server
):
    page.goto(local_server)
    page.wait_for_timeout(600)

    r = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const state = store.getState();
            return {
                clients: state.clients,
                schemaVersion: state.schemaVersion,
                legacyBlob: window.localStorage.getItem('librept_db'),
            };
        }"""
    )

    assert r["clients"] == []
    assert r["schemaVersion"] == current_schema_version()
    assert r["legacyBlob"] is None, (
        "a fresh install never creates a legacy localStorage bucket"
    )


def test_a_write_after_boot_persists_across_a_reload(page, local_server):
    """The write path (saveToLocalStorage) is write-behind onto IndexedDB now, not a synchronous
    localStorage write — a write must still be durable by the time the queue drains, and a reload
    must read it back from IndexedDB rather than losing it or re-running the (now no-op) import."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    added = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            const state = store.getState();
            state.clients.push({ id: 'new-client-1', name: 'Freshly Added', active: true });
            store.saveToLocalStorage();
            await queue.flushWrites();
            return state.clients.length;
        }"""
    )
    assert added > 0

    page.reload()
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    names = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            return store.getState().clients.map((c) => c.name);
        }"""
    )
    assert "Freshly Added" in names


def test_a_real_save_star_writes_into_every_live_schema_store_identically(
    page, local_server
):
    """The actual "star write" property, proven end to end through the app rather than the
    low-level adapter (test_indexed_db.py) or a single-store read (every other test in this file
    only ever inspects `schemaP`): a save through `stateStore.js`'s real write path must land the
    same record in EVERY live schema's IndexedDB store, not just the newest one this build reads
    back from. A regression that silently dropped `schema4` from the fan-out would go unnoticed by
    every other test here, since they never look at it."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
            store.getState().clients.push({ id: 'star-write-check', name: 'Star Written', active: true });
            store.saveToLocalStorage();
            await queue.flushWrites();
        }"""
    )

    stores = page.evaluate(
        """async () => {
            const db = await new Promise((resolve, reject) => {
                const req = indexedDB.open('librept');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            const names = [...db.objectStoreNames].filter((n) => n.startsWith('schema')).sort();
            const result = {};
            for (const name of names) {
                const tx = db.transaction([name], 'readonly');
                result[name] = await new Promise((resolve, reject) => {
                    const req = tx.objectStore(name).get('star-write-check');
                    req.onsuccess = () => resolve(req.result ?? null);
                    req.onerror = () => reject(req.error);
                });
            }
            db.close();
            return result;
        }"""
    )

    assert set(stores.keys()) == {"schema4", "schemaP"}, (
        "expected exactly the two live schema stores — update this test if a schema was added/retired"
    )
    for schema_name, record in stores.items():
        assert record is not None, (
            f"{schema_name} is missing the record — the fan-out dropped it"
        )
        assert record["name"] == "Star Written", (
            f"{schema_name} has a stale or wrong record"
        )
