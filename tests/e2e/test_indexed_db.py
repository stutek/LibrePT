# tests/e2e/test_indexed_db.py
# The IndexedDB adapter (TODO §18.6). These tests pin the layout constraint the star-write design
# rests on — ONE database with one object store per schema, so a single transaction can span every
# live schema — plus the indexes that make §17.1's lazy per-client load cheap, additive provisioning,
# and the commit-not-request-success promise contract.
#
# Each test uses its own throwaway database name so it never touches the app's, and IndexedDB is
# exercised for real rather than mocked: the transaction lifetime rules these tests encode are
# precisely the part a mock would get wrong.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.


def test_provisions_one_store_per_schema_plus_meta(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/indexedDb.js', document.baseURI).href;
            const m = await import(url);
            const name = 'librept_test_layout';
            await m.deleteDatabase(name);
            const db = await m.openDatabase({ schemas: [2, 3], name });
            const stores = [...db.objectStoreNames].sort();
            const version = db.version;
            db.close();
            await m.deleteDatabase(name);
            return { stores, version, expectedVersion: m.databaseVersion([2, 3]) };
        }"""
    )
    # One database, one store per schema: IndexedDB transactions cannot span databases, so this is
    # what makes an atomic star write across every live schema possible at all.
    assert r["stores"] == ["meta", "schema2", "schema3"]
    # The DB version is derived from the highest schema, so provisioning a schema is the only thing
    # that triggers onupgradeneeded.
    assert r["version"] == r["expectedVersion"] == 3


def test_adding_a_schema_is_additive_and_keeps_existing_records(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/indexedDb.js', document.baseURI).href;
            const m = await import(url);
            const name = 'librept_test_additive';
            await m.deleteDatabase(name);

            let db = await m.openDatabase({ schemas: [2], name });
            await m.withTransaction(db, 'schema2', 'readwrite', (t) => {
                m.put(t.store('schema2'), { id: 'a1', collection: 'clients', name: 'Jane' });
            });
            db.close();

            // Reopen with a newly live schema — the existing store must survive untouched.
            db = await m.openDatabase({ schemas: [2, 3], name });
            const stores = [...db.objectStoreNames].sort();
            let kept = null;
            await m.withTransaction(db, 'schema2', 'readonly', (t) => {
                m.get(t.store('schema2'), 'a1').then((v) => { kept = v; });
            });
            db.close();
            await m.deleteDatabase(name);
            return { stores, kept };
        }"""
    )
    assert r["stores"] == ["meta", "schema2", "schema3"]
    # Provisioning a new schema must never disturb a bucket a trainer is actively using.
    assert r["kept"]["name"] == "Jane"


def test_one_transaction_spans_every_schema_store(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/indexedDb.js', document.baseURI).href;
            const m = await import(url);
            const name = 'librept_test_fanout';
            await m.deleteDatabase(name);
            const db = await m.openDatabase({ schemas: [2, 3], name });

            // The star write: one record projected into every live schema, atomically.
            await m.withTransaction(db, ['schema2', 'schema3'], 'readwrite', (t) => {
                m.put(t.store('schema2'), { id: 'h1', collection: 'history', reps: 8 });
                m.put(t.store('schema3'), { id: 'h1', collection: 'history', reps: 8, rounds: 4 });
            });

            let two = null;
            let three = null;
            await m.withTransaction(db, ['schema2', 'schema3'], 'readonly', (t) => {
                m.get(t.store('schema2'), 'h1').then((v) => { two = v; });
                m.get(t.store('schema3'), 'h1').then((v) => { three = v; });
            });
            db.close();
            await m.deleteDatabase(name);
            return { two, three };
        }"""
    )
    assert r["two"]["reps"] == 8
    # The newer schema carries the field the older one cannot represent — §18.4's projection.
    assert r["three"]["rounds"] == 4


def test_a_failed_fanout_commits_nothing(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/indexedDb.js', document.baseURI).href;
            const m = await import(url);
            const name = 'librept_test_atomic';
            await m.deleteDatabase(name);
            const db = await m.openDatabase({ schemas: [2, 3], name });

            let rejected = false;
            try {
                await m.withTransaction(db, ['schema2', 'schema3'], 'readwrite', (t) => {
                    m.put(t.store('schema2'), { id: 'x1', collection: 'history' });
                    // The second projection throws — the first must not survive it.
                    throw new Error('projection failed');
                });
            } catch { rejected = true; }

            let leaked = null;
            await m.withTransaction(db, 'schema2', 'readonly', (t) => {
                m.get(t.store('schema2'), 'x1').then((v) => { leaked = v; });
            });
            db.close();
            await m.deleteDatabase(name);
            return { rejected, leaked };
        }"""
    )
    assert r["rejected"] is True
    # A phone locking mid-fan-out must not leave one schema written and another not.
    assert r["leaked"] is None


