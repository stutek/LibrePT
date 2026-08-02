# tests/e2e/test_storage_namespace.py
# Per-release storage isolation (TODO §16.2): localStorage is scoped per ORIGIN, so versions hosted
# side by side under one origin would share one bucket unless each release namespaces its keys.
# These tests pin the key scheme, the untagged-build passthrough (which is what every current
# install runs, so it must be a strict no-op), the copy-never-move migration primitive that bounds a
# bad migration's blast radius, and per-version discard.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE = "new URL('data/storageNamespace.js', document.baseURI).href"


def _evaluate(page, body):
    return page.evaluate(
        "async () => { const m = await import(%s); %s }" % (MODULE, body)
    )


def test_untagged_build_uses_the_plain_keys(page, local_server):
    """A dev/untagged build is not a release: it must keep writing exactly where it always has."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """return {
            db: m.namespacedKey('librept_db'),
            explicitDev: m.namespacedKey('librept_db', 'dev'),
            tagged: m.namespacedKey('librept_db', 'v1.2.0'),
            malformed: m.namespacedKey('librept_db', '../evil'),
        };""",
    )

    assert r["db"] == "librept_db"
    assert r["explicitDev"] == "librept_db"
    assert r["tagged"] == "librept_db@v1.2.0"
    # A tag that could escape the key space falls back to the untagged bucket rather than minting one.
    assert r["malformed"] == "librept_db"


def test_the_live_app_persists_to_indexeddb_not_a_versioned_localstorage_bucket(
    page, local_server
):
    """The read/write path moved onto IndexedDB (TODO §18.6 part 4): the seeded demo data lands in
    the `librept` IndexedDB database, and — since this is an untagged build — never in a versioned
    `librept_db@...` localStorage bucket. `librept_db` itself is no longer written by ongoing saves;
    it only still exists as the one-time legacy import source (test_schema_migrations.py covers
    that path), not as this build's live store."""
    page.goto(local_server)
    page.wait_for_selector(".session-card")
    page.wait_for_timeout(300)

    keys = page.evaluate("() => Object.keys(window.localStorage)")
    assert not any(k.startswith("librept_db@") for k in keys), (
        "an untagged build must not create a versioned bucket"
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


def test_copy_bucket_never_mutates_its_source(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """localStorage.setItem('librept_db@v1.0.0', '{"clients":["a"]}');
        localStorage.setItem('librept_active_timers@v1.0.0', '[]');
        localStorage.removeItem('librept_db@v1.1.0');
        localStorage.removeItem('librept_active_timers@v1.1.0');

        const first = m.copyBucket('v1.0.0', 'v1.1.0');
        // Writing under the new version must not reach back into the old one.
        localStorage.setItem('librept_db@v1.1.0', '{"clients":["a","b"]}');
        const second = m.copyBucket('v1.0.0', 'v1.1.0');

        return {
            firstCopied: first.copied,
            source: localStorage.getItem('librept_db@v1.0.0'),
            destination: localStorage.getItem('librept_db@v1.1.0'),
            secondSkipped: second.skipped,
            forced: m.copyBucket('v1.0.0', 'v1.1.0', { overwrite: true }).copied,
            afterForce: localStorage.getItem('librept_db@v1.1.0'),
            sameBucket: m.copyBucket('v1.0.0', 'v1.0.0').skipped,
        };""",
    )

    assert set(r["firstCopied"]) == {"librept_db", "librept_active_timers"}
    # The source is the rollback snapshot — a migration reads it and never touches it.
    assert r["source"] == '{"clients":["a"]}'
    assert r["destination"] == '{"clients":["a","b"]}'
    # Re-accepting an upgrade must not silently discard work done under the new version.
    assert r["secondSkipped"] == "destination-has-data"
    assert set(r["forced"]) == {"librept_db", "librept_active_timers"}
    assert r["afterForce"] == '{"clients":["a"]}'
    assert r["sameBucket"] == "same-bucket"


def test_bucket_listing_and_per_version_discard(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """localStorage.setItem('librept_db', '{}');
        localStorage.setItem('librept_db@v1.0.0', '{}');
        localStorage.setItem('librept_db@v1.1.0', '{}');

        const before = m.listReleaseBuckets().sort();
        const removed = m.discardReleaseBucket('v1.0.0');
        return {
            before,
            removed,
            after: m.listReleaseBuckets().sort(),
            survivor: localStorage.getItem('librept_db@v1.1.0'),
            legacy: localStorage.getItem('librept_db'),
        };""",
    )

    assert r["before"] == ["dev", "v1.0.0", "v1.1.0"]
    assert r["removed"] == ["librept_db"]
    # Discarding an EOL version touches nothing else — that is the whole point of the namespacing.
    assert r["after"] == ["dev", "v1.1.0"]
    assert r["survivor"] == "{}"
    assert r["legacy"] == "{}"


def test_first_tagged_release_adopts_the_legacy_bucket(page, local_server):
    """Upgrading onto the first tagged release seeds it from the plain keys, leaving them intact."""
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = _evaluate(
        page,
        """localStorage.setItem('librept_db', '{"clients":["real"]}');
        localStorage.removeItem('librept_db@v2.0.0');

        const adopted = m.adoptLegacyBucket('v2.0.0');
        return {
            copied: adopted.copied,
            newBucket: localStorage.getItem('librept_db@v2.0.0'),
            legacyKept: localStorage.getItem('librept_db'),
            unreleasedNoop: m.adoptLegacyBucket('dev').skipped,
        };""",
    )

    assert "librept_db" in r["copied"]
    assert r["newBucket"] == '{"clients":["real"]}'
    # The legacy bucket stays put: it is what a rollback returns to.
    assert r["legacyKept"] == '{"clients":["real"]}'
    assert r["unreleasedNoop"] == "unreleased-build"
