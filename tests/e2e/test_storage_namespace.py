# tests/e2e/test_storage_namespace.py
# The app's plain localStorage keys (TODO §16.5/§16.3, both resolved). Multi-version hosting was
# dropped — no release tags, no per-release bucket suffix — and the schema axis that would have
# replaced it already lives in IndexedDB's per-schema object stores (TODO §18.6 part 4). Pure
# read/write/remove coverage for storageNamespace.js moved to
# tests/unit_js/data/storageNamespace.test.mjs. What stays here needs the real, live-booted app:
# proof that the seeded demo data actually lands in IndexedDB, not a versioned localStorage bucket.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_the_live_app_persists_to_indexeddb_not_a_versioned_localstorage_bucket(
    page, local_server
):
    """The read/write path moved onto IndexedDB (TODO §18.6 part 4): the seeded demo data lands in
    the `librept` IndexedDB database, and — since there are no release tags any more — never in a
    versioned `librept_db@...` localStorage bucket. `librept_db` itself is no longer written by
    ongoing saves; it only still exists as the one-time legacy import source
    (test_schema_migrations.py covers that path), not as this build's live store."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    keys = page.evaluate("() => Object.keys(window.localStorage)")
    assert not any(k.startswith("librept_db@") for k in keys), (
        "there are no release tags any more — nothing should ever suffix this key"
    )

    stores = page.evaluate(
        """async () => {
            const db = await new Promise((resolve, reject) => {
                const req = indexedDB.open('librept');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            const names = [...db.objectStoreNames].sort();
            const tx = db.transaction(['schema3'], 'readonly');
            const count = await new Promise((resolve, reject) => {
                const req = tx.objectStore('schema3').count();
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            db.close();
            return { names, count };
        }"""
    )
    assert "schema3" in stores["names"]
    assert stores["count"] > 0, (
        "seeded demo data should have been star-written into IndexedDB"
    )