def test_indexes_support_collection_scan_and_lazy_per_client_load(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async () => {
            const url = new URL('data/indexedDb.js', document.baseURI).href;
            const m = await import(url);
            const name = 'librept_test_indexes';
            await m.deleteDatabase(name);
            const db = await m.openDatabase({ schemas: [2], name });

            await m.withTransaction(db, 'schema2', 'readwrite', (t) => {
                const s = t.store('schema2');
                m.put(s, { id: 'h1', collection: 'history', clientId: 'c1' });
                m.put(s, { id: 'h2', collection: 'history', clientId: 'c1' });
                m.put(s, { id: 'h3', collection: 'history', clientId: 'c2' });
                // Same client as h1/h2, DIFFERENT collection — the fixture CLIENT_INDEX alone
                // cannot isolate, and CLIENT_COLLECTION_INDEX exists specifically to.
                m.put(s, { id: 'p1', collection: 'planUpdates', clientId: 'c1' });
                m.put(s, { id: 'e1', collection: 'exercises' });
            });

            let history = null;
            let forClient = null;
            let historyForClient = null;
            let historyCount = null;
            let total = null;
            await m.withTransaction(db, 'schema2', 'readonly', (t) => {
                const s = t.store('schema2');
                m.getAllFromIndex(s, m.COLLECTION_INDEX, 'history').then((v) => { history = v; });
                m.getAllFromIndex(s, m.CLIENT_INDEX, 'c1').then((v) => { forClient = v; });
                m.getAllFromIndex(s, m.CLIENT_COLLECTION_INDEX, ['c1', 'history'])
                    .then((v) => { historyForClient = v; });
                m.countInIndex(s, m.COLLECTION_INDEX, 'history').then((v) => { historyCount = v; });
                m.countAll(s).then((v) => { total = v; });
            });
            db.close();
            await m.deleteDatabase(name);
            return {
                history: history.length,
                forClient: forClient.map((r) => r.id).sort(),
                historyForClient: historyForClient.map((r) => r.id).sort(),
                historyCount,
                total,
            };
        }"""
    )
    assert r["history"] == 3
    # CLIENT_INDEX alone: everything about client c1, history AND planUpdates interleaved — the
    # shape §17.3's whole-client erasure/anonymization sweep wants, not the shape §17.1 wants.
    assert r["forClient"] == ["h1", "h2", "p1"]
    # CLIENT_COLLECTION_INDEX: §17.1's actual lazy per-client load — client c1's history ONLY, one
    # exact index hit, p1 excluded without a client-side filter over a record nobody asked to load.
    assert r["historyForClient"] == ["h1", "h2"]
    # The catalog has no owner, so it is absent from both client-scoped indexes rather than bucketed.
    assert r["total"] == 5
    # count() goes through the index B-tree — this is what makes §18.3's completeness query cheap.
    assert r["historyCount"] == 3


# --- Injection: the query-language question, answered for a store that has none -----------------
# LibrePT has no SQL. Storage is IndexedDB (plus localStorage), and SQLite-wasm was considered and
# rejected (TODO §3.7/§18.6), so there is no query string for a payload to break out of — an
# `' OR 1=1 --` in a client name is inert because nothing ever parses it. That is an architectural
# property, not a lucky one, and this test exists to keep it true: it drives hostile values through
# every lookup path the app actually uses (primary key, single index, compound index, count) and
# asserts they behave as OPAQUE DATA — matching themselves exactly and nothing else.
#
# The failure it guards against is a future regression, not today's code: the moment anyone builds a
# lookup by string-assembling a key, or reaches for a query language, "it round-trips exactly"
# stops holding and this fails. ZAP cannot cover any of it — the baseline scan is passive and none
# of this crosses the network.
INJECTION_PAYLOADS = [
    "' OR 1=1 --",
    '"; DROP TABLE clients; --',
    "1; DELETE FROM history WHERE 1=1",
    "c1' UNION SELECT * FROM sqlite_master --",
    "__proto__",
    "constructor.prototype.polluted",
]


def test_hostile_keys_and_index_values_are_stored_as_opaque_data(page, local_server):
    page.goto(local_server)
    page.wait_for_timeout(300)

    r = page.evaluate(
        """async (payloads) => {
            const url = new URL('data/indexedDb.js', document.baseURI).href;
            const m = await import(url);
            const name = 'librept_test_injection';
            await m.deleteDatabase(name);
            const db = await m.openDatabase({ schemas: [2], name });

            // Each payload is BOTH a primary key and an indexed clientId, so a lookup that
            // mis-parsed one would surface as a wrong match on either path.
            await m.withTransaction(db, 'schema2', 'readwrite', (t) => {
                const s = t.store('schema2');
                for (const p of payloads) {
                    m.put(s, { id: p, collection: 'history', clientId: p, marker: p });
                }
                m.put(s, { id: 'benign', collection: 'history', clientId: 'c1', marker: 'benign' });
            });

            // Accumulate into ARRAYS of pairs, not objects keyed by the payload: `obj["__proto__"] = v`
            // does not create an own property in JS, so an object accumulator silently loses exactly
            // the payload this test most wants to report on.
            const byKey = [];
            const byClient = [];
            const byCompound = [];
            let total = null;
            await m.withTransaction(db, 'schema2', 'readonly', (t) => {
                const s = t.store('schema2');
                for (const p of payloads) {
                    m.get(s, p).then((v) => { byKey.push([p, v ? v.marker : null]); });
                    m.getAllFromIndex(s, m.CLIENT_INDEX, p)
                        .then((v) => { byClient.push([p, v.map((x) => x.id)]); });
                    m.getAllFromIndex(s, m.CLIENT_COLLECTION_INDEX, [p, 'history'])
                        .then((v) => { byCompound.push([p, v.map((x) => x.id)]); });
                }
                m.countAll(s).then((v) => { total = v; });
            });
            db.close();
            await m.deleteDatabase(name);
            return { byKey, byClient, byCompound, total, polluted: {}.polluted ?? null };
        }""",
        INJECTION_PAYLOADS,
    )

    by_key = dict(r["byKey"])
    by_client = dict(r["byClient"])
    by_compound = dict(r["byCompound"])

    # Every payload stored and came back byte-identical: it was a key, never a fragment of one.
    for payload in INJECTION_PAYLOADS:
        assert by_key[payload] == payload, (
            f"payload did not round-trip as an exact key: {payload!r}"
        )
        # And it matched ONLY its own record — no widening, which is what an injected
        # `OR 1=1` would produce if anything were parsing these.
        assert by_client[payload] == [payload], (
            f"index lookup matched more than its own record for {payload!r}"
        )
        assert by_compound[payload] == [payload], (
            f"compound index lookup widened for {payload!r}"
        )

    # Nothing was deleted or dropped: all payloads plus the benign record survive.
    assert r["total"] == len(INJECTION_PAYLOADS) + 1, (
        "a payload altered the store's contents — it was not treated as opaque data"
    )
    # `__proto__`/`constructor.prototype` as KEYS must not reach Object.prototype.
    assert r["polluted"] is None, (
        "storing a __proto__-shaped key polluted Object.prototype"
    )
