# tests/e2e/test_read_schema_toggle.py
# Which live schema an install READS is a per-trainer choice, and moving between them is a toggle
# rather than a migration (docs/DATA_MODEL.md §4).
#
# That is only true because of the star write: every live schema is written on every save, so a
# newer schema's store is continuously current instead of being built at the moment of switching.
# The upgrade therefore has no wait, no progress bar and no failure mode — and is REVERSIBLE, since
# the schema being left keeps being written too. These tests exist to keep that property, because
# the obvious "optimisation" (write only the schema being read) would break every one of them while
# leaving the app working perfectly until the day someone switched.
#
# The one piece of real work is the BACKFILL: a store a build has just provisioned starts empty and
# would only become current at the next save. It is filled pre-emptively at boot, so what is pinned
# here is that a freshly filled store is COMPLETE, not merely present.
#
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import json

IMPORTS = """
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    const readSchema = await import(new URL('data/readSchema.js', document.baseURI).href);
    const indexedDb = await import(new URL('data/indexedDb.js', document.baseURI).href);
    const queue = await import(new URL('data/writeQueue.js', document.baseURI).href);
"""


def _evaluate(page, body):
    return page.evaluate("async () => { %s\n%s }" % (IMPORTS, body))


def _open_db(page):
    """Every helper needs a handle; opening by name with the live schema list computes the same
    version the app itself opens with, so this is another connection, never an upgrade."""
    return """
        const db = await indexedDb.openDatabase({
            schemas: readSchema.liveSchemas(),
            name: indexedDb.DATABASE_NAME,
        });
    """


def _records_in_schema(page, schema):
    """The ids actually present in ONE schema's store — never in-memory state, which would report
    the same answer whichever store was really being read."""
    return _evaluate(
        page,
        _open_db(page)
        + """
        const name = indexedDb.storeNameForSchema(%s);
        const all = await indexedDb.getAll(db.transaction([name], 'readonly').objectStore(name));
        db.close();
        return all.map((r) => r.id);
        """
        % json.dumps(schema),
    )


def test_every_live_schema_is_current_without_anyone_switching(page, local_server):
    """The pre-emptive half: a trainer who never touches the setting still has every live schema
    complete and ready, because the fan-out and the boot backfill keep them so."""
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    live = _evaluate(page, "return readSchema.liveSchemas();")
    assert len(live) >= 2, "this test is meaningless with only one live schema"

    per_schema = {schema: sorted(_records_in_schema(page, schema)) for schema in live}
    first = per_schema[live[0]]
    assert first, "the demo dataset must have landed in the store"
    for schema, ids in per_schema.items():
        assert ids == first, (
            f"schema {schema} holds a different record set — the fan-out is not writing every "
            f"live schema, so switching to it would lose data"
        )


def test_switching_schema_keeps_every_record_and_is_reversible(page, local_server):
    """A toggle down and back up, with a write in between. Nothing may be lost in either direction:
    the store being left is still written, which is exactly what makes going back safe."""
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    live = _evaluate(page, "return readSchema.liveSchemas();")
    lower, upper = live[0], live[-1]
    before = sorted(_records_in_schema(page, upper))

    _evaluate(
        page,
        _open_db(page)
        + "await readSchema.setReadSchema(db, %s); db.close();" % json.dumps(lower),
    )
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    assert _evaluate(page, "return readSchema.getReadSchema();") == lower, (
        "the choice must survive a reload — it is an install setting, not a session one"
    )

    # A write made while on the older schema must still reach the newer one, or going back would
    # silently drop it.
    _evaluate(
        page,
        """
        const state = store.getState();
        state.clients.push({ id: 'written-on-lower', name: 'Wrote While Downgraded', active: true });
        store.setState(state);
        store.saveToLocalStorage();
        await queue.flushWrites();
        """,
    )
    assert "written-on-lower" in _records_in_schema(page, upper), (
        "a record written while reading an older schema must still be star-written to the newer "
        "one, or switching back would lose it"
    )

    _evaluate(
        page,
        _open_db(page)
        + "await readSchema.setReadSchema(db, %s); db.close();" % json.dumps(upper),
    )
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    after = sorted(_records_in_schema(page, upper))
    assert set(before).issubset(set(after)), "the round trip lost records"
    assert "written-on-lower" in after
    in_memory = _evaluate(page, "return store.getState().clients.map((c) => c.id);")
    assert "written-on-lower" in in_memory, (
        "after switching back the app must actually READ the record it wrote while downgraded"
    )


def test_an_unknown_stored_schema_falls_back_instead_of_stranding_the_install(
    page, local_server
):
    """A build that retires a schema must not strand an install that had opted into it — the
    setting names a store that no longer exists, and the only safe reading is the build's default."""
    page.goto(local_server + "?init=demo_data_load")
    page.wait_for_selector("#view-clients.active")

    page.evaluate("() => window.localStorage.setItem('librept_read_schema', '99')")
    page.goto(local_server)
    page.wait_for_selector("#view-clients.active")

    live = _evaluate(page, "return readSchema.liveSchemas();")
    assert _evaluate(page, "return readSchema.getReadSchema();") in live
    assert _evaluate(page, "return store.getState().clients.length;") > 0, (
        "falling back must still load the trainer's data, not boot empty"
    )
