# tests/e2e/test_drive_sync_merge.py
# Pure three-way merge for Google Drive appDataFolder sync (TODO §1.5/§3.3, src/data/syncMerge.js).
# These pin the actual decisions the design rests on: no wall-clock ordering, deletions win only when
# the other side left the record untouched, and same-record conflicts are reported rather than
# guessed away. Run in-browser like every other pure-module test in this suite (see test_record_id.py
# for why: the app's CSP forbids `new Function`, so there is no eval-based test harness available).
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

MODULE_SCRIPT = """
async () => {{
    const url = new URL('data/syncMerge.js', document.baseURI).href;
    const m = await import(url);
    {body}
}}
"""


def _run(page, local_server, body):
    page.goto(local_server)
    page.wait_for_timeout(300)
    return page.evaluate(MODULE_SCRIPT.format(body=body))


def test_new_records_on_either_side_are_both_kept(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [] };
        const local = { widgets: [{ id: 'a', name: 'local-only' }] };
        const remote = { widgets: [{ id: 'b', name: 'remote-only' }] };
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { ids: mergedState.widgets.map((r) => r.id).sort(), conflicts };
        """,
    )
    assert r["ids"] == ["a", "b"]
    assert r["conflicts"] == []


def test_untouched_record_deleted_remotely_is_dropped(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x' }] };
        const local = { widgets: [{ id: 'a', name: 'x' }] }; // unchanged locally
        const remote = { widgets: [] }; // deleted remotely
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { ids: mergedState.widgets.map((r) => r.id), conflicts };
        """,
    )
    assert r["ids"] == []
    assert r["conflicts"] == []


def test_local_edit_beats_a_remote_deletion_and_is_flagged(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x' }] };
        const local = { widgets: [{ id: 'a', name: 'edited' }] }; // edited locally
        const remote = { widgets: [] }; // deleted remotely
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { kept: mergedState.widgets, conflicts };
        """,
    )
    # Never silently destroy (DATA_MODEL §5): the edit survives the deletion.
    assert r["kept"] == [{"id": "a", "name": "edited"}]
    assert len(r["conflicts"]) == 1
    assert r["conflicts"][0]["type"] == "edit-vs-delete"


def test_untouched_record_deleted_locally_is_dropped(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x' }] };
        const local = { widgets: [] }; // deleted locally
        const remote = { widgets: [{ id: 'a', name: 'x' }] }; // unchanged remotely
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { ids: mergedState.widgets.map((r) => r.id), conflicts };
        """,
    )
    assert r["ids"] == []
    assert r["conflicts"] == []


def test_remote_edit_beats_a_local_deletion_and_is_flagged(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x' }] };
        const local = { widgets: [] }; // deleted locally
        const remote = { widgets: [{ id: 'a', name: 'edited-remotely' }] };
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { kept: mergedState.widgets, conflicts };
        """,
    )
    assert r["kept"] == [{"id": "a", "name": "edited-remotely"}]
    assert len(r["conflicts"]) == 1
    assert r["conflicts"][0]["type"] == "delete-vs-edit"


def test_one_sided_edits_are_taken_without_a_conflict(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x' }, { id: 'b', name: 'y' }] };
        const local = { widgets: [{ id: 'a', name: 'x-edited' }, { id: 'b', name: 'y' }] };
        const remote = { widgets: [{ id: 'a', name: 'x' }, { id: 'b', name: 'y-edited' }] };
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        const byId = Object.fromEntries(mergedState.widgets.map((r) => [r.id, r.name]));
        return { byId, conflicts };
        """,
    )
    assert r["byId"] == {"a": "x-edited", "b": "y-edited"}
    assert r["conflicts"] == []


def test_conflicting_edits_to_the_same_record_prefer_local_and_are_flagged(
    page, local_server
):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x' }] };
        const local = { widgets: [{ id: 'a', name: 'local-edit' }] };
        const remote = { widgets: [{ id: 'a', name: 'remote-edit' }] };
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { kept: mergedState.widgets, conflicts };
        """,
    )
    assert r["kept"] == [{"id": "a", "name": "local-edit"}]
    assert len(r["conflicts"]) == 1
    conflict = r["conflicts"][0]
    assert conflict["type"] == "edit-vs-edit"
    assert conflict["local"]["name"] == "local-edit"
    assert conflict["remote"]["name"] == "remote-edit"


def test_identical_edits_on_both_sides_are_not_a_conflict(page, local_server):
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x' }] };
        const local = { widgets: [{ id: 'a', name: 'same-edit' }] };
        const remote = { widgets: [{ id: 'a', name: 'same-edit' }] };
        const { mergedState, conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { kept: mergedState.widgets, conflicts };
        """,
    )
    assert r["kept"] == [{"id": "a", "name": "same-edit"}]
    assert r["conflicts"] == []


def test_a_repeat_merge_of_the_same_state_is_a_no_op(page, local_server):
    # Poll-on-resume calls syncNow() repeatedly; merging three identical snapshots must converge on
    # that same snapshot, not drift.
    r = _run(
        page,
        local_server,
        """
        const state = { widgets: [{ id: 'a', name: 'x' }, { id: 'b', name: 'y' }] };
        const { mergedState, conflicts } = m.mergeState(['widgets'], {
            base: state, local: state, remote: state,
        });
        return { ids: mergedState.widgets.map((r) => r.id).sort(), conflicts };
        """,
    )
    assert r["ids"] == ["a", "b"]
    assert r["conflicts"] == []


def test_key_order_differences_do_not_look_like_a_conflict(page, local_server):
    # stableStringify exists precisely so a record that round-tripped through JSON (key order can
    # change) never registers as "changed" when nothing about its content did.
    r = _run(
        page,
        local_server,
        """
        const base = { widgets: [{ id: 'a', name: 'x', tag: 'y' }] };
        const local = { widgets: [{ tag: 'y', id: 'a', name: 'x' }] }; // same content, reordered
        const remote = { widgets: [{ id: 'a', name: 'x', tag: 'y' }] };
        const { conflicts } = m.mergeState(['widgets'], { base, local, remote });
        return { conflicts };
        """,
    )
    assert r["conflicts"] == []
