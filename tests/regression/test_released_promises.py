# tests/regression/test_released_promises.py — what the RELEASED version promises the trainers who
# are already using it (TODO §62, stage 4).
#
# Ruled 2026-09-19 (Simon): a suite of its own, run against the released schema, because when
# behaviour changes the schema and these tests change together. Stage 3 follows the work in hand and
# reads the shape an upcoming version will use; this stage answers a different question — is what
# shipped still true.
#
# So these are promises, not screens: data survives a reload, a backup carries everything, an
# erasure leaves no name behind, the demo still works. An ordinary change to a button or a label must
# not touch this file; a change here means the released product behaves differently.
#
# The gate pins the schema (`--read-schema=<released>`); `tests/regression/test_frozen_schema.py`
# fails when the released number moves past what this suite was written against.
# Fixtures (page, local_server) come from tests/conftest.py + pytest-playwright.

import pytest

STORE_READY = """async () => {
    const s = await import(new URL('data/stateStore.js', document.baseURI).href);
    return (s.getState().clients || []).length > 0;
}"""

FLUSH = """async () => {
    const q = await import(new URL('data/writeQueue.js', document.baseURI).href);
    await q.flushWrites();
}"""


def _open_register(page, local_server):
    page.goto(local_server + "clients")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_function(STORE_READY)


def test_the_demo_still_works_on_the_released_schema(page, local_server):
    """Ruled 2026-09-19 (Simon): every build checks the demo on the released schema as well as on
    the preview one. A demo that does not load is the first thing a prospective trainer sees."""
    _open_register(page, local_server)

    counts = page.evaluate(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            const state = s.getState();
            return {
                clients: (state.clients || []).length,
                exercises: (state.exercises || []).length,
                routines: (state.routines || []).length,
                sessions: (state.sessions || []).length,
            };
        }"""
    )

    assert counts["clients"] > 0 and counts["exercises"] > 0, counts
    assert counts["routines"] > 0 and counts["sessions"] > 0, counts
    # And it is on the screen, not only in the store.
    assert page.locator(".client-card").count() > 0


def test_what_a_trainer_types_is_still_there_after_a_reload(page, local_server):
    """The promise the whole storage layer exists for. Typed into the real form, read back after a
    real reload — not asserted against the object the form was handed."""
    _open_register(page, local_server)
    page.locator("#btn-add-client").click()
    page.fill("#client-name", "Regression Client")
    page.fill("#client-notes", "Right shoulder, watch overhead work.")
    page.locator("#dialog-client button[type='submit']").click()
    page.evaluate(FLUSH)

    page.reload()
    page.wait_for_function(STORE_READY)

    stored = page.evaluate(
        """async () => {
            const s = await import(new URL('data/stateStore.js', document.baseURI).href);
            return (s.getState().clients || []).find((c) => c.name === 'Regression Client') || null;
        }"""
    )
    assert stored is not None, "a client entered before a reload must survive it"
    assert stored["notes"] == "Right shoulder, watch overhead work."


def test_a_backup_carries_every_collection_the_release_promises(page, local_server):
    """A backup is the only copy that leaves the phone. A collection missing from it is data the
    trainer loses on the day they restore — which is how invitations and repeating sessions were
    nearly lost (§61)."""
    _open_register(page, local_server)

    payload = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const backup = await import(new URL('data/backupFile.js', document.baseURI).href);
            const file = backup.buildBackupPayload(store.getState());
            return {
                schemaVersion: file.schemaVersion,
                collections: Object.fromEntries(
                    ['clients', 'exercises', 'routines', 'sessions', 'history', 'planUpdates',
                     'invites', 'sessionSeries']
                        .map((name) => [name, Array.isArray(file[name])]),
                ),
                clients: (file.clients || []).length,
            };
        }"""
    )

    assert payload["schemaVersion"] == 4, "the file says which shape it holds"
    missing = [name for name, present in payload["collections"].items() if not present]
    assert missing == [], f"a backup written today cannot carry: {missing}"
    assert payload["clients"] > 0


@pytest.mark.clean_start
def test_erasing_a_client_leaves_their_name_nowhere(page, local_server):
    """Article 17 in one assertion: after an erasure, the name must not appear anywhere in the stored
    data — not on the client, not on a session, not in a note a trainer typed (§59, §65)."""
    page.goto(local_server + "clients?init=demo_data_load")
    page.wait_for_selector("#view-client-directory.active")
    page.wait_for_function(STORE_READY)

    remains = page.evaluate(
        """async () => {
            const store = await import(new URL('data/stateStore.js', document.baseURI).href);
            const erasure = await import(new URL('data/clientErasure.js', document.baseURI).href);
            const state = store.getState();
            const client = state.clients[0];
            const name = client.name;
            // Put the name where a trainer would: on their own session and in a note about them.
            const session = (state.sessions || []).find((row) => (row.participants || []).includes(client.id));
            if (session) { session.title = `${name} 1:1`; session.location = `${name}'s flat`; }
            const { state: erased } = erasure.eraseClientInState(state, client.id, {});
            const text = JSON.stringify(erased);
            return { name, hit: text.includes(name) };
        }"""
    )

    assert remains["hit"] is False, (
        f"the erased client's name is still in the database: {remains['name']}"
    )
