# tests/e2e/test_drive_sync_conflict_resolution.py
# resolveSyncConflict() (src/data/driveSyncService.js, TODO §3.3) — the "not built" gap that section
# used to flag: a sync's three-way merge (syncMerge.js) already applies a safe default per conflict
# and reports it, but nothing let a trainer override that default. This pins the override itself:
# it doesn't re-run the merge, it replaces (or deletes) the one record in local state that the
# conflict names. Run in-browser like every other pure-module test in this suite (see
# test_record_id.py for why: the app's CSP forbids `new Function`, so there is no eval-based test
# harness available).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE_SCRIPT = """
async () => {{
    const svc = await import(new URL('data/driveSyncService.js', document.baseURI).href);
    const store = await import(new URL('data/stateStore.js', document.baseURI).href);
    {body}
}}
"""


def _run(page, local_server, body):
    page.goto(local_server)
    page.wait_for_timeout(300)
    return page.evaluate(MODULE_SCRIPT.format(body=body))


def test_keeping_the_remote_side_overwrites_the_local_record(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const state = store.getState();
        state.exercises = [{ id: 'ex1', name: 'local-name' }];
        store.setState(state);

        const conflict = {
            collection: 'exercises', id: 'ex1', type: 'edit-vs-edit',
            local: { id: 'ex1', name: 'local-name' },
            remote: { id: 'ex1', name: 'remote-name' },
        };
        svc.resolveSyncConflict(conflict, 'remote');
        return store.getState().exercises;
        """,
    )
    assert r == [{"id": "ex1", "name": "remote-name"}]


def test_keeping_the_local_side_leaves_the_record_unchanged(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const state = store.getState();
        state.exercises = [{ id: 'ex1', name: 'local-name' }];
        store.setState(state);

        const conflict = {
            collection: 'exercises', id: 'ex1', type: 'edit-vs-edit',
            local: { id: 'ex1', name: 'local-name' },
            remote: { id: 'ex1', name: 'remote-name' },
        };
        svc.resolveSyncConflict(conflict, 'local');
        return store.getState().exercises;
        """,
    )
    assert r == [{"id": "ex1", "name": "local-name"}]


def test_choosing_the_deleted_side_removes_the_survivor(page, local_server):
    # delete-vs-edit / edit-vs-delete conflicts report the deleted side as null (syncMerge.js) — a
    # trainer picking that side is how the merge's "an edit always wins" default gets overridden
    # back to honouring the deletion.
    r = _run(
        page,
        local_server,
        """
        const state = store.getState();
        state.exercises = [{ id: 'ex1', name: 'edited-elsewhere' }];
        store.setState(state);

        const conflict = {
            collection: 'exercises', id: 'ex1', type: 'delete-vs-edit',
            local: null, remote: { id: 'ex1', name: 'edited-elsewhere' },
        };
        svc.resolveSyncConflict(conflict, 'local');
        return store.getState().exercises;
        """,
    )
    assert r == []


def test_resolving_one_conflict_leaves_unrelated_records_untouched(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const state = store.getState();
        state.exercises = [
            { id: 'ex1', name: 'local-name' },
            { id: 'ex2', name: 'untouched' },
        ];
        store.setState(state);

        const conflict = {
            collection: 'exercises', id: 'ex1', type: 'edit-vs-edit',
            local: { id: 'ex1', name: 'local-name' },
            remote: { id: 'ex1', name: 'remote-name' },
        };
        svc.resolveSyncConflict(conflict, 'remote');
        return store.getState().exercises.map((r) => r.id).sort();
        """,
    )
    assert r == ["ex1", "ex2"]
